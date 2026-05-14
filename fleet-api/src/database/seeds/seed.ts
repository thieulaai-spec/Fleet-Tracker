import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User, UserRole } from '../../entities/user.entity';
import { Driver, DriverStatus } from '../../entities/driver.entity';
import {
  Vehicle,
  VehicleType,
  VehicleStatus,
} from '../../entities/vehicle.entity';
import { Order, OrderStatus } from '../../entities/order.entity';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Driver, Vehicle, Order],
  synchronize: false,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function seed() {
  try {
    await dataSource.initialize();
    console.log('Data Source has been initialized!');

    const userRepository = dataSource.getRepository(User);
    const driverRepository = dataSource.getRepository(Driver);
    const vehicleRepository = dataSource.getRepository(Vehicle);
    const orderRepository = dataSource.getRepository(Order);

    // 1. Seed Admin
    const adminEmail = 'admin@fleettracker.com';
    let admin = await userRepository.findOne({ where: { email: adminEmail } });
    if (!admin) {
      const salt = await bcrypt.genSalt();
      const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
      const passwordHash = await bcrypt.hash(adminPassword, salt);
      admin = userRepository.create({
        email: adminEmail,
        passwordHash,
        role: UserRole.ADMIN,
      });
      await userRepository.save(admin);
      console.log('Admin user seeded');
    }

    // 2. Seed Drivers + Users
    const driversData = [
      {
        email: 'driver1@fleettracker.com',
        fullName: 'Nguyen Van A',
        phone: '0912345678',
        licenseClass: 'C',
      },
      {
        email: 'driver2@fleettracker.com',
        fullName: 'Tran Thi B',
        phone: '0912345679',
        licenseClass: 'D',
      },
      {
        email: 'driver3@fleettracker.com',
        fullName: 'Le Van C',
        phone: '0912345680',
        licenseClass: 'E',
      },
      {
        email: 'driver4@fleettracker.com',
        fullName: 'Pham Van D',
        phone: '0912345681',
        licenseClass: 'C',
      },
      {
        email: 'driver5@fleettracker.com',
        fullName: 'Hoang Van E',
        phone: '0912345682',
        licenseClass: 'C',
      },
    ];

    for (const data of driversData) {
      let user = await userRepository.findOne({ where: { email: data.email } });
      if (!user) {
        const salt = await bcrypt.genSalt();
        const driverPassword = process.env.DRIVER_PASSWORD || 'Driver@123';
        user = userRepository.create({
          email: data.email,
          passwordHash: await bcrypt.hash(driverPassword, salt),
          role: UserRole.DRIVER,
        });
        user = await userRepository.save(user);

        const driver = driverRepository.create({
          user,
          fullName: data.fullName,
          phone: data.phone,
          licenseClass: data.licenseClass,
          licenseExpiry: new Date('2030-01-01'),
          status: DriverStatus.AVAILABLE,
        });
        await driverRepository.save(driver);
        console.log(`Driver ${data.fullName} seeded`);
      }
    }

    // 2.1 Seed Dispatcher
    const dispatcherEmail = 'dispatcher@fleettracker.com';
    let dispatcher = await userRepository.findOne({
      where: { email: dispatcherEmail },
    });
    if (!dispatcher) {
      const salt = await bcrypt.genSalt();
      const dispatcherPassword =
        process.env.DISPATCHER_PASSWORD || 'Dispatch@123';
      const passwordHash = await bcrypt.hash(dispatcherPassword, salt);
      dispatcher = userRepository.create({
        email: dispatcherEmail,
        passwordHash,
        role: UserRole.DISPATCHER,
      });
      await userRepository.save(dispatcher);
      console.log('Dispatcher user seeded');
    }

    // 3. Seed Vehicles
    const vehiclesData = [
      {
        plateNumber: '29A-12345',
        type: VehicleType.SMALL,
        maxCapacityKg: 1000,
      },
      {
        plateNumber: '29A-67890',
        type: VehicleType.MEDIUM,
        maxCapacityKg: 5000,
      },
      {
        plateNumber: '51C-11111',
        type: VehicleType.LARGE,
        maxCapacityKg: 15000,
      },
      {
        plateNumber: '51C-22222',
        type: VehicleType.MEDIUM,
        maxCapacityKg: 5000,
      },
      {
        plateNumber: '30E-33333',
        type: VehicleType.SMALL,
        maxCapacityKg: 1500,
      },
      {
        plateNumber: '30E-44444',
        type: VehicleType.LARGE,
        maxCapacityKg: 12000,
      },
      { plateNumber: '43A-55555', type: VehicleType.SMALL, maxCapacityKg: 800 },
    ];

    for (const data of vehiclesData) {
      let vehicle = await vehicleRepository.findOne({
        where: { plateNumber: data.plateNumber },
      });
      if (!vehicle) {
        vehicle = vehicleRepository.create({
          ...data,
          status: VehicleStatus.AVAILABLE,
          lastKnownLocation: {
            type: 'Point',
            coordinates: [106.660172, 10.762622],
          } as any, // Base location HCM
        });
        await vehicleRepository.save(vehicle);
        console.log(`Vehicle ${data.plateNumber} seeded`);
      }
    }

    // 4. Seed Sample Orders (HCM area - 10 orders total)
    const ordersData = [
      {
        pickupAddress: 'Linh Trung, Thu Duc, HCM',
        pickupLocation: { type: 'Point', coordinates: [106.78, 10.86] },
        deliveryAddress: 'District 1, HCM',
        deliveryLocation: { type: 'Point', coordinates: [106.69, 10.77] },
        weightKg: 50,
        description: 'Electronic parts',
      },
      {
        pickupAddress: 'Tan Binh IP, HCM',
        pickupLocation: { type: 'Point', coordinates: [106.63, 10.81] },
        deliveryAddress: 'Cat Lai Port, HCM',
        deliveryLocation: { type: 'Point', coordinates: [106.77, 10.76] },
        weightKg: 2000,
        description: 'Textile materials',
      },
      {
        pickupAddress: 'Go Vap, HCM',
        pickupLocation: { type: 'Point', coordinates: [106.67, 10.83] },
        deliveryAddress: 'District 7, HCM',
        deliveryLocation: { type: 'Point', coordinates: [106.72, 10.73] },
        weightKg: 300,
        description: 'Food supplies',
      },
      {
        pickupAddress: 'Binh Thanh, HCM',
        pickupLocation: { type: 'Point', coordinates: [106.7, 10.8] },
        deliveryAddress: 'District 3, HCM',
        deliveryLocation: { type: 'Point', coordinates: [106.68, 10.78] },
        weightKg: 100,
        description: 'Office documents',
      },
      {
        pickupAddress: 'Phu Nhuan, HCM',
        pickupLocation: { type: 'Point', coordinates: [106.68, 10.79] },
        deliveryAddress: 'Tan Son Nhat Airport',
        deliveryLocation: { type: 'Point', coordinates: [106.66, 10.81] },
        weightKg: 1500,
        description: 'Medical equipment',
      },
      {
        pickupAddress: 'District 10, HCM',
        pickupLocation: { type: 'Point', coordinates: [106.66, 10.77] },
        deliveryAddress: 'District 5, HCM',
        deliveryLocation: { type: 'Point', coordinates: [106.66, 10.75] },
        weightKg: 800,
        description: 'Furniture',
      },
      {
        pickupAddress: 'Cu Chi, HCM',
        pickupLocation: { type: 'Point', coordinates: [106.49, 10.98] },
        deliveryAddress: 'District 1, HCM',
        deliveryLocation: { type: 'Point', coordinates: [106.69, 10.77] },
        weightKg: 4000,
        description: 'Agricultural products',
      },
      {
        pickupAddress: 'Hoc Mon, HCM',
        pickupLocation: { type: 'Point', coordinates: [106.59, 10.88] },
        deliveryAddress: 'Binh Tan, HCM',
        deliveryLocation: { type: 'Point', coordinates: [106.6, 10.76] },
        weightKg: 1200,
        description: 'Construction materials',
      },
      {
        pickupAddress: 'District 12, HCM',
        pickupLocation: { type: 'Point', coordinates: [106.64, 10.86] },
        deliveryAddress: 'District 2, HCM',
        deliveryLocation: { type: 'Point', coordinates: [106.74, 10.79] },
        weightKg: 600,
        description: 'Retail goods',
      },
      {
        pickupAddress: 'Nha Be, HCM',
        pickupLocation: { type: 'Point', coordinates: [106.72, 10.66] },
        deliveryAddress: 'District 4, HCM',
        deliveryLocation: { type: 'Point', coordinates: [106.7, 10.75] },
        weightKg: 200,
        description: 'Spare parts',
      },
    ];

    for (const data of ordersData) {
      // Check if order already exists by description and pickup address (simple check)
      const existing = await orderRepository.findOne({
        where: {
          description: data.description,
          pickupAddress: data.pickupAddress,
        },
      });
      if (!existing) {
        const order = orderRepository.create({
          ...data,
          status: OrderStatus.PENDING,
        } as any);
        await orderRepository.save(order);
        console.log(`Order: ${data.description} seeded`);
      }
    }

    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await dataSource.destroy();
  }
}

seed();
