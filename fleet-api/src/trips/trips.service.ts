import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Trip, TripStatus } from '../entities/trip.entity';
import { TripOrder } from '../entities/trip-order.entity';
import { Order, OrderStatus } from '../entities/order.entity';
import { Vehicle, VehicleStatus } from '../entities/vehicle.entity';
import { Driver, DriverStatus } from '../entities/driver.entity';
import { Alert, AlertType, AlertSeverity } from '../entities/alert.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReportIncidentDto, FindTripsQueryDto } from './dto/trip.dto';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private tripRepository: Repository<Trip>,
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
    private dataSource: DataSource,
    private eventEmitter: EventEmitter2,
  ) {}

  async findMyTrips(userId: string, role?: string) {
    // If admin, they can see all active trips to test the app
    if (role === 'admin') {
      return this.tripRepository.find({
        relations: ['vehicle', 'driver', 'tripOrders', 'tripOrders.order'],
        order: { createdAt: 'DESC' },
      });
    }

    return this.tripRepository.find({
      where: [{ driver: { userId } }],
      relations: ['vehicle', 'driver', 'tripOrders', 'tripOrders.order'],
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
      relations: ['vehicle', 'driver', 'tripOrders', 'tripOrders.order'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const trip = await this.tripRepository.findOne({
      where: { id },
      relations: ['vehicle', 'driver', 'tripOrders', 'tripOrders.order'],
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
        relations: ['driver', 'vehicle', 'tripOrders', 'tripOrders.order'],
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

        if (tripOrders) {
          for (const tripOrder of tripOrders) {
            if (tripOrder.order) {
              tripOrder.order.status = OrderStatus.PENDING;
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

      const savedTrip = await queryRunner.manager.save(Trip, trip);
      await queryRunner.commitTransaction();

      // Retrieve driver's full name for operational logs
      let driverName = 'Driver';
      if (savedTrip.driverId) {
        const driverWithUser = await this.tripRepository.manager.findOne(Driver, {
          where: { id: savedTrip.driverId },
          relations: ['user'],
        });
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

    // Emit event so the gateway can push socket messages
    this.eventEmitter.emit('alert.created', savedAlert);

    return savedAlert;
  }
}
