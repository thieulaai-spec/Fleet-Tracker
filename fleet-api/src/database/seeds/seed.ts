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
import { Trip, TripStatus } from '../../entities/trip.entity';
import { TripOrder } from '../../entities/trip-order.entity';
import { Alert, AlertSeverity, AlertType } from '../../entities/alert.entity';
import { DriverKpi } from '../../entities/driver-kpi.entity';
import { GpsLocation } from '../../entities/gps-location.entity';
import { OrderVerification, VerificationStep } from '../../entities/order-verification.entity';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    User,
    Driver,
    Vehicle,
    Order,
    Trip,
    TripOrder,
    Alert,
    DriverKpi,
    GpsLocation,
    OrderVerification,
  ],
  synchronize: false,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Helper for PostGIS geography
const getPoint = (lng: number, lat: number) => {
  return { type: 'Point', coordinates: [lng, lat] };
};

const getLineString = (points: [number, number][]) => {
  return { type: 'LineString', coordinates: points };
};

async function seed() {
  try {
    await dataSource.initialize();
    console.log('Data Source initialized!');

    console.log('Wiping database...');
    await dataSource.query(`
      TRUNCATE TABLE 
        "gps_locations", 
        "order_verifications",
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
    
    // Hash passwords
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin2@fleettracker.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@456';
    const adminPasswordHash = await bcrypt.hash(adminPassword, salt);
    const standardPasswordHash = await bcrypt.hash('Test@123', salt);

    const userRepository = dataSource.getRepository(User);
    const driverRepository = dataSource.getRepository(Driver);
    const kpiRepository = dataSource.getRepository(DriverKpi);
    const vehicleRepository = dataSource.getRepository(Vehicle);
    const orderRepository = dataSource.getRepository(Order);
    const tripRepository = dataSource.getRepository(Trip);
    const tripOrderRepository = dataSource.getRepository(TripOrder);
    const verificationRepository = dataSource.getRepository(OrderVerification);
    const alertRepository = dataSource.getRepository(Alert);
    const gpsRepository = dataSource.getRepository(GpsLocation);

    console.log('Seeding system users...');
    // Admin
    const adminUser = await userRepository.save(
      userRepository.create({
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: UserRole.ADMIN,
        fullName: 'Hệ thống Admin',
        phone: '0999888777',
      })
    );

    // Dispatcher
    await userRepository.save(
      userRepository.create({
        email: 'dispatcher@fleettracker.com',
        passwordHash: standardPasswordHash,
        role: UserRole.DISPATCHER,
        fullName: 'Điều phối viên',
        phone: '0999777666',
      })
    );

    // 5 Drivers (Realistic Vietnamese Names & phones)
    const driversData: Driver[] = [];
    const driversInfo = [
      { email: 'driver1@fleettracker.com', name: 'Nguyễn Văn Hùng', phone: '0901234567', license: 'C' },
      { email: 'driver2@fleettracker.com', name: 'Trần Thanh Hải', phone: '0912345678', license: 'B2' },
      { email: 'driver3@fleettracker.com', name: 'Lê Minh Quốc', phone: '0987654321', license: 'D' },
      { email: 'driver4@fleettracker.com', name: 'Phạm Hoàng Nam', phone: '0934567890', license: 'FC' },
      { email: 'driver5@fleettracker.com', name: 'Vũ Tiến Đạt', phone: '0977889900', license: 'C' },
    ];

    for (const info of driversInfo) {
      const u = await userRepository.save(
        userRepository.create({
          email: info.email,
          passwordHash: standardPasswordHash,
          role: UserRole.DRIVER,
          fullName: info.name,
          phone: info.phone,
        })
      );

      const d = await driverRepository.save(
        driverRepository.create({
          user: u,
          licenseClass: info.license,
          licenseExpiry: new Date('2031-12-31'),
          status: DriverStatus.AVAILABLE,
        })
      );
      driversData.push(d);

      // KPI score for driver
      await kpiRepository.save(
        kpiRepository.create({
          driver: d,
          totalTrips: 45,
          completedTrips: 42,
          completionRate: 93,
          totalViolations: 1,
          kpiScore: 92,
        })
      );
    }
    console.log(`Seeded ${driversData.length} drivers & KPIs.`);

    // 5 Vehicles
    console.log('Seeding vehicles...');
    const vehiclesData: Vehicle[] = [];
    const vehiclesInfo = [
      { plateNumber: '51C-432.10', type: VehicleType.MEDIUM, capacity: 3500, model: 'Isuzu NPR400', year: 2022, status: VehicleStatus.DELIVERING },
      { plateNumber: '51D-876.54', type: VehicleType.LARGE, capacity: 8000, model: 'Hino 500', year: 2021, status: VehicleStatus.MAINTENANCE },
      { plateNumber: '51A-999.99', type: VehicleType.SMALL, capacity: 1500, model: 'Suzuki Carry Pro', year: 2023, status: VehicleStatus.AVAILABLE },
      { plateNumber: '29C-543.21', type: VehicleType.MEDIUM, capacity: 4000, model: 'Hyundai Mighty', year: 2020, status: VehicleStatus.AVAILABLE },
      { plateNumber: '43C-888.88', type: VehicleType.LARGE, capacity: 10000, model: 'Thaco Auman', year: 2022, status: VehicleStatus.DELIVERING },
    ];

    for (const info of vehiclesInfo) {
      const v = await vehicleRepository.save(
        vehicleRepository.create({
          plateNumber: info.plateNumber,
          type: info.type,
          maxCapacityKg: info.capacity,
          model: info.model,
          year: info.year,
          status: info.status,
          lastKnownLocation: getPoint(106.6 + Math.random() * 0.1, 10.7 + Math.random() * 0.1),
        })
      );
      vehiclesData.push(v);
    }
    console.log(`Seeded ${vehiclesData.length} vehicles.`);

    // High quality Image assets for verification
    const facePhotos = [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
    ];

    const cargoPhotosPickup = [
      'https://images.unsplash.com/photo-1566576912321-d58edd7a2858?w=500&fit=crop',
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&fit=crop',
    ];

    const cargoPhotosDelivery = [
      'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=500&fit=crop',
      'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=500&fit=crop',
    ];

    const signatureUrl = 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=300&fit=crop';

    // 10 Detailed Orders in HCM City area
    console.log('Seeding realistic orders...');
    const ordersInfo = [
      {
        pickupAddress: 'Vincom Center, 72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP. HCM',
        pickupLocation: [106.7018, 10.7779],
        deliveryAddress: 'Landmark 81, 208 Nguyễn Hữu Cảnh, Phường 22, Bình Thạnh, TP. HCM',
        deliveryLocation: [106.7218, 10.7950],
        weightKg: 120,
        description: 'Thùng hàng thiết bị linh kiện điện tử nhạy cảm',
        status: OrderStatus.DELIVERED,
      },
      {
        pickupAddress: 'Chợ Bến Thành, Lê Lợi, Bến Thành, Quận 1, TP. HCM',
        pickupLocation: [106.6974, 10.7725],
        deliveryAddress: 'Khu đô thị Phú Mỹ Hưng, Quận 7, TP. HCM',
        deliveryLocation: [106.7210, 10.7289],
        weightKg: 500,
        description: 'Vải vóc và nguyên liệu may mặc',
        status: OrderStatus.DELIVERED,
      },
      {
        pickupAddress: 'Cảng Cát Lái, Nguyễn Thị Định, Thạnh Mỹ Lợi, TP. Thủ Đức, TP. HCM',
        pickupLocation: [106.7865, 10.7584],
        deliveryAddress: 'Khu Công Nghệ Cao (SHTP), Long Thạnh Mỹ, TP. Thủ Đức, TP. HCM',
        deliveryLocation: [106.8118, 10.8465],
        weightKg: 2500,
        description: 'Lô hàng linh kiện bán dẫn cao cấp',
        status: OrderStatus.DELIVERING,
      },
      {
        pickupAddress: 'Sân bay Tân Sơn Nhất, Trường Sơn, Phường 2, Tân Bình, TP. HCM',
        pickupLocation: [106.6622, 10.8184],
        deliveryAddress: 'Khu chế xuất Tân Thuận, Tân Thuận Đông, Quận 7, TP. HCM',
        deliveryLocation: [106.7351, 10.7417],
        weightKg: 450,
        description: 'Hàng nhập khẩu chuyển phát nhanh hàng không',
        status: OrderStatus.DELIVERING,
      },
      {
        pickupAddress: 'Gigamall, 240-242 Phạm Văn Đồng, Hiệp Bình Chánh, TP. Thủ Đức, TP. HCM',
        pickupLocation: [106.7214, 10.8277],
        deliveryAddress: 'Aeon Mall Bình Tân, 1 Đường Số 17A, Bình Trị Đông B, Bình Tân, TP. HCM',
        deliveryLocation: [106.6083, 10.7428],
        weightKg: 80,
        description: 'Đồ gia dụng thông minh gia đình',
        status: OrderStatus.ASSIGNED,
      },
      {
        pickupAddress: 'Thảo Cầm Viên, 2 Nguyễn Bỉnh Khiêm, Bến Nghé, Quận 1, TP. HCM',
        pickupLocation: [106.7052, 10.7875],
        deliveryAddress: 'Đầm Sen Park, 3 Hòa Bình, Phường 3, Quận 11, TP. HCM',
        deliveryLocation: [106.6375, 10.7681],
        weightKg: 35,
        description: 'Tài liệu quảng cáo sự kiện ngoài trời',
        status: OrderStatus.PENDING,
      },
      {
        pickupAddress: 'Tòa nhà Bitexco, 2 Hải Triều, Bến Nghé, Quận 1, TP. HCM',
        pickupLocation: [106.7044, 10.7715],
        deliveryAddress: 'Đại học Quốc gia TP.HCM, Linh Trung, TP. Thủ Đức, TP. HCM',
        deliveryLocation: [106.8031, 10.8700],
        weightKg: 15,
        description: 'Mẫu thử nghiệm công nghệ giáo dục số',
        status: OrderStatus.FAILED,
      },
      {
        pickupAddress: 'Hồ Con Rùa, Phường 6, Quận 3, TP. HCM',
        pickupLocation: [106.6972, 10.7826],
        deliveryAddress: 'Bệnh viện Chợ Rẫy, 201B Nguyễn Chí Thanh, Phường 12, Quận 5, TP. HCM',
        deliveryLocation: [106.6601, 10.7578],
        weightKg: 5,
        description: 'Tài liệu y khoa khẩn cấp',
        status: OrderStatus.CANCELLED,
      },
      {
        pickupAddress: 'Khu du lịch Suối Tiên, Xa lộ Hà Nội, Tân Phú, TP. Thủ Đức, TP. HCM',
        pickupLocation: [106.8028, 10.8617],
        deliveryAddress: 'Công viên Tao Đàn, Nguyễn Thị Minh Khai, Bến Thành, Quận 1, TP. HCM',
        deliveryLocation: [106.6931, 10.7753],
        weightKg: 300,
        description: 'Thiết bị trang trí lễ hội âm nhạc đường phố',
        status: OrderStatus.DELIVERED,
      },
      {
        pickupAddress: 'Nhà thờ Đức Bà, Công xã Paris, Bến Nghé, Quận 1, TP. HCM',
        pickupLocation: [106.6998, 10.7798],
        deliveryAddress: 'Trung tâm Triển lãm SECC, 799 Nguyễn Văn Linh, Tân Phú, Quận 7, TP. HCM',
        deliveryLocation: [106.7222, 10.7315],
        weightKg: 180,
        description: 'Vật tư triển lãm thương mại quốc tế',
        status: OrderStatus.DELIVERED,
      },
    ];

    const savedOrders: Order[] = [];
    for (const info of ordersInfo) {
      const order = orderRepository.create({
        pickupAddress: info.pickupAddress,
        pickupLocation: getPoint(info.pickupLocation[0], info.pickupLocation[1]),
        deliveryAddress: info.deliveryAddress,
        deliveryLocation: getPoint(info.deliveryLocation[0], info.deliveryLocation[1]),
        weightKg: info.weightKg,
        description: info.description,
        status: info.status,
      });

      // Add signatures/photoUrls for delivered orders
      if (info.status === OrderStatus.DELIVERED) {
        order.signatureUrl = signatureUrl;
        order.photoUrl = cargoPhotosDelivery[Math.floor(Math.random() * cargoPhotosDelivery.length)];
        order.pickupActualLocation = getPoint(info.pickupLocation[0] + 0.0001, info.pickupLocation[1] - 0.0001);
        order.deliveryActualLocation = getPoint(info.deliveryLocation[0] + 0.0001, info.deliveryLocation[1] - 0.0001);
      }
      
      savedOrders.push(await orderRepository.save(order));
    }
    console.log(`Seeded ${savedOrders.length} orders.`);

    // Trips
    console.log('Seeding trips & journey verifications...');
    
    // Trip 1: Completed, Driver 1, Vehicle 1, Order 1
    const t1StartedAt = new Date(Date.now() - 4 * 3600000);
    const t1CompletedAt = new Date(Date.now() - 2 * 3600000);
    const trip1 = await tripRepository.save(
      tripRepository.create({
        driver: driversData[0],
        vehicle: vehiclesData[0],
        status: TripStatus.COMPLETED,
        plannedRoute: getLineString([[106.7018, 10.7779], [106.7118, 10.7850], [106.7218, 10.7950]]),
        actualRoute: getLineString([[106.7018, 10.7779], [106.7088, 10.7820], [106.7158, 10.7890], [106.7218, 10.7950]]),
        startedAt: t1StartedAt,
        completedAt: t1CompletedAt,
        createdAt: t1StartedAt,
        totalDistanceKm: 4.8,
        estimatedFuelCost: 12000,
      })
    );
    await tripOrderRepository.save(
      tripOrderRepository.create({ trip: trip1, order: savedOrders[0], sequence: 1 })
    );

    // Seed verifications for Order 1 (Delivered)
    console.log('Seeding verifications for Order 1...');
    await verificationRepository.save([
      verificationRepository.create({
        order: savedOrders[0],
        step: VerificationStep.ACCEPT,
        location: getPoint(106.7018, 10.7779),
        createdAt: new Date(t1StartedAt.getTime() + 5 * 60000),
      }),
      verificationRepository.create({
        order: savedOrders[0],
        step: VerificationStep.PICKUP,
        location: getPoint(106.7018, 10.7779),
        cargoPhotoUrl: cargoPhotosPickup[0],
        createdAt: new Date(t1StartedAt.getTime() + 20 * 60000),
      }),
      verificationRepository.create({
        order: savedOrders[0],
        step: VerificationStep.CHECKPOINT,
        location: getPoint(106.7118, 10.7850),
        createdAt: new Date(t1StartedAt.getTime() + 45 * 60000),
      }),
      verificationRepository.create({
        order: savedOrders[0],
        step: VerificationStep.DELIVERY,
        location: getPoint(106.7218, 10.7950),
        fingerprintStatus: true,
        facePhotoUrl: facePhotos[0],
        cargoPhotoUrl: cargoPhotosDelivery[0],
        createdAt: new Date(t1CompletedAt.getTime() - 5 * 60000),
      }),
    ]);

    // Trip 2: Completed, Driver 2, Vehicle 3, Orders 2 & 9
    const t2StartedAt = new Date(Date.now() - 6 * 3600000);
    const t2CompletedAt = new Date(Date.now() - 3 * 3600000);
    const trip2 = await tripRepository.save(
      tripRepository.create({
        driver: driversData[1],
        vehicle: vehiclesData[2],
        status: TripStatus.COMPLETED,
        plannedRoute: getLineString([[106.6974, 10.7725], [106.7210, 10.7289], [106.8028, 10.8617], [106.6931, 10.7753]]),
        actualRoute: getLineString([[106.6974, 10.7725], [106.7210, 10.7289], [106.8028, 10.8617], [106.6931, 10.7753]]),
        startedAt: t2StartedAt,
        completedAt: t2CompletedAt,
        createdAt: t2StartedAt,
        totalDistanceKm: 25.5,
        estimatedFuelCost: 65000,
      })
    );
    await tripOrderRepository.save([
      tripOrderRepository.create({ trip: trip2, order: savedOrders[1], sequence: 1 }),
      tripOrderRepository.create({ trip: trip2, order: savedOrders[8], sequence: 2 }),
    ]);

    // Seed verifications for Order 2 (Delivered)
    await verificationRepository.save([
      verificationRepository.create({
        order: savedOrders[1],
        step: VerificationStep.ACCEPT,
        location: getPoint(106.6974, 10.7725),
        createdAt: new Date(t2StartedAt.getTime() + 10 * 60000),
      }),
      verificationRepository.create({
        order: savedOrders[1],
        step: VerificationStep.PICKUP,
        location: getPoint(106.6974, 10.7725),
        cargoPhotoUrl: cargoPhotosPickup[1],
        createdAt: new Date(t2StartedAt.getTime() + 30 * 60000),
      }),
      verificationRepository.create({
        order: savedOrders[1],
        step: VerificationStep.CHECKPOINT,
        location: getPoint(106.7090, 10.7500),
        createdAt: new Date(t2StartedAt.getTime() + 50 * 60000),
      }),
      verificationRepository.create({
        order: savedOrders[1],
        step: VerificationStep.DELIVERY,
        location: getPoint(106.7210, 10.7289),
        fingerprintStatus: true,
        facePhotoUrl: facePhotos[1],
        cargoPhotoUrl: cargoPhotosDelivery[1],
        createdAt: new Date(t2StartedAt.getTime() + 90 * 60000),
      }),
    ]);

    // Seed verifications for Order 9 (Delivered)
    await verificationRepository.save([
      verificationRepository.create({
        order: savedOrders[8],
        step: VerificationStep.ACCEPT,
        location: getPoint(106.8028, 10.8617),
        createdAt: new Date(t2StartedAt.getTime() + 100 * 60000),
      }),
      verificationRepository.create({
        order: savedOrders[8],
        step: VerificationStep.PICKUP,
        location: getPoint(106.8028, 10.8617),
        cargoPhotoUrl: cargoPhotosPickup[0],
        createdAt: new Date(t2StartedAt.getTime() + 120 * 60000),
      }),
      verificationRepository.create({
        order: savedOrders[8],
        step: VerificationStep.CHECKPOINT,
        location: getPoint(106.7500, 10.8100),
        createdAt: new Date(t2StartedAt.getTime() + 150 * 60000),
      }),
      verificationRepository.create({
        order: savedOrders[8],
        step: VerificationStep.DELIVERY,
        location: getPoint(106.6931, 10.7753),
        fingerprintStatus: true,
        facePhotoUrl: facePhotos[2],
        cargoPhotoUrl: cargoPhotosDelivery[0],
        createdAt: new Date(t2CompletedAt.getTime() - 5 * 60000),
      }),
    ]);

    // Trip 3: In Progress, Driver 3, Vehicle 4, Order 3
    const t3StartedAt = new Date(Date.now() - 45 * 60000);
    const trip3 = await tripRepository.save(
      tripRepository.create({
        driver: driversData[2],
        vehicle: vehiclesData[3],
        status: TripStatus.IN_PROGRESS,
        plannedRoute: getLineString([[106.7865, 10.7584], [106.8000, 10.8000], [106.8118, 10.8465]]),
        startedAt: t3StartedAt,
        createdAt: t3StartedAt,
        totalDistanceKm: 12.2,
      })
    );
    await tripOrderRepository.save(
      tripOrderRepository.create({ trip: trip3, order: savedOrders[2], sequence: 1 })
    );

    // Seed active verifications for Order 3 (Delivering)
    await verificationRepository.save([
      verificationRepository.create({
        order: savedOrders[2],
        step: VerificationStep.ACCEPT,
        location: getPoint(106.7865, 10.7584),
        createdAt: new Date(t3StartedAt.getTime() + 5 * 60000),
      }),
      verificationRepository.create({
        order: savedOrders[2],
        step: VerificationStep.PICKUP,
        location: getPoint(106.7865, 10.7584),
        cargoPhotoUrl: cargoPhotosPickup[0],
        createdAt: new Date(t3StartedAt.getTime() + 15 * 60000),
      }),
      verificationRepository.create({
        order: savedOrders[2],
        step: VerificationStep.CHECKPOINT,
        location: getPoint(106.8000, 10.8000),
        createdAt: new Date(t3StartedAt.getTime() + 35 * 60000),
      }),
    ]);

    // Trip 4: In Progress, Driver 5, Vehicle 5, Order 4
    const t4StartedAt = new Date(Date.now() - 20 * 60000);
    const trip4 = await tripRepository.save(
      tripRepository.create({
        driver: driversData[4],
        vehicle: vehiclesData[4],
        status: TripStatus.IN_PROGRESS,
        plannedRoute: getLineString([[106.6622, 10.8184], [106.7000, 10.7800], [106.7351, 10.7417]]),
        startedAt: t4StartedAt,
        createdAt: t4StartedAt,
        totalDistanceKm: 14.5,
      })
    );
    await tripOrderRepository.save(
      tripOrderRepository.create({ trip: trip4, order: savedOrders[3], sequence: 1 })
    );

    // Seed active verifications for Order 4 (Delivering)
    await verificationRepository.save([
      verificationRepository.create({
        order: savedOrders[3],
        step: VerificationStep.ACCEPT,
        location: getPoint(106.6622, 10.8184),
        createdAt: new Date(t4StartedAt.getTime() + 3 * 60000),
      }),
      verificationRepository.create({
        order: savedOrders[3],
        step: VerificationStep.PICKUP,
        location: getPoint(106.6622, 10.8184),
        cargoPhotoUrl: cargoPhotosPickup[1],
        createdAt: new Date(t4StartedAt.getTime() + 12 * 60000),
      }),
    ]);

    // Trip 5: Accepted (Assigned), Driver 4, Vehicle 2 (change status to available to assign, then let it be assigned)
    const trip5 = await tripRepository.save(
      tripRepository.create({
        driver: driversData[3],
        vehicle: vehiclesData[1],
        status: TripStatus.ACCEPTED,
        plannedRoute: getLineString([[106.7214, 10.8277], [106.6083, 10.7428]]),
        createdAt: new Date(Date.now() - 10 * 60000),
      })
    );
    await tripOrderRepository.save(
      tripOrderRepository.create({ trip: trip5, order: savedOrders[4], sequence: 1 })
    );

    // Seed active verifications for Order 5 (Assigned)
    await verificationRepository.save([
      verificationRepository.create({
        order: savedOrders[4],
        step: VerificationStep.ACCEPT,
        location: getPoint(106.7214, 10.8277),
        createdAt: new Date(Date.now() - 5 * 60000),
      }),
    ]);

    console.log('Seeded trips and journey verifications successfully.');

    // Seed GPS History for active trips
    console.log('Seeding GPS locations...');
    const now = new Date();
    
    // GPS history for Trip 3 (Active)
    for (let i = 0; i < 5; i++) {
      const recordedAt = new Date(t3StartedAt.getTime() + i * 8 * 60000);
      const lng = 106.7865 + (i * (106.8000 - 106.7865) / 4);
      const lat = 10.7584 + (i * (10.8000 - 10.7584) / 4);
      await gpsRepository.save(
        gpsRepository.create({
          vehicle: vehiclesData[3],
          trip: trip3,
          location: getPoint(lng, lat),
          speedKmh: 45 + Math.random() * 15,
          heading: 45,
          recordedAt,
        })
      );
    }

    // GPS history for Trip 4 (Active)
    for (let i = 0; i < 3; i++) {
      const recordedAt = new Date(t4StartedAt.getTime() + i * 7 * 60000);
      const lng = 106.6622 + (i * (106.7000 - 106.6622) / 2);
      const lat = 10.8184 + (i * (10.7800 - 10.8184) / 2);
      await gpsRepository.save(
        gpsRepository.create({
          vehicle: vehiclesData[4],
          trip: trip4,
          location: getPoint(lng, lat),
          speedKmh: 35 + Math.random() * 10,
          heading: 135,
          recordedAt,
        })
      );
    }
    console.log('GPS locations seeded.');

    // Alerts (Speed, Route Deviation, Abnormal Stop)
    console.log('Seeding alerts...');
    await alertRepository.save([
      alertRepository.create({
        trip: trip3,
        vehicle: vehiclesData[3],
        driver: driversData[2],
        type: AlertType.SPEED_VIOLATION,
        severity: AlertSeverity.MEDIUM,
        message: 'Tài xế chạy quá tốc độ giới hạn (65 km/h trên đường Nguyễn Thị Định)',
        location: getPoint(106.7900, 10.7700),
        isResolved: false,
        createdAt: new Date(t3StartedAt.getTime() + 10 * 60000),
      }),
      alertRepository.create({
        trip: trip4,
        vehicle: vehiclesData[4],
        driver: driversData[4],
        type: AlertType.ABNORMAL_STOP,
        severity: AlertSeverity.LOW,
        message: 'Phương tiện dừng bất thường quá 10 phút trên đường Cộng Hòa',
        location: getPoint(106.6800, 10.8000),
        isResolved: false,
        createdAt: new Date(t4StartedAt.getTime() + 15 * 60000),
      }),
      alertRepository.create({
        trip: trip1,
        vehicle: vehiclesData[0],
        driver: driversData[0],
        type: AlertType.ROUTE_DEVIATION,
        severity: AlertSeverity.HIGH,
        message: 'Phương tiện đi sai lộ trình đã định hơn 500m',
        location: getPoint(106.7088, 10.7820),
        isResolved: true,
        resolvedAt: new Date(t1StartedAt.getTime() + 35 * 60000),
        createdAt: new Date(t1StartedAt.getTime() + 25 * 60000),
      }),
    ]);
    console.log('Alerts seeded.');

    console.log('Seeding completed successfully! Database is populated with premium, realistic data.');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await dataSource.destroy();
  }
}

seed();
