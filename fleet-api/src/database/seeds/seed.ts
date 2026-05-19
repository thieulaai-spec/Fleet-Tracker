import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User, UserRole } from '../../entities/user.entity';
import { Driver, DriverStatus } from '../../entities/driver.entity';
import { Vehicle, VehicleType, VehicleStatus } from '../../entities/vehicle.entity';
import { Order, OrderStatus } from '../../entities/order.entity';
import { Trip, TripStatus } from '../../entities/trip.entity';
import { TripOrder } from '../../entities/trip-order.entity';
import { Alert, AlertSeverity, AlertType } from '../../entities/alert.entity';
import { DriverKpi } from '../../entities/driver-kpi.entity';
import { GpsLocation } from '../../entities/gps-location.entity';

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

const generateRandomPoint = () => {
  const lng = 106.6 + Math.random() * 0.2;
  const lat = 10.7 + Math.random() * 0.1;
  return { type: 'Point', coordinates: [lng, lat] };
};

const generateRandomLineString = () => {
  return {
    type: 'LineString',
    coordinates: [
      [106.6 + Math.random() * 0.1, 10.7 + Math.random() * 0.1],
      [106.7 + Math.random() * 0.1, 10.8 + Math.random() * 0.1],
    ],
  };
};

async function seed() {
  try {
    await dataSource.initialize();
    console.log('Data Source initialized!');

    console.log('Wiping database...');
    await dataSource.query(`
      TRUNCATE TABLE 
        "gps_locations", 
        "alerts", 
        "trip_orders", 
        "trips", 
        "orders", 
        "vehicles", 
        "driver_kpi", 
        "drivers", 
        "users" 
      CASCADE;
    `);
    console.log('Database wiped.');

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash('Test@123', salt);

    const userRepository = dataSource.getRepository(User);
    const driverRepository = dataSource.getRepository(Driver);
    const kpiRepository = dataSource.getRepository(DriverKpi);

    await userRepository.save([
      userRepository.create({ email: 'admin@fleettracker.com', passwordHash, role: UserRole.ADMIN, fullName: 'System Admin', phone: '0000000000' }),
      userRepository.create({ email: 'dispatcher@fleettracker.com', passwordHash, role: UserRole.DISPATCHER, fullName: 'Dispatcher', phone: '0111111111' })
    ]);

    const driversData: Driver[] = [];
    for (let i = 1; i <= 15; i++) {
      const user = userRepository.create({
        email: `driver${i}@fleettracker.com`,
        passwordHash,
        role: UserRole.DRIVER,
        fullName: `Driver Name ${i}`,
        phone: `09000000${i.toString().padStart(2, '0')}`,
      });
      const savedUser = await userRepository.save(user);

      const driver = driverRepository.create({
        user: savedUser,
        licenseClass: ['B2', 'C', 'D', 'E'][i % 4],
        licenseExpiry: new Date('2030-01-01'),
        status: DriverStatus.AVAILABLE,
      });
      const savedDriver = await driverRepository.save(driver);
      driversData.push(savedDriver);

      const kpi = kpiRepository.create({
        driver: savedDriver,
        totalTrips: 30 + i * 5,
        completedTrips: 28 + i * 4,
        completionRate: Math.floor(80 + Math.random() * 20),
        totalViolations: Math.floor(Math.random() * 5),
        kpiScore: Math.floor(70 + Math.random() * 30),
      });
      await kpiRepository.save(kpi);
    }
    console.log(`Seeded ${driversData.length} drivers & KPIs.`);

    const vehicleRepository = dataSource.getRepository(Vehicle);
    const vehiclesData: Vehicle[] = [];
    for (let i = 1; i <= 15; i++) {
      const vehicle = vehicleRepository.create({
        plateNumber: `51A-${10000 + i}`,
        type: [VehicleType.SMALL, VehicleType.MEDIUM, VehicleType.LARGE][i % 3],
        maxCapacityKg: 1000 + i * 500,
        status: VehicleStatus.AVAILABLE,
        lastKnownLocation: generateRandomPoint(),
      });
      vehiclesData.push(await vehicleRepository.save(vehicle));
    }
    console.log(`Seeded ${vehiclesData.length} vehicles.`);

    const orderRepository = dataSource.getRepository(Order);
    const ordersData: Order[] = [];
    for (let i = 1; i <= 100; i++) {
      const order = orderRepository.create({
        pickupAddress: `Pickup Address ${i}`,
        pickupLocation: generateRandomPoint(),
        deliveryAddress: `Delivery Address ${i}`,
        deliveryLocation: generateRandomPoint(),
        weightKg: 50 + i * 10,
        description: `Order Description ${i}`,
        status: [OrderStatus.PENDING, OrderStatus.ASSIGNED, OrderStatus.DELIVERED][i % 3],
      });
      ordersData.push(await orderRepository.save(order));
    }
    console.log(`Seeded ${ordersData.length} orders.`);

    const tripRepository = dataSource.getRepository(Trip);
    const tripOrderRepository = dataSource.getRepository(TripOrder);
    const alertRepository = dataSource.getRepository(Alert);
    const gpsRepository = dataSource.getRepository(GpsLocation);

    const tripsData: Trip[] = [];
    let tripCounter = 0;
    for (let day = 0; day < 30; day++) {
      for (let j = 0; j < 3; j++) {
        tripCounter++;
        const driver = driversData[tripCounter % driversData.length];
        const vehicle = vehiclesData[tripCounter % vehiclesData.length];
        
        const daysAgo = 30 - day;
        const startedAt = new Date(Date.now() - 86400000 * daysAgo + Math.random() * 40000000);
        const completedAt = new Date(startedAt.getTime() + 3600000 + Math.random() * 7200000);
        const distance = 10 + Math.floor(Math.random() * 50);
        
        const trip = tripRepository.create({
          driver,
          vehicle,
          status: TripStatus.COMPLETED,
          plannedRoute: generateRandomLineString(),
          actualRoute: generateRandomLineString(),
          startedAt,
          completedAt,
          createdAt: startedAt,
          totalDistanceKm: distance,
          estimatedFuelCost: distance * 2500,
        });
        
        const savedTrip = await tripRepository.save(trip);
        await dataSource.query(`UPDATE trips SET created_at = $1 WHERE id = $2`, [startedAt, savedTrip.id]);
        tripsData.push(savedTrip);

        await tripOrderRepository.save(tripOrderRepository.create({
          trip: savedTrip,
          order: ordersData[tripCounter % ordersData.length],
          sequence: 1,
        }));

        if (tripCounter % 5 === 0) {
          const alert = alertRepository.create({
            trip: savedTrip,
            vehicle,
            driver,
            type: [AlertType.SPEED_VIOLATION, AlertType.ROUTE_DEVIATION, AlertType.ABNORMAL_STOP][tripCounter % 3],
            severity: AlertSeverity.MEDIUM,
            message: `System alert ${tripCounter}`,
            location: generateRandomPoint(),
            isResolved: true,
            resolvedAt: new Date(completedAt.getTime() + 86400000),
            createdAt: startedAt,
          });
          const savedAlert = await alertRepository.save(alert);
          await dataSource.query(`UPDATE alerts SET created_at = $1 WHERE id = $2`, [startedAt, savedAlert.id]);
        }

        const gps = gpsRepository.create({
          vehicle,
          trip: savedTrip,
          location: generateRandomPoint(),
          speedKmh: 40 + (tripCounter % 20),
          heading: (90 + tripCounter * 10) % 360,
          recordedAt: completedAt,
        });
        await gpsRepository.save(gps);
      }
    }
    console.log(`Seeded ${tripsData.length} trips + associated records.`);

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await dataSource.destroy();
  }
}

seed();
