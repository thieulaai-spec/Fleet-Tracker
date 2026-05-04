import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { Vehicle, VehicleStatus } from '../entities/vehicle.entity';
import { Trip, TripStatus } from '../entities/trip.entity';
import { TripOrder } from '../entities/trip-order.entity';
import { Driver, DriverStatus } from '../entities/driver.entity';

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
    const vehicles = await this.vehicleRepository
      .createQueryBuilder('vehicle')
      .innerJoinAndSelect('vehicle.driver', 'driver')
      .where('vehicle.status = :vStatus', { vStatus: VehicleStatus.AVAILABLE })
      .andWhere('driver.status = :dStatus', { dStatus: DriverStatus.AVAILABLE })
      .andWhere('driver.license_expiry > :today', { today: new Date() })
      .andWhere('vehicle.max_capacity_kg - vehicle.current_load_kg >= :weight', { weight: order.weightKg })
      .addSelect(
        'ST_Distance(vehicle.last_known_location, order.pickup_location)',
        'distance'
      )
      .innerJoin('orders', 'order', 'order.id = :orderId', { orderId })
      .orderBy('distance', 'ASC')
      .limit(10)
      .getMany();

    return vehicles;
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
        relations: ['driver'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!vehicle) {
        throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
      }

      if (vehicle.status !== VehicleStatus.AVAILABLE) {
        throw new BadRequestException('Vehicle is not available');
      }

      if (!vehicle.driver) {
        throw new BadRequestException('Vehicle has no driver assigned');
      }

      if (vehicle.maxCapacityKg - vehicle.currentLoadKg < order.weightKg) {
        throw new BadRequestException('Vehicle capacity exceeded');
      }

      // Create Trip
      const trip = queryRunner.manager.create(Trip, {
        vehicleId: vehicle.id,
        driverId: vehicle.driverId,
        status: TripStatus.PENDING,
      });
      const savedTrip = await queryRunner.manager.save(Trip, trip);

      // Link Order to Trip
      const tripOrder = queryRunner.manager.create(TripOrder, {
        tripId: savedTrip.id,
        orderId: order.id,
        sequence: 1,
      });
      await queryRunner.manager.save(TripOrder, tripOrder);

      // Update Order Status
      order.status = OrderStatus.ASSIGNED;
      await queryRunner.manager.save(Order, order);

      // Update Vehicle Status and Load
      vehicle.status = VehicleStatus.DELIVERING;
      vehicle.currentLoadKg = Number(vehicle.currentLoadKg) + Number(order.weightKg);
      await queryRunner.manager.save(Vehicle, vehicle);

      await queryRunner.commitTransaction();
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

        if (distance <= 3) { // 3km radius
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

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
