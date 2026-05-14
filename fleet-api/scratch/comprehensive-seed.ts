import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../src/entities/user.entity';
import { Driver } from '../src/entities/driver.entity';
import { Vehicle } from '../src/entities/vehicle.entity';
import { Order, OrderStatus } from '../src/entities/order.entity';
import { Trip, TripStatus } from '../src/entities/trip.entity';
import { TripOrder } from '../src/entities/trip-order.entity';
import { Alert, AlertType, AlertSeverity } from '../src/entities/alert.entity';
import { DriverKpi } from '../src/entities/driver-kpi.entity';
import { GpsLocation } from '../src/entities/gps-location.entity';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Driver, Vehicle, Order, Trip, TripOrder, Alert, DriverKpi, GpsLocation],
  synchronize: false,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function seedComprehensive() {
  try {
    await dataSource.initialize();
    console.log('Connected to database for comprehensive seeding...');

    const driverRepository = dataSource.getRepository(Driver);
    const vehicleRepository = dataSource.getRepository(Vehicle);
    const orderRepository = dataSource.getRepository(Order);
    const tripRepository = dataSource.getRepository(Trip);
    const tripOrderRepository = dataSource.getRepository(TripOrder);
    const alertRepository = dataSource.getRepository(Alert);
    const driverKpiRepository = dataSource.getRepository(DriverKpi);
    const gpsLocationRepository = dataSource.getRepository(GpsLocation);

    // 1. Fetch some drivers, vehicles, and orders
    const drivers = await driverRepository.find({ take: 5, relations: ['user'] });
    const vehicles = await vehicleRepository.find({ take: 5 });
    const orders = await orderRepository.find({ take: 10 });

    if (drivers.length < 2 || vehicles.length < 2 || orders.length < 4) {
      console.log('Not enough base data (drivers/vehicles/orders). Please run the basic seed first.');
      return;
    }

    // 2. Create Driver KPIs for all fetched drivers
    for (const driver of drivers) {
      let kpi = await driverKpiRepository.findOne({ where: { driverId: driver.id } });
      if (!kpi) {
        kpi = driverKpiRepository.create({
          driverId: driver.id,
          totalTrips: Math.floor(Math.random() * 50) + 10,
          completedTrips: Math.floor(Math.random() * 40) + 5,
          completionRate: 90 + Math.random() * 10,
          totalViolations: Math.floor(Math.random() * 5),
          speedViolations: Math.floor(Math.random() * 3),
          routeViolations: Math.floor(Math.random() * 2),
          kpiScore: 85 + Math.random() * 15,
        });
        await driverKpiRepository.save(kpi);
        console.log(`Created KPI for driver ${driver.user?.fullName || 'Unknown'}`);
      }
    }

    // 3. Create Trips (1 In Progress, 1 Completed)
    
    // Check if we already seeded trips to avoid duplicates
    const existingTrips = await tripRepository.find();
    if (existingTrips.length === 0) {
      // Trip 1: IN_PROGRESS
      const trip1 = tripRepository.create({
        vehicleId: vehicles[0].id,
        driverId: drivers[0].id,
        status: TripStatus.IN_PROGRESS,
        startedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        actualRoute: { type: 'LineString', coordinates: [[106.660172, 10.762622], [106.670172, 10.772622]] },
      });
      await tripRepository.save(trip1);
      console.log('Created Trip 1 (IN_PROGRESS)');

      // Link Orders to Trip 1
      const order1 = orders[0];
      const order2 = orders[1];
      await tripOrderRepository.save([
        { tripId: trip1.id, orderId: order1.id, sequence: 1 },
        { tripId: trip1.id, orderId: order2.id, sequence: 2 },
      ]);
      await orderRepository.update(order1.id, { status: OrderStatus.DELIVERING as any });
      await orderRepository.update(order2.id, { status: OrderStatus.DELIVERING as any });

      // Create GPS Locations for Trip 1
      for (let i = 0; i < 5; i++) {
        await gpsLocationRepository.save({
          vehicleId: vehicles[0].id,
          tripId: trip1.id,
          location: { type: 'Point', coordinates: [106.660172 + (i * 0.002), 10.762622 + (i * 0.002)] },
          speedKmh: 40 + Math.random() * 20,
          heading: 45,
        });
      }

      // Create an Alert for Trip 1
      await alertRepository.save({
        tripId: trip1.id,
        vehicleId: vehicles[0].id,
        driverId: drivers[0].id,
        type: AlertType.SPEED_VIOLATION,
        severity: AlertSeverity.MEDIUM,
        message: 'Vehicle exceeded speed limit (75 km/h in 60 km/h zone)',
        location: { type: 'Point', coordinates: [106.665172, 10.767622] },
        isResolved: false,
      });


      // Trip 2: COMPLETED
      const trip2 = tripRepository.create({
        vehicleId: vehicles[1].id,
        driverId: drivers[1].id,
        status: TripStatus.COMPLETED,
        startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 20), // completed 20 hours ago
        totalDistanceKm: 45.5,
        estimatedFuelCost: 150000,
        plannedRoute: { type: 'LineString', coordinates: [[106.680172, 10.782622], [106.700172, 10.802622]] },
      });
      await tripRepository.save(trip2);
      console.log('Created Trip 2 (COMPLETED)');

      // Link Orders to Trip 2
      const order3 = orders[2];
      const order4 = orders[3];
      await tripOrderRepository.save([
        { tripId: trip2.id, orderId: order3.id, sequence: 1 },
        { tripId: trip2.id, orderId: order4.id, sequence: 2 },
      ]);
      await orderRepository.update(order3.id, { status: OrderStatus.DELIVERED as any });
      await orderRepository.update(order4.id, { status: OrderStatus.DELIVERED as any });

      // Create an Alert for Trip 2 (Resolved)
      await alertRepository.save({
        tripId: trip2.id,
        vehicleId: vehicles[1].id,
        driverId: drivers[1].id,
        type: AlertType.ROUTE_DEVIATION,
        severity: AlertSeverity.LOW,
        message: 'Vehicle deviated from planned route by 2km',
        location: { type: 'Point', coordinates: [106.690172, 10.792622] },
        isResolved: true,
        resolvedAt: new Date(),
      });
    } else {
      console.log('Trips already seeded. Skipping Trip creation to avoid duplicates.');
    }

    console.log('Comprehensive Seeding completed successfully');
  } catch (error) {
    console.error('Error during comprehensive seeding:', error);
  } finally {
    await dataSource.destroy();
  }
}

seedComprehensive();
