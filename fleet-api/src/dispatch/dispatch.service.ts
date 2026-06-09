import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { Vehicle, VehicleStatus } from '../entities/vehicle.entity';
import { Trip, TripStatus } from '../entities/trip.entity';
import { TripOrder } from '../entities/trip-order.entity';
import { Driver, DriverStatus } from '../entities/driver.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OptimizationService } from '../optimization/optimization.service';

@Injectable()
export class DispatchService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Trip)
    private tripRepository: Repository<Trip>,
    private dataSource: DataSource,
    private eventEmitter: EventEmitter2,
    private optimizationService: OptimizationService,
  ) {}

  async suggestVehicles(orderId: string) {
    const order = await this.orderRepository.findOneBy({ id: orderId });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order is already assigned or completed');
    }

    // Find available vehicles sorted by distance
    // AC-DIS-01: Filter by availability, capacity, and license expiry
    const result = await this.vehicleRepository
      .createQueryBuilder('vehicle')
      .innerJoinAndSelect('vehicle.driver', 'driver')
      .leftJoinAndSelect('driver.user', 'driverUser')
      .where('vehicle.status IN (:...vStatuses)', {
        vStatuses: [VehicleStatus.AVAILABLE, VehicleStatus.DELIVERING],
      })
      .andWhere('driver.status IN (:...dStatuses)', {
        dStatuses: [DriverStatus.AVAILABLE, DriverStatus.ON_TRIP],
      })
      .andWhere('driver.license_expiry > :today', { today: new Date() })
      .andWhere('vehicle.last_known_location IS NOT NULL') // Avoid null location issues
      .andWhere(
        'vehicle.max_capacity_kg - vehicle.current_load_kg >= :weight',
        { weight: order.weightKg },
      )
      .addSelect(
        'ST_Distance(vehicle.last_known_location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)',
        'distance',
      )
      .setParameters({
        lng: order.pickupLocation.coordinates[0],
        lat: order.pickupLocation.coordinates[1],
      })
      .orderBy('distance', 'ASC')
      .limit(5)
      .getRawAndEntities();

    // Map to DispatchSuggestion format
    return result.entities.map((vehicle, index) => {
      // TypeORM aliased selects are in raw[index].distance
      const distanceMeters = parseFloat(result.raw[index].distance);
      return {
        vehicle,
        driver: vehicle.driver,
        distanceKm: isNaN(distanceMeters) ? 0 : distanceMeters / 1000,
        freeCapacityKg:
          Number(vehicle.maxCapacityKg) - Number(vehicle.currentLoadKg),
        kpiScore: 0, // In future, fetch from DriverKpi
      };
    });
  }

  async assignOrder(orderId: string, vehicleId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(Order, {
        where: { id: orderId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException('Order is not in PENDING status');
      }

      const vehicle = await queryRunner.manager.findOne(Vehicle, {
        where: { id: vehicleId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!vehicle) {
        throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
      }

      if (!vehicle.driverId) {
        throw new BadRequestException('Vehicle has no driver assigned');
      }

      // Fetch driver with lock separately to avoid "FOR UPDATE cannot be applied to the nullable side of an outer join"
      const driver = await queryRunner.manager.findOne(Driver, {
        where: { id: vehicle.driverId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!driver) {
        throw new NotFoundException(
          `Driver for vehicle ${vehicleId} not found`,
        );
      }

      // Attach driver to vehicle object for compatibility with existing logic
      vehicle.driver = driver;

      if (
        vehicle.status !== VehicleStatus.AVAILABLE &&
        vehicle.status !== VehicleStatus.DELIVERING
      ) {
        throw new BadRequestException(
          'Vehicle is not available for assignment',
        );
      }

      if (!vehicle.driver) {
        throw new BadRequestException('Vehicle has no driver assigned');
      }

      if (
        vehicle.driver.status !== DriverStatus.AVAILABLE &&
        vehicle.driver.status !== DriverStatus.ON_TRIP
      ) {
        throw new BadRequestException('Driver is off duty or not available');
      }

      if (
        Number(vehicle.maxCapacityKg) - Number(vehicle.currentLoadKg) <
        Number(order.weightKg)
      ) {
        throw new BadRequestException('Vehicle capacity exceeded');
      }

      let activeTrip: Trip | null = null;
      if (vehicle.status === VehicleStatus.DELIVERING) {
        // Find existing active pending trip
        activeTrip = await queryRunner.manager.findOne(Trip, {
          where: {
            vehicleId: vehicle.id,
            driverId: vehicle.driverId,
            status: TripStatus.PENDING,
          },
          lock: { mode: 'pessimistic_write' },
        });
      }

      let savedTrip: Trip;
      if (activeTrip) {
        // Use existing active trip
        savedTrip = activeTrip;

        // Find max sequence in current tripOrders
        const tripOrders = await queryRunner.manager.find(TripOrder, {
          where: { tripId: activeTrip.id },
        });
        const maxSequence = tripOrders.reduce(
          (max, to) => Math.max(max, to.sequence),
          0,
        );

        // Link Order to existing Trip
        const tripOrder = queryRunner.manager.create(TripOrder, {
          tripId: activeTrip.id,
          orderId: order.id,
          sequence: maxSequence + 1,
        });
        await queryRunner.manager.save(TripOrder, tripOrder);
      } else {
        // Create Trip
        const trip = queryRunner.manager.create(Trip, {
          vehicleId: vehicle.id,
          driverId: vehicle.driverId,
          status: TripStatus.PENDING,
        });
        savedTrip = await queryRunner.manager.save(Trip, trip);

        // Link Order to Trip
        const tripOrder = queryRunner.manager.create(TripOrder, {
          tripId: savedTrip.id,
          orderId: order.id,
          sequence: 1,
        });
        await queryRunner.manager.save(TripOrder, tripOrder);
      }

      // Update Order Status
      order.status = OrderStatus.ASSIGNED;
      await queryRunner.manager.save(Order, order);

      // Update Vehicle Status and Load
      vehicle.status = VehicleStatus.DELIVERING;
      vehicle.currentLoadKg =
        Number(vehicle.currentLoadKg) + Number(order.weightKg);
      await queryRunner.manager.save(Vehicle, vehicle);

      await queryRunner.commitTransaction();

      // Optimize route using Mapbox API asynchronously (after transaction commit)
      try {
        await this.optimizationService.optimizeTripRoute(savedTrip.id);
      } catch (optErr) {
        // We log the error but don't fail the assignment since Mapbox might fail or be unconfigured
        console.error(
          'Failed to optimize trip route after assignment:',
          optErr,
        );
      }

      // Emit event for real-time notification
      this.eventEmitter.emit('trip.assigned', savedTrip);

      return savedTrip;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async assignBulkOrders(orderIds: string[], vehicleId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Deduplicate order IDs
      const uniqueOrderIds = [...new Set(orderIds)];

      const vehicle = await queryRunner.manager.findOne(Vehicle, {
        where: { id: vehicleId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!vehicle) {
        throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
      }

      if (!vehicle.driverId) {
        throw new BadRequestException('Vehicle has no driver assigned');
      }

      // Fetch driver with lock separately to avoid "FOR UPDATE cannot be applied to the nullable side of an outer join"
      const driver = await queryRunner.manager.findOne(Driver, {
        where: { id: vehicle.driverId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!driver) {
        throw new NotFoundException(
          `Driver for vehicle ${vehicleId} not found`,
        );
      }

      // Attach driver to vehicle object for compatibility with existing logic
      vehicle.driver = driver;

      if (
        vehicle.status !== VehicleStatus.AVAILABLE &&
        vehicle.status !== VehicleStatus.DELIVERING
      ) {
        throw new BadRequestException(
          'Vehicle is not available for assignment',
        );
      }

      if (!vehicle.driver) {
        throw new BadRequestException('Vehicle has no driver assigned');
      }

      if (
        vehicle.driver.status !== DriverStatus.AVAILABLE &&
        vehicle.driver.status !== DriverStatus.ON_TRIP
      ) {
        throw new BadRequestException('Driver is off duty or not available');
      }

      // 2. Batch fetch orders
      const fetchedOrders = await queryRunner.manager.find(Order, {
        where: { id: In(uniqueOrderIds) },
        lock: { mode: 'pessimistic_write' },
      });

      // Sort fetched orders to match the input orderIds sequence
      const orders = uniqueOrderIds
        .map((id) => fetchedOrders.find((o) => o.id === id))
        .filter(Boolean) as Order[];

      if (orders.length !== uniqueOrderIds.length) {
        const foundIds = orders.map((o) => o.id);
        const missingIds = uniqueOrderIds.filter(
          (id) => !foundIds.includes(id),
        );
        throw new NotFoundException(
          `Orders not found: ${missingIds.join(', ')}`,
        );
      }

      let totalWeight = 0;
      for (const order of orders) {
        if (order.status !== OrderStatus.PENDING) {
          throw new BadRequestException(
            `Order ${order.id} is not in PENDING status`,
          );
        }
        totalWeight += Number(order.weightKg);
      }

      if (
        Number(vehicle.maxCapacityKg) - Number(vehicle.currentLoadKg) <
        totalWeight
      ) {
        throw new BadRequestException(
          'Vehicle capacity exceeded for this cluster',
        );
      }

      let activeTrip: Trip | null = null;
      if (vehicle.status === VehicleStatus.DELIVERING) {
        // Find existing active pending trip
        activeTrip = await queryRunner.manager.findOne(Trip, {
          where: {
            vehicleId: vehicle.id,
            driverId: vehicle.driverId,
            status: TripStatus.PENDING,
          },
          lock: { mode: 'pessimistic_write' },
        });
      }

      let savedTrip: Trip;
      if (activeTrip) {
        // Use existing active trip
        savedTrip = activeTrip;

        // Find max sequence in current tripOrders
        const tripOrders = await queryRunner.manager.find(TripOrder, {
          where: { tripId: activeTrip.id },
        });
        const maxSequence = tripOrders.reduce(
          (max, to) => Math.max(max, to.sequence),
          0,
        );

        // 4. Batch link Orders to Trip and update statuses
        const newTripOrders: TripOrder[] = [];
        for (let i = 0; i < orders.length; i++) {
          const tripOrder = queryRunner.manager.create(TripOrder, {
            tripId: activeTrip.id,
            orderId: orders[i].id,
            sequence: maxSequence + i + 1,
          });
          newTripOrders.push(tripOrder);

          orders[i].status = OrderStatus.ASSIGNED;
        }

        // Batch save TripOrders and updated Orders
        await queryRunner.manager.save(TripOrder, newTripOrders);
        await queryRunner.manager.save(Order, orders);
      } else {
        // 3. Create Trip
        const trip = queryRunner.manager.create(Trip, {
          vehicleId: vehicle.id,
          driverId: vehicle.driverId,
          status: TripStatus.PENDING,
        });
        savedTrip = await queryRunner.manager.save(Trip, trip);

        // 4. Batch link Orders to Trip and update statuses
        const tripOrders: TripOrder[] = [];
        for (let i = 0; i < orders.length; i++) {
          const tripOrder = queryRunner.manager.create(TripOrder, {
            tripId: savedTrip.id,
            orderId: orders[i].id,
            sequence: i + 1,
          });
          tripOrders.push(tripOrder);

          orders[i].status = OrderStatus.ASSIGNED;
        }

        // Batch save TripOrders and updated Orders
        await queryRunner.manager.save(TripOrder, tripOrders);
        await queryRunner.manager.save(Order, orders);
      }

      // Update Vehicle Status and Load
      vehicle.status = VehicleStatus.DELIVERING;
      vehicle.currentLoadKg = Number(vehicle.currentLoadKg) + totalWeight;
      await queryRunner.manager.save(Vehicle, vehicle);

      await queryRunner.commitTransaction();

      // Optimize route using Mapbox API asynchronously (after transaction commit)
      try {
        await this.optimizationService.optimizeTripRoute(savedTrip.id);
      } catch (optErr) {
        console.error(
          'Failed to optimize trip route after assignment:',
          optErr,
        );
      }

      // Emit event for real-time notification
      this.eventEmitter.emit('trip.assigned', savedTrip);

      return savedTrip;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async clusterOrders() {
    // Basic clustering: group orders by pickup location within 3km
    const pendingOrders = await this.orderRepository.find({
      where: { status: OrderStatus.PENDING },
    });

    if (pendingOrders.length === 0) return [];

    const clusters: any[] = [];
    const processed = new Set<string>();

    for (const order of pendingOrders) {
      if (processed.has(order.id)) continue;

      const cluster = [order];
      processed.add(order.id);

      for (const other of pendingOrders) {
        if (processed.has(other.id)) continue;

        // Simple spatial check using raw SQL or manual calculation
        // For simplicity, we'll use a mock spatial check here or we could call a PostGIS query
        // But for a basic implementation, we'll return them as potential groups
        const distance = this.calculateDistance(
          order.pickupLocation.coordinates[1],
          order.pickupLocation.coordinates[0],
          other.pickupLocation.coordinates[1],
          other.pickupLocation.coordinates[0],
        );

        if (distance <= 3) {
          // 3km radius
          cluster.push(other);
          processed.add(other.id);
        }
      }
      clusters.push({
        center: order.pickupAddress,
        orders: cluster,
        totalWeight: cluster.reduce((sum, o) => sum + Number(o.weightKg), 0),
      });
    }

    return clusters;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
