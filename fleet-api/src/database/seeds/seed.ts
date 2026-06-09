process.env.TZ = 'UTC';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../../entities/user.entity';
import { Driver, DriverStatus } from '../../entities/driver.entity';
import {
  Vehicle,
  VehicleType,
  VehicleStatus,
} from '../../entities/vehicle.entity';
import {
  Order,
  OrderStatus,
  OrderCategory,
  OrderPriority,
} from '../../entities/order.entity';
import { Trip, TripStatus } from '../../entities/trip.entity';
import { TripOrder } from '../../entities/trip-order.entity';
import { GpsLocation } from '../../entities/gps-location.entity';
import { Alert, AlertType, AlertSeverity } from '../../entities/alert.entity';
import { DriverKpi } from '../../entities/driver-kpi.entity';
import {
  OrderVerification,
  VerificationStep,
} from '../../entities/order-verification.entity';
import * as bcrypt from 'bcrypt';

export async function seedDatabase(
  dataSource: DataSource,
  adminEmail?: string,
  adminPassword?: string,
) {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    console.log('Initiating database clean wipe (TRUNCATE CASCADE)...');

    // Clear all tables while ignoring constraint blocks using CASCADE
    await queryRunner.query('TRUNCATE TABLE "order_verifications" CASCADE;');
    await queryRunner.query('TRUNCATE TABLE "alerts" CASCADE;');
    await queryRunner.query('TRUNCATE TABLE "gps_locations" CASCADE;');
    await queryRunner.query('TRUNCATE TABLE "driver_kpi" CASCADE;');
    await queryRunner.query('TRUNCATE TABLE "trip_orders" CASCADE;');
    await queryRunner.query('TRUNCATE TABLE "trips" CASCADE;');
    await queryRunner.query('TRUNCATE TABLE "orders" CASCADE;');
    await queryRunner.query('TRUNCATE TABLE "vehicles" CASCADE;');
    await queryRunner.query('TRUNCATE TABLE "drivers" CASCADE;');
    await queryRunner.query('TRUNCATE TABLE "users" CASCADE;');

    console.log('Database wiped.');

    const userRepository = dataSource.getRepository(User);
    const driverRepository = dataSource.getRepository(Driver);
    const vehicleRepository = dataSource.getRepository(Vehicle);
    const orderRepository = dataSource.getRepository(Order);
    const tripRepository = dataSource.getRepository(Trip);
    const tripOrderRepository = dataSource.getRepository(TripOrder);
    const alertRepository = dataSource.getRepository(Alert);
    const kpiRepository = dataSource.getRepository(DriverKpi);
    const verificationRepository = dataSource.getRepository(OrderVerification);
    const gpsRepository = dataSource.getRepository(GpsLocation);

    console.log('Seeding system users...');
    const hashedPassword = await bcrypt.hash(adminPassword || 'Admin@456', 10);

    // Admin
    const adminUser = await userRepository.save(
      userRepository.create({
        email: adminEmail,
        passwordHash: hashedPassword,
        role: UserRole.ADMIN,
        fullName: 'Hệ thống Admin',
        phone: '0999888777',
      }),
    );

    // Dispatcher
    await userRepository.save(
      userRepository.create({
        email: 'dispatcher@fleettracker.com',
        passwordHash: hashedPassword,
        role: UserRole.DISPATCHER,
        fullName: 'Điều phối viên',
        phone: '0999777666',
      }),
    );

    // 5 Drivers (Realistic Vietnamese Names & phones)
    const driversData: Driver[] = [];
    const driversInfo = [
      {
        email: 'driver1@fleettracker.com',
        name: 'Nguyễn Văn Hùng',
        phone: '0901234567',
        license: 'C',
        fingerprintId: null as any,
        avatarUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      },
      {
        email: 'driver2@fleettracker.com',
        name: 'Trần Thanh Hải',
        phone: '0912345678',
        license: 'B2',
        fingerprintId: null as any,
        avatarUrl:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
      },
      {
        email: 'driver3@fleettracker.com',
        name: 'Lê Minh Quốc',
        phone: '0987654321',
        license: 'D',
        fingerprintId: null as any,
        avatarUrl:
          'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop',
      },
      {
        email: 'driver4@fleettracker.com',
        name: 'Phạm Hoàng Nam',
        phone: '0934567890',
        license: 'FC',
        fingerprintId: null as any,
        avatarUrl:
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
      },
      {
        email: 'driver5@fleettracker.com',
        name: 'Vũ Tiến Đạt',
        phone: '0977889900',
        license: 'C',
        fingerprintId: null as any,
        avatarUrl:
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop',
      },
    ];

    for (const info of driversInfo) {
      const u = await userRepository.save(
        userRepository.create({
          email: info.email,
          passwordHash: hashedPassword,
          role: UserRole.DRIVER,
          fullName: info.name,
          phone: info.phone,
          avatarUrl: info.avatarUrl,
        }),
      );

      const d = await driverRepository.save(
        driverRepository.create({
          user: u,
          licenseClass: info.license,
          licenseExpiry: new Date('2031-12-31'),
          status: DriverStatus.AVAILABLE,
          fingerprintId: info.fingerprintId,
        }),
      );
      driversData.push(d);

      // Diverse realistic KPI leaderboard stats
      const kpis = [
        {
          totalTrips: 52,
          completedTrips: 50,
          completionRate: 96,
          speedViolations: 1,
          routeViolations: 0,
          abnormalStops: 0,
          incidents: 0,
          totalViolations: 1,
          kpiScore: 95,
        },
        {
          totalTrips: 45,
          completedTrips: 40,
          completionRate: 88,
          speedViolations: 2,
          routeViolations: 1,
          abnormalStops: 1,
          incidents: 0,
          totalViolations: 4,
          kpiScore: 79,
        },
        {
          totalTrips: 48,
          completedTrips: 46,
          completionRate: 95,
          speedViolations: 0,
          routeViolations: 1,
          abnormalStops: 1,
          incidents: 0,
          totalViolations: 2,
          kpiScore: 89,
        },
        {
          totalTrips: 32,
          completedTrips: 28,
          completionRate: 87,
          speedViolations: 2,
          routeViolations: 2,
          abnormalStops: 1,
          incidents: 0,
          totalViolations: 5,
          kpiScore: 71,
        },
        {
          totalTrips: 58,
          completedTrips: 58,
          completionRate: 100,
          speedViolations: 0,
          routeViolations: 0,
          abnormalStops: 0,
          incidents: 0,
          totalViolations: 0,
          kpiScore: 99,
        },
      ];
      const currentIdx = driversData.length - 1;
      const kpiInfo = kpis[currentIdx] || kpis[0];

      await kpiRepository.save(
        kpiRepository.create({
          driver: d,
          totalTrips: kpiInfo.totalTrips,
          completedTrips: kpiInfo.completedTrips,
          completionRate: kpiInfo.completionRate,
          speedViolations: kpiInfo.speedViolations,
          routeViolations: kpiInfo.routeViolations,
          abnormalStops: kpiInfo.abnormalStops,
          incidents: kpiInfo.incidents,
          totalViolations: kpiInfo.totalViolations,
          kpiScore: kpiInfo.kpiScore,
        }),
      );
    }
    console.log(
      `Seeded ${driversData.length} drivers with custom realistic KPIs.`,
    );

    // 5 Vehicles
    console.log('Seeding vehicles...');
    const vehiclesData: Vehicle[] = [];
    const vehiclesInfo = [
      {
        plateNumber: '29C-432.10',
        type: VehicleType.MEDIUM,
        capacity: 3500,
        model: 'Isuzu NPR400',
        year: 2022,
        status: VehicleStatus.DELIVERING,
        imageUrl:
          'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&h=400&fit=crop',
      },
      {
        plateNumber: '29D-876.54',
        type: VehicleType.LARGE,
        capacity: 8000,
        model: 'Hino 500',
        year: 2021,
        status: VehicleStatus.MAINTENANCE,
        imageUrl:
          'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop',
      },
      {
        plateNumber: '30A-999.99',
        type: VehicleType.SMALL,
        capacity: 1500,
        model: 'Suzuki Carry Pro',
        year: 2023,
        status: VehicleStatus.AVAILABLE,
        imageUrl:
          'https://images.unsplash.com/photo-1626847037657-fd3622613ce3?w=600&h=400&fit=crop',
      },
      {
        plateNumber: '29C-543.21',
        type: VehicleType.MEDIUM,
        capacity: 4000,
        model: 'Hyundai Mighty',
        year: 2020,
        status: VehicleStatus.AVAILABLE,
        imageUrl:
          'https://images.unsplash.com/photo-1591768793355-74d75b57d59f?w=600&h=400&fit=crop',
      },
      {
        plateNumber: '30E-888.88',
        type: VehicleType.LARGE,
        capacity: 10000,
        model: 'Thaco Auman',
        year: 2019,
        status: VehicleStatus.DELIVERING,
        imageUrl:
          'https://images.unsplash.com/photo-1516576880881-14017bab1012?w=600&h=400&fit=crop',
      },
    ];

    for (let i = 0; i < vehiclesInfo.length; i++) {
      const v = vehiclesInfo[i];
      const assignedDriver = driversData[i];

      const vehicle = await vehicleRepository.save(
        vehicleRepository.create({
          plateNumber: v.plateNumber,
          type: v.type,
          maxCapacityKg: v.capacity,
          model: v.model,
          year: v.year,
          status: v.status,
          deviceId: `device_00${i + 1}`,
          driver: assignedDriver,
          imageUrl: v.imageUrl,
          lastKnownLocation: {
            type: 'Point',
            coordinates: [105.834159 + i * 0.015, 21.027764 + i * 0.012],
          },
        }),
      );
      vehiclesData.push(vehicle);
    }
    console.log(`Seeded ${vehiclesData.length} vehicles.`);

    // 10 Orders centered in Hanoi
    console.log('Seeding realistic orders...');
    const ordersData: Order[] = [];
    const ordersInfo = [
      {
        weight: 1200,
        desc: 'Lô hàng may mặc xuất khẩu - Hoàn Kiếm',
        pickup: 'Chợ Đồng Xuân, Hoàn Kiếm, Hà Nội',
        pLng: 105.8492,
        pLat: 21.0382,
        deliv: 'Ga Hà Nội, Đống Đa, Hà Nội',
        dLng: 105.8405,
        dLat: 21.0253,
        status: OrderStatus.PENDING,
        category: OrderCategory.OTHER,
        priority: OrderPriority.HIGH,
        name: 'Nguyễn Thị Hoa',
        phone: '0987654321',
        deadline: new Date(Date.now() + 2 * 3600000),
        createdAt: new Date(Date.now() - 2 * 60 * 1000),
      },
      {
        weight: 800,
        desc: 'Thiết bị điện tử gia dụng - Cầu Giấy',
        pickup: 'Trần Duy Hưng, Cầu Giấy, Hà Nội',
        pLng: 105.796,
        pLat: 21.009,
        deliv: 'Khu công nghiệp Bắc Thăng Long, Đông Anh, Hà Nội',
        dLng: 105.783,
        dLat: 21.115,
        status: OrderStatus.PENDING,
        category: OrderCategory.FRAGILE,
        priority: OrderPriority.MEDIUM,
        name: 'Phạm Minh Đức',
        phone: '0912345678',
        deadline: new Date(Date.now() + 4 * 3600000),
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
      },
      {
        weight: 2400,
        desc: 'Thực phẩm đông lạnh nhập khẩu - Nội Bài',
        pickup: 'Cảng Hàng Không Nội Bài, Sóc Sơn, Hà Nội',
        pLng: 105.8056,
        pLat: 21.2187,
        deliv: 'Siêu thị Big C Thăng Long, Cầu Giấy, Hà Nội',
        dLng: 105.7942,
        dLat: 21.0068,
        status: OrderStatus.PENDING,
        category: OrderCategory.OTHER,
        priority: OrderPriority.HIGH,
        name: 'Trần Văn Cường',
        phone: '0901234567',
        deadline: new Date(Date.now() + 30 * 60 * 1000),
        createdAt: new Date(Date.now() - 25 * 60 * 1000),
      },
      {
        weight: 1500,
        desc: 'Vật liệu xây dựng & phụ gia - Hà Đông',
        pickup: 'Khu đô thị Văn Quán, Hà Đông, Hà Nội',
        pLng: 105.783,
        pLat: 20.978,
        deliv: 'Khu đô thị Times City, Hai Bà Trưng, Hà Nội',
        dLng: 105.869,
        dLat: 21.006,
        status: OrderStatus.DELIVERED,
        category: OrderCategory.BULK,
        priority: OrderPriority.MEDIUM,
        name: 'Lê Hoàng Anh',
        phone: '0934567890',
        deadline: new Date(Date.now() - 2 * 3600000),
        createdAt: new Date(Date.now() - 3 * 3600000),
      },
      {
        weight: 950,
        desc: 'Nông sản & Trái cây miền Bắc - Long Biên',
        pickup: 'Chợ đầu mối Long Biên, Ba Đình, Hà Nội',
        pLng: 105.8499,
        pLat: 21.045,
        deliv: 'Chợ Hôm, Hai Bà Trưng, Hà Nội',
        dLng: 105.8495,
        dLat: 21.0182,
        status: OrderStatus.DELIVERED,
        category: OrderCategory.BULK,
        priority: OrderPriority.LOW,
        name: 'Vũ Thị Lan',
        phone: '0977889900',
        deadline: new Date(Date.now() - 1 * 3600000),
        createdAt: new Date(Date.now() - 4 * 3600000),
      },
      {
        weight: 3100,
        desc: 'Hóa chất công nghiệp nguy hiểm - Bắc Ninh',
        pickup: 'KCN Tiên Sơn, Tiên Du, Bắc Ninh',
        pLng: 106.015,
        pLat: 21.09,
        deliv: 'Kho tổng Đức Giang, Long Biên, Hà Nội',
        dLng: 105.895,
        dLat: 21.055,
        status: OrderStatus.DELIVERED,
        category: OrderCategory.DANGEROUS,
        priority: OrderPriority.HIGH,
        name: 'Nguyễn Tiến Dũng',
        phone: '0966778899',
        deadline: new Date(Date.now() - 3 * 3600000),
        createdAt: new Date(Date.now() - 5 * 3600000),
      },
      {
        weight: 1900,
        desc: 'Dược phẩm & Vật tư y tế - Đống Đa',
        pickup: 'Bệnh viện Bạch Mai, Đống Đa, Hà Nội',
        pLng: 105.8418,
        pLat: 21.0015,
        deliv: 'Trung tâm Y tế Sóc Sơn, Hà Nội',
        dLng: 105.83,
        dLat: 21.258,
        status: OrderStatus.DELIVERING,
        category: OrderCategory.FRAGILE,
        priority: OrderPriority.HIGH,
        name: 'Hoàng Văn Nam',
        phone: '0988990011',
        deadline: new Date(Date.now() + 5 * 3600000),
        createdAt: new Date(Date.now() - 40 * 60 * 1000),
      },
      {
        weight: 700,
        desc: 'Phụ tùng ô tô & Xe máy chuyên dụng - Gia Lâm',
        pickup: 'KCN Sài Đồng B, Long Biên, Hà Nội',
        pLng: 105.905,
        pLat: 21.025,
        deliv: 'Đường Nguyễn Trãi, Thanh Xuân, Hà Nội',
        dLng: 105.81,
        dLat: 20.998,
        status: OrderStatus.ASSIGNED,
        category: OrderCategory.BULKY,
        priority: OrderPriority.MEDIUM,
        name: 'Đặng Quốc Huy',
        phone: '0955667788',
        deadline: new Date(Date.now() - 90 * 60 * 1000),
        createdAt: new Date(Date.now() - 50 * 60 * 1000),
      },
      {
        weight: 1350,
        desc: 'Bao bì giấy & Hộp carton - Thanh Trì',
        pickup: 'KCN Ngọc Hồi, Thanh Trì, Hà Nội',
        pLng: 105.84,
        pLat: 20.932,
        deliv: 'Đường Giải Phóng, Hai Bà Trưng, Hà Nội',
        dLng: 105.842,
        dLat: 20.985,
        status: OrderStatus.ASSIGNED,
        category: OrderCategory.BULKY,
        priority: OrderPriority.LOW,
        name: 'Lê Minh Tâm',
        phone: '0944556677',
        deadline: new Date(Date.now() + 75 * 60 * 1000),
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
      },
      {
        weight: 2800,
        desc: 'Thức ăn chăn nuôi dạng hạt - Hưng Yên',
        pickup: 'KCN Phố Nối A, Yên Mỹ, Hưng Yên',
        pLng: 106.03,
        pLat: 20.96,
        deliv: 'Trang trại chăn nuôi Đông Anh, Hà Nội',
        dLng: 105.84,
        dLat: 21.15,
        status: OrderStatus.ASSIGNED,
        category: OrderCategory.BULK,
        priority: OrderPriority.MEDIUM,
        name: 'Phạm Minh Tuấn',
        phone: '0933445566',
        deadline: new Date(Date.now() + 5 * 3600000),
        createdAt: new Date(Date.now() - 70 * 60 * 1000),
      },
    ];

    for (const info of ordersInfo) {
      const order = await orderRepository.save(
        orderRepository.create({
          weightKg: info.weight,
          description: info.desc,
          pickupAddress: info.pickup,
          pickupLocation: {
            type: 'Point',
            coordinates: [info.pLng, info.pLat],
          },
          deliveryAddress: info.deliv,
          deliveryLocation: {
            type: 'Point',
            coordinates: [info.dLng, info.dLat],
          },
          status: info.status,
          category: info.category,
          priority: info.priority,
          recipientName: info.name,
          recipientPhone: info.phone,
          deliveryDeadline: info.deadline,
          createdAt: info.createdAt,
          photoUrl: `https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop`,
          signatureUrl: undefined,
        }),
      );
      ordersData.push(order);
    }
    console.log(`Seeded ${ordersData.length} orders.`);

    // Trips and verifications
    console.log('Seeding trips & journey verifications...');

    // 1. trip1 (PENDING) - Driver 4 (Phạm Hoàng Nam), Vehicle 4 (Hyundai Mighty)
    const trip1 = await tripRepository.save(
      tripRepository.create({
        vehicle: vehiclesData[3],
        driver: driversData[3],
        status: TripStatus.PENDING,
        totalDistanceKm: 15.2,
        estimatedFuelCost: 120000,
        plannedRoute: {
          type: 'LineString',
          coordinates: [
            [105.905, 21.025],
            [105.86, 21.01],
            [105.81, 20.998],
          ],
        },
      }),
    );
    // Link Orders 9, 10 to trip1
    await tripOrderRepository.save(
      tripOrderRepository.create({
        tripId: trip1.id,
        orderId: ordersData[8].id,
        sequence: 1,
      }),
    );
    await tripOrderRepository.save(
      tripOrderRepository.create({
        tripId: trip1.id,
        orderId: ordersData[9].id,
        sequence: 2,
      }),
    );

    // Update Hyundai Mighty (vehicle 4) currentLoadKg
    vehiclesData[3].currentLoadKg =
      Number(ordersData[8].weightKg) + Number(ordersData[9].weightKg);
    await vehicleRepository.save(vehiclesData[3]);

    // 2. trip2 (IN_PROGRESS) - Driver 1 (Nguyễn Văn Hùng), Vehicle 1 (Isuzu plate '29C-432.10')
    const trip2 = await tripRepository.save(
      tripRepository.create({
        vehicle: vehiclesData[0],
        driver: driversData[0],
        status: TripStatus.IN_PROGRESS,
        totalDistanceKm: 22.1,
        estimatedFuelCost: 180000,
        startedAt: new Date(Date.now() - 30 * 60 * 1000),
        plannedRoute: {
          type: 'LineString',
          coordinates: [
            [105.8418, 21.0015],
            [105.839, 21.025],
            [105.835, 21.05],
            [105.83, 21.258],
          ],
        },
      }),
    );
    // Link Order 7 and Order 8 to trip2
    await tripOrderRepository.save(
      tripOrderRepository.create({
        tripId: trip2.id,
        orderId: ordersData[6].id,
        sequence: 1,
      }),
    );
    await tripOrderRepository.save(
      tripOrderRepository.create({
        tripId: trip2.id,
        orderId: ordersData[7].id,
        sequence: 2,
      }),
    );

    // Update Isuzu (vehicle 1) currentLoadKg
    vehiclesData[0].currentLoadKg =
      Number(ordersData[6].weightKg) + Number(ordersData[7].weightKg);
    await vehicleRepository.save(vehiclesData[0]);

    // Seed some live verifications for Nguyễn Văn Hùng's active trip orders
    // Order 7: completed pickup (status: DELIVERING)
    await verificationRepository.save(
      verificationRepository.create({
        orderId: ordersData[6].id,
        step: VerificationStep.PICKUP,
        fingerprintStatus: true,
        facePhotoUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop',
        cargoPhotoUrl:
          'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=400&fit=crop',
        location: { type: 'Point', coordinates: [105.8418, 21.0015] },
      }),
    );

    // Order 8 (status: ASSIGNED) has no verifications seeded

    // Update Nguyễn Văn Hùng status to ON_TRIP
    driversData[0].status = DriverStatus.ON_TRIP;
    await driverRepository.save(driversData[0]);

    // 3. trip3 (COMPLETED) - Driver 2 (Trần Thanh Hải), Vehicle 2 (Hino 500)
    const trip3 = await tripRepository.save(
      tripRepository.create({
        vehicle: vehiclesData[1],
        driver: driversData[1],
        status: TripStatus.COMPLETED,
        totalDistanceKm: 35.8,
        estimatedFuelCost: 280000,
        startedAt: new Date(Date.now() - 4 * 3600000),
        completedAt: new Date(Date.now() - 1 * 3600000),
        plannedRoute: {
          type: 'LineString',
          coordinates: [
            [105.783, 20.978],
            [105.82, 20.99],
            [105.869, 21.006],
          ],
        },
      }),
    );
    // Link Orders 4, 5, 6 to trip3
    await tripOrderRepository.save(
      tripOrderRepository.create({
        tripId: trip3.id,
        orderId: ordersData[3].id,
        sequence: 1,
      }),
    );
    await tripOrderRepository.save(
      tripOrderRepository.create({
        tripId: trip3.id,
        orderId: ordersData[4].id,
        sequence: 2,
      }),
    );
    await tripOrderRepository.save(
      tripOrderRepository.create({
        tripId: trip3.id,
        orderId: ordersData[5].id,
        sequence: 3,
      }),
    );

    // Seed verifications for completed trip3 orders (ordersData[3], [4], [5])
    const trip3Orders = [ordersData[3], ordersData[4], ordersData[5]];
    for (const order of trip3Orders) {
      // PICKUP
      await verificationRepository.save(
        verificationRepository.create({
          orderId: order.id,
          step: VerificationStep.PICKUP,
          fingerprintStatus: true,
          facePhotoUrl:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop',
          cargoPhotoUrl:
            'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=400&fit=crop,https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=400&fit=crop',
          location: order.pickupLocation,
        }),
      );
      // DELIVERY
      await verificationRepository.save(
        verificationRepository.create({
          orderId: order.id,
          step: VerificationStep.DELIVERY,
          fingerprintStatus: true,
          facePhotoUrl:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop',
          cargoPhotoUrl:
            'https://images.unsplash.com/photo-1598257006458-087169a1f08d?w=400&h=400&fit=crop',
          location: order.deliveryLocation,
        }),
      );
    }

    // 4. trip4 (IN_PROGRESS) - Driver 5 (Vũ Tiến Đạt), Vehicle 5 (Thaco Auman)
    const trip4 = await tripRepository.save(
      tripRepository.create({
        vehicle: vehiclesData[4],
        driver: driversData[4],
        status: TripStatus.IN_PROGRESS,
        totalDistanceKm: 18.5,
        estimatedFuelCost: 150000,
        startedAt: new Date(Date.now() - 15 * 60 * 1000),
        plannedRoute: {
          type: 'LineString',
          coordinates: [
            [105.8056, 21.2187],
            [105.8, 21.1],
            [105.7942, 21.0068],
          ],
        },
      }),
    );

    // Link Order 3 to trip4, and update its status to DELIVERING
    ordersData[2].status = OrderStatus.DELIVERING;
    await orderRepository.save(ordersData[2]);

    await tripOrderRepository.save(
      tripOrderRepository.create({
        tripId: trip4.id,
        orderId: ordersData[2].id,
        sequence: 1,
      }),
    );

    // Update Thaco Auman (vehicle 5) currentLoadKg
    vehiclesData[4].currentLoadKg = Number(ordersData[2].weightKg);
    await vehicleRepository.save(vehiclesData[4]);

    // Update Vũ Tiến Đạt status to ON_TRIP
    driversData[4].status = DriverStatus.ON_TRIP;
    await driverRepository.save(driversData[4]);

    // 5. Generate 30-day historical completed trips for rich reports & analytics
    console.log('Generating 30-day historical completed trips for reports...');
    const nowMs = Date.now();
    const FUEL_RATES = { small: 8, medium: 12, large: 16 };
    const DEFAULT_FUEL_PRICE = 25000;

    for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
      // 1 or 2 completed trips per day
      const numTrips = dayOffset % 4 === 0 ? 2 : 1;

      for (let t = 0; t < numTrips; t++) {
        // Deterministic but realistic driver & vehicle selection
        const driverIndex = (dayOffset * 2 + t) % driversData.length;
        const vehicleIndex = (dayOffset * 3 + t) % vehiclesData.length;

        const driver = driversData[driverIndex];
        const vehicle = vehiclesData[vehicleIndex];

        const date = new Date(nowMs - dayOffset * 24 * 3600000);
        const startedAt = new Date(date.getTime() - 4 * 3600000);
        const completedAt = new Date(date.getTime());

        const distance = Math.round(
          15 + (dayOffset % 7) * 8 + Math.random() * 5,
        ); // realistic distance distribution
        const fuelRate = FUEL_RATES[vehicle.type] || FUEL_RATES.medium;
        const estimatedFuelCost = Math.round(
          (distance / 100) * fuelRate * DEFAULT_FUEL_PRICE,
        );

        const historicalTrip = await tripRepository.save(
          tripRepository.create({
            vehicle,
            driver,
            status: TripStatus.COMPLETED,
            createdAt: startedAt,
            startedAt,
            completedAt,
            totalDistanceKm: distance,
            estimatedFuelCost,
          }),
        );

        // Save TripOrders
        const categories = [
          OrderCategory.BULK,
          OrderCategory.FRAGILE,
          OrderCategory.BULKY,
          OrderCategory.DANGEROUS,
          OrderCategory.OTHER,
        ];
        const priorities = [
          OrderPriority.LOW,
          OrderPriority.MEDIUM,
          OrderPriority.HIGH,
        ];
        const recipientNames = [
          'Nguyễn Thị Thu Hà',
          'Trần Minh Hoàng',
          'Lê Hoài Nam',
          'Phạm Thanh Sơn',
          'Vũ Thu Trang',
          'Nguyễn Đức Anh',
          'Lâm Minh Tuấn',
          'Đỗ Thùy Linh',
        ];
        const recipientPhones = [
          '0912345678',
          '0987654321',
          '0901234567',
          '0934567890',
          '0977889900',
          '0966778899',
          '0988990011',
          '0955667788',
        ];

        const orderCategory = categories[(dayOffset + t) % categories.length];
        const orderPriority =
          priorities[(dayOffset * 2 + t) % priorities.length];
        const recipientName =
          recipientNames[(dayOffset + t) % recipientNames.length];
        const recipientPhone =
          recipientPhones[(dayOffset + t) % recipientPhones.length];

        const order1 = await orderRepository.save(
          orderRepository.create({
            weightKg: Math.round(
              400 + (dayOffset % 5) * 300 + Math.random() * 200,
            ),
            description: `Vận chuyển hàng tiêu dùng ngày D-${dayOffset} T-${t}`,
            pickupAddress: `Kho hàng ${driver.user.fullName} lấy`,
            pickupLocation: {
              type: 'Point',
              coordinates: [
                105.8341 + (dayOffset % 5) * 0.01,
                21.0277 + (t % 3) * 0.01,
              ],
            },
            deliveryAddress: `Điểm giao hàng ${vehicle.plateNumber}`,
            deliveryLocation: {
              type: 'Point',
              coordinates: [
                105.8525 + (dayOffset % 3) * 0.01,
                21.0285 + (t % 2) * 0.01,
              ],
            },
            status: OrderStatus.DELIVERED,
            category: orderCategory,
            priority: orderPriority,
            recipientName,
            recipientPhone,
            deliveryDeadline: completedAt || startedAt,
            createdAt: startedAt,
          }),
        );

        await tripOrderRepository.save(
          tripOrderRepository.create({
            tripId: historicalTrip.id,
            orderId: order1.id,
            sequence: 1,
          }),
        );

        // Seed historical verifications for this trip's orders
        for (const order of [order1]) {
          await verificationRepository.save(
            verificationRepository.create({
              orderId: order.id,
              step: VerificationStep.PICKUP,
              fingerprintStatus: true,
              facePhotoUrl:
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop',
              cargoPhotoUrl:
                'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=400&fit=crop,https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=400&fit=crop',
              location: order.pickupLocation,
            }),
          );
          await verificationRepository.save(
            verificationRepository.create({
              orderId: order.id,
              step: VerificationStep.DELIVERY,
              fingerprintStatus: true,
              facePhotoUrl:
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop',
              cargoPhotoUrl:
                'https://images.unsplash.com/photo-1598257006458-087169a1f08d?w=400&h=400&fit=crop',
              location: order.deliveryLocation,
            }),
          );
        }

        // Seed a mix of resolved Speed violations & Route deviations for historical alerts stats
        if (dayOffset % 6 === 0 && t === 0) {
          await alertRepository.save(
            alertRepository.create({
              tripId: historicalTrip.id,
              vehicle,
              driver,
              type: AlertType.SPEED_VIOLATION,
              severity: AlertSeverity.MEDIUM,
              message: `Xe ${vehicle.plateNumber} chạy quá tốc độ cho phép (${Math.round(65 + Math.random() * 20)}km/h)`,
              createdAt: startedAt,
              isResolved: true,
              resolvedAt: completedAt,
            }),
          );
        }
        if (dayOffset % 9 === 0 && t === 0) {
          await alertRepository.save(
            alertRepository.create({
              tripId: historicalTrip.id,
              vehicle,
              driver,
              type: AlertType.ROUTE_DEVIATION,
              severity: AlertSeverity.HIGH,
              message: `Xe ${vehicle.plateNumber} đi chệch khỏi lộ trình đã hoạch định`,
              createdAt: startedAt,
              isResolved: true,
              resolvedAt: completedAt,
            }),
          );
        }
      }
    }

    console.log('Seeding unresolved active alerts...');
    await alertRepository.save(
      alertRepository.create({
        tripId: trip2.id,
        vehicle: vehiclesData[0],
        driver: driversData[0],
        type: AlertType.INCIDENT,
        severity: AlertSeverity.CRITICAL,
        message:
          'Tài xế Nguyễn Văn Hùng báo cáo sự cố va chạm giao thông khẩn cấp trên Đường Giải Phóng!',
        createdAt: new Date('2026-06-02T19:36:56+07:00'), // Fixed date (15 mins before 2026-06-02T19:51:56+07:00)
        isResolved: false,
      }),
    );

    await alertRepository.save(
      alertRepository.create({
        vehicle: vehiclesData[3],
        driver: driversData[3],
        type: AlertType.SPEED_VIOLATION,
        severity: AlertSeverity.HIGH,
        message: 'Xe 29C-543.21 chạy quá tốc độ 85 km/h ở khu vực nội thành!',
        createdAt: new Date('2026-06-02T19:06:56+07:00'), // Fixed date (45 mins before 2026-06-02T19:51:56+07:00)
        isResolved: false,
      }),
    );

    await alertRepository.save(
      alertRepository.create({
        tripId: trip4.id,
        vehicle: vehiclesData[4],
        driver: driversData[4],
        type: AlertType.ROUTE_DEVIATION,
        severity: AlertSeverity.MEDIUM,
        message: 'Xe 30E-888.88 đi chệch khỏi lộ trình quy định!',
        createdAt: new Date('2026-06-02T18:51:56+07:00'), // Fixed date (60 mins before 2026-06-02T19:51:56+07:00)
        isResolved: false,
      }),
    );

    console.log('Seeding GPS locations...');
    const gpsPoints = [
      { lng: 105.8418, lat: 21.0015, speed: 0, heading: 0 },
      { lng: 105.839, lat: 21.025, speed: 45, heading: 340 },
      { lng: 105.835, lat: 21.05, speed: 50, heading: 340 },
      { lng: 105.825, lat: 21.1, speed: 12, heading: 330 }, // Abnormal slow stop violation point
      { lng: 105.83, lat: 21.15, speed: 30, heading: 10 },
    ];

    for (let idx = 0; idx < gpsPoints.length; idx++) {
      const pt = gpsPoints[idx];
      await gpsRepository.save(
        gpsRepository.create({
          trip: trip2,
          vehicle: vehiclesData[0],
          location: { type: 'Point', coordinates: [pt.lng, pt.lat] },
          speedKmh: pt.speed,
          heading: pt.heading,
          recordedAt: new Date(Date.now() - (gpsPoints.length - idx) * 30000),
        }),
      );
    }

    console.log(
      'Seeding completed successfully! Database is populated with premium, realistic data.',
    );
  } catch (err) {
    console.error(
      'Fatal error encountered during database seeding:',
      err.message,
    );
    throw err;
  } finally {
    await queryRunner.release();
  }
}

// Auto-execute if run directly
import { AppDataSource } from '../data-source';
AppDataSource.initialize()
  .then(async (dataSource) => {
    console.log('Database connection initialized for seeding.');
    await seedDatabase(
      dataSource,
      process.env.SEED_ADMIN_EMAIL || 'admin2@fleettracker.com',
      process.env.SEED_ADMIN_PASSWORD || 'Admin@456',
    );
    await dataSource.destroy();
    console.log('Seeding process finished, connection closed.');
  })
  .catch((err) => {
    console.error('Error during seeding database connection:', err);
  });
