import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  DataSource,
  In,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
} from 'typeorm';
import { Trip, TripStatus } from '../entities/trip.entity';
import { TripOrder } from '../entities/trip-order.entity';
import { Order, OrderStatus } from '../entities/order.entity';
import { Vehicle, VehicleStatus } from '../entities/vehicle.entity';
import { Driver, DriverStatus } from '../entities/driver.entity';
import { Alert, AlertType, AlertSeverity } from '../entities/alert.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReportIncidentDto, FindTripsQueryDto } from './dto/trip.dto';
import { OptimizationService } from '../optimization/optimization.service';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private tripRepository: Repository<Trip>,
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
    private dataSource: DataSource,
    private eventEmitter: EventEmitter2,
    private optimizationService: OptimizationService,
  ) {}

  async findMyTrips(
    userId: string,
    role?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const whereClause: any = {};

    if (role !== 'admin') {
      whereClause.driver = { userId };
    }

    if (startDate || endDate) {
      if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt = Between(start, end);
      } else if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        whereClause.createdAt = MoreThanOrEqual(start);
      } else if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt = LessThanOrEqual(end);
      }
    }

    return this.tripRepository.find({
      where: whereClause,
      relations: [
        'vehicle',
        'driver',
        'driver.user',
        'tripOrders',
        'tripOrders.order',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(query?: FindTripsQueryDto) {
    const { driverId, vehicleId, status } = query || {};
    return this.tripRepository.find({
      where: {
        driverId,
        vehicleId,
        status,
      },
      relations: [
        'vehicle',
        'driver',
        'driver.user',
        'tripOrders',
        'tripOrders.order',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const trip = await this.tripRepository.findOne({
      where: { id },
      relations: [
        'vehicle',
        'driver',
        'driver.user',
        'tripOrders',
        'tripOrders.order',
      ],
    });
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${id} not found`);
    }
    return trip;
  }

  async updateStatus(
    id: string,
    status: TripStatus,
    userId: string,
    role: string,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const trip = await queryRunner.manager.findOne(Trip, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!trip) {
        throw new NotFoundException(`Trip with ID ${id} not found`);
      }

      // Fetch relations separately to avoid "FOR UPDATE cannot be applied to the nullable side of an outer join"
      // We don't necessarily need to lock these rows for reading permission/metadata,
      // but we do need the data.
      const fullTrip = await queryRunner.manager.findOne(Trip, {
        where: { id },
        relations: [
          'driver',
          'driver.user',
          'vehicle',
          'tripOrders',
          'tripOrders.order',
        ],
      });

      if (!fullTrip) {
        throw new NotFoundException(
          `Trip with ID ${id} data could not be re-loaded`,
        );
      }

      // Capture the correct IDs securely before relations override them in memory
      const driverId =
        trip.driverId || fullTrip.driverId || fullTrip.driver?.id || null;
      const vehicleId =
        trip.vehicleId || fullTrip.vehicleId || fullTrip.vehicle?.id || null;

      // Update our locked trip object with relation data
      trip.driver = fullTrip.driver;
      trip.vehicle = fullTrip.vehicle;
      trip.tripOrders = fullTrip.tripOrders;

      // Explicitly synchronize ID fields to avoid TypeORM losing them in memory
      trip.driverId = driverId;
      trip.vehicleId = vehicleId;

      // Check if user is the assigned driver or admin
      const isDriver = role === 'driver';
      const isAdmin = role === 'admin' || role === 'dispatcher';

      if (isDriver && trip.driver && trip.driver.userId !== userId) {
        throw new ForbiddenException('You are not assigned to this trip');
      }

      // Validate transitions
      this.validateTransition(trip.status, status);

      trip.status = status;

      if (status === TripStatus.ACCEPTED) {
        if (driverId) {
          // Check if there is already an active running trip for this driver
          const runningTrip = await queryRunner.manager.findOne(Trip, {
            where: {
              driverId,
              status: In([TripStatus.ACCEPTED, TripStatus.IN_PROGRESS]),
            },
            lock: { mode: 'pessimistic_write' },
          });

          if (runningTrip) {
            // Merge this accepted trip's orders into the runningTrip!
            const pendingTripOrders = await queryRunner.manager.find(
              TripOrder,
              {
                where: { tripId: trip.id },
                relations: ['order'],
              },
            );

            const runningTripOrders = await queryRunner.manager.find(
              TripOrder,
              {
                where: { tripId: runningTrip.id },
              },
            );

            const maxSequence = runningTripOrders.reduce(
              (max, to) => Math.max(max, to.sequence),
              0,
            );

            // Re-assign the TripOrder records to target the runningTrip
            for (let i = 0; i < pendingTripOrders.length; i++) {
              const pendingTO = pendingTripOrders[i];
              pendingTO.tripId = runningTrip.id;
              pendingTO.sequence = maxSequence + i + 1;
              await queryRunner.manager.save(TripOrder, pendingTO);

              if (pendingTO.order) {
                pendingTO.order.status = OrderStatus.ASSIGNED;
                await queryRunner.manager.save(Order, pendingTO.order);
              }
            }

            // Remove the pending trip
            await queryRunner.manager.delete(Trip, { id: trip.id });

            // Commit transaction
            await queryRunner.commitTransaction();

            // Asynchronously optimize route for the runningTrip
            try {
              await this.optimizationService.optimizeTripRoute(runningTrip.id);
            } catch (optErr) {
              console.error(
                'Failed to optimize trip route after merge:',
                optErr,
              );
            }

            // Emit event for deleted pending trip (merged into active trip)
            this.eventEmitter.emit('trip.status_changed', {
              id: trip.id,
              status: 'merged' as any,
              vehicleId: trip.vehicleId,
              driverId: trip.driverId,
            });

            // Get running trip driver user full name for notification
            let driverName = 'Driver';
            const driverWithUser = await this.tripRepository.manager.findOne(
              Driver,
              {
                where: { id: runningTrip.driverId! },
                relations: ['user'],
              },
            );
            if (driverWithUser && driverWithUser.user) {
              driverName = driverWithUser.user.fullName;
            }

            // Emit status changed for the runningTrip to trigger driver app sync
            this.eventEmitter.emit('trip.status_changed', {
              id: runningTrip.id,
              status: runningTrip.status,
              vehicleId: runningTrip.vehicleId,
              driverId: runningTrip.driverId,
              driverName,
            });

            return runningTrip;
          }

          const driver = await queryRunner.manager.findOne(Driver, {
            where: { id: driverId },
          });
          if (driver) {
            driver.status = DriverStatus.ON_TRIP;
            await queryRunner.manager.save(Driver, driver);
          }
        }

        // Ensure vehicle status is DELIVERING
        if (vehicleId) {
          const vehicle = await queryRunner.manager.findOne(Vehicle, {
            where: { id: vehicleId },
          });
          if (vehicle) {
            vehicle.status = VehicleStatus.DELIVERING;
            await queryRunner.manager.save(Vehicle, vehicle);
          }
        }
      }

      if (status === TripStatus.IN_PROGRESS) {
        trip.startedAt = new Date();
      }

      if (status === TripStatus.COMPLETED) {
        trip.completedAt = new Date();

        // Update orders to DELIVERED
        if (trip.tripOrders) {
          for (const tripOrder of trip.tripOrders) {
            if (tripOrder.order) {
              tripOrder.order.status = OrderStatus.DELIVERED;
              await queryRunner.manager.save(Order, tripOrder.order);
            }
          }
        }

        // Update Vehicle & Driver back to AVAILABLE
        if (vehicleId) {
          const vehicle = await queryRunner.manager.findOne(Vehicle, {
            where: { id: vehicleId },
          });
          if (vehicle) {
            vehicle.status = VehicleStatus.AVAILABLE;
            vehicle.currentLoadKg = 0;
            await queryRunner.manager.save(Vehicle, vehicle);
          }
        }

        if (driverId) {
          const driver = await queryRunner.manager.findOne(Driver, {
            where: { id: driverId },
          });
          if (driver) {
            driver.status = DriverStatus.AVAILABLE;
            await queryRunner.manager.save(Driver, driver);
          }
        }
      }

      if (status === TripStatus.CANCELLED) {
        // Query trip orders directly to be 100% robust and bypass any TypeORM relations lazy-loading issues
        const tripOrders = await queryRunner.manager.find(TripOrder, {
          where: { tripId: trip.id },
          relations: ['order'],
        });

        if (tripOrders && tripOrders.length > 0) {
          for (const tripOrder of tripOrders) {
            if (tripOrder.order) {
              tripOrder.order.status = OrderStatus.PENDING;
              await queryRunner.manager.save(Order, tripOrder.order);
            }
          }
          // Delete all TripOrder links for this cancelled trip to completely disassociate the orders from the driver/trip
          await queryRunner.manager.delete(TripOrder, { tripId: trip.id });
        }

        // Update Vehicle & Driver back to AVAILABLE
        if (vehicleId) {
          const vehicle = await queryRunner.manager.findOne(Vehicle, {
            where: { id: vehicleId },
          });
          if (vehicle) {
            vehicle.status = VehicleStatus.AVAILABLE;
            vehicle.currentLoadKg = 0;
            await queryRunner.manager.save(Vehicle, vehicle);
          }
        }

        if (driverId) {
          const driver = await queryRunner.manager.findOne(Driver, {
            where: { id: driverId },
          });
          if (driver) {
            driver.status = DriverStatus.AVAILABLE;
            await queryRunner.manager.save(Driver, driver);
          }
        }
      }

      const savedTrip = await queryRunner.manager.save(Trip, trip);
      await queryRunner.commitTransaction();

      // Retrieve driver's full name for operational logs
      let driverName = 'Driver';
      if (savedTrip.driverId) {
        const driverWithUser = await this.tripRepository.manager.findOne(
          Driver,
          {
            where: { id: savedTrip.driverId },
            relations: ['user'],
          },
        );
        if (driverWithUser && driverWithUser.user) {
          driverName = driverWithUser.user.fullName;
        }
      }

      // Emit status change event
      this.eventEmitter.emit('trip.status_changed', {
        id: savedTrip.id,
        status: savedTrip.status,
        vehicleId: savedTrip.vehicleId,
        driverId: savedTrip.driverId,
        driverName,
      });

      return savedTrip;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private validateTransition(current: TripStatus, next: TripStatus) {
    const allowed: Record<TripStatus, TripStatus[]> = {
      [TripStatus.PENDING]: [TripStatus.ACCEPTED, TripStatus.CANCELLED],
      [TripStatus.ACCEPTED]: [TripStatus.IN_PROGRESS, TripStatus.CANCELLED],
      [TripStatus.IN_PROGRESS]: [TripStatus.COMPLETED, TripStatus.CANCELLED],
      [TripStatus.COMPLETED]: [],
      [TripStatus.CANCELLED]: [],
    };

    if (!allowed[current].includes(next)) {
      throw new BadRequestException(
        `Invalid transition from ${current} to ${next}`,
      );
    }
  }

  async reportIncident(
    tripId: string,
    dto: ReportIncidentDto,
    userId: string,
    role?: string,
  ) {
    const trip = await this.tripRepository.findOne({
      where: { id: tripId },
      relations: ['driver'],
    });

    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    const isAdmin = role === 'admin' || role === 'dispatcher';
    if (!isAdmin && trip.driver && trip.driver.userId !== userId) {
      throw new ForbiddenException(
        'You can only report incidents for your assigned trips',
      );
    }

    const alert = this.alertRepository.create({
      tripId,
      vehicleId: trip.vehicleId!,
      driverId: trip.driverId,
      type: AlertType.INCIDENT,
      severity: dto.severity || AlertSeverity.HIGH,
      message: dto.message,
      location:
        dto.latitude && dto.longitude
          ? {
              type: 'Point',
              coordinates: [dto.longitude, dto.latitude],
            }
          : null,
      isResolved: false,
    });

    const savedAlert = await this.alertRepository.save(alert);

    // Load vehicle relation so the admin gets the license plate details
    const populatedAlert = await this.alertRepository.findOne({
      where: { id: savedAlert.id },
      relations: ['vehicle'],
    });

    // Emit event so the gateway can push socket messages
    this.eventEmitter.emit('alert.new', populatedAlert || savedAlert);

    return savedAlert;
  }
}
