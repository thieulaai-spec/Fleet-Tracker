import { DataSource } from 'typeorm';
import { User, UserRole } from '../../entities/user.entity';
import { Driver, DriverStatus } from '../../entities/driver.entity';
import { Vehicle, VehicleType, VehicleStatus } from '../../entities/vehicle.entity';
import { Order, OrderStatus } from '../../entities/order.entity';
import { Trip, TripStatus } from '../../entities/trip.entity';
import { TripOrder } from '../../entities/trip-order.entity';
import { GpsLocation } from '../../entities/gps-location.entity';
import { Alert, AlertType, AlertSeverity } from '../../entities/alert.entity';
import { DriverKpi } from '../../entities/driver-kpi.entity';
import { OrderVerification, VerificationStep } from '../../entities/order-verification.entity';
import * as bcrypt from 'bcrypt';

export async function seedDatabase(dataSource: DataSource, adminEmail?: string, adminPassword?: string) {
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
      })
    );

    // Dispatcher
    await userRepository.save(
      userRepository.create({
        email: 'dispatcher@fleettracker.com',
        passwordHash: hashedPassword,
        role: UserRole.DISPATCHER,
        fullName: 'Điều phối viên',
        phone: '0999777666',
      })
    );

    // 5 Drivers (Realistic Vietnamese Names & phones)
    const driversData: Driver[] = [];
    const driversInfo = [
      { email: 'driver1@fleettracker.com', name: 'Nguyễn Văn Hùng', phone: '0901234567', license: 'C', fingerprintId: '1' },
      { email: 'driver2@fleettracker.com', name: 'Trần Thanh Hải', phone: '0912345678', license: 'B2', fingerprintId: '2' },
      { email: 'driver3@fleettracker.com', name: 'Lê Minh Quốc', phone: '0987654321', license: 'D', fingerprintId: '3' },
      { email: 'driver4@fleettracker.com', name: 'Phạm Hoàng Nam', phone: '0934567890', license: 'FC', fingerprintId: '4' },
      { email: 'driver5@fleettracker.com', name: 'Vũ Tiến Đạt', phone: '0977889900', license: 'C', fingerprintId: '5' },
    ];

    for (const info of driversInfo) {
      const u = await userRepository.save(
        userRepository.create({
          email: info.email,
          passwordHash: hashedPassword,
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
          fingerprintId: info.fingerprintId,
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
      { plateNumber: '43C-888.88', type: VehicleType.LARGE, capacity: 10000, model: 'Thaco Auman', year: 2019, status: VehicleStatus.DELIVERING },
    ];

    for (let i = 0; i < vehiclesInfo.length; i++) {
      const v = vehiclesInfo[i];
      const assignedDriver = i < 3 ? driversData[i] : null;
      
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
          imageUrl: `https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&h=400&fit=crop`,
          lastKnownLocation: {
            type: 'Point',
            coordinates: [106.660172 + i * 0.015, 10.762622 + i * 0.012],
          },
        })
      );
      vehiclesData.push(vehicle);
    }
    console.log(`Seeded ${vehiclesData.length} vehicles.`);

    // 10 Orders centered in HCM City
    console.log('Seeding realistic orders...');
    const ordersData: Order[] = [];
    const ordersInfo = [
      { weight: 1200, desc: 'Lô hàng may mặc xuất khẩu - Quận 1', pickup: 'Chợ Bến Thành, Quận 1, TP. HCM', pLng: 106.6979, pLat: 10.7725, deliv: 'Cảng Cát Lái, Quận 2, TP. HCM', dLng: 106.7900, dLat: 10.7600, status: OrderStatus.DELIVERED },
      { weight: 800, desc: 'Thiết bị điện tử gia dụng - Phú Nhuận', pickup: 'Nguyễn Kiệm, Phú Nhuận, TP. HCM', pLng: 106.6800, pLat: 10.8000, deliv: 'Khu công nghệ cao Q9, TP. HCM', dLng: 106.7972, dLat: 10.8444, status: OrderStatus.DELIVERED },
      { weight: 2400, desc: 'Thực phẩm đông lạnh nhập khẩu - Tân Bình', pickup: 'Cảng Hàng Không Tân Sơn Nhất, Tân Bình, TP. HCM', pLng: 106.6600, pLat: 10.8166, deliv: 'Siêu thị Co.opmart Thủ Đức, TP. HCM', dLng: 106.7600, dLat: 10.8500, status: OrderStatus.DELIVERED },
      { weight: 1500, desc: 'Vật liệu xây dựng & phụ gia - Quận 7', pickup: 'Lotte Mart Quận 7, TP. HCM', pLng: 106.7020, pLat: 10.7410, deliv: 'Khu đô thị Sala, Quận 2, TP. HCM', dLng: 106.7230, dLat: 10.7750, status: OrderStatus.DELIVERED },
      { weight: 950, desc: 'Nông sản & Trái cây miền Tây - Bình Tân', pickup: 'Chợ đầu mối Bình Điền, Bình Chánh, TP. HCM', pLng: 106.6080, pLat: 10.6860, deliv: 'Chợ Tân Định, Quận 1, TP. HCM', dLng: 106.6890, dLat: 10.7890, status: OrderStatus.DELIVERED },
      { weight: 3100, desc: 'Hóa mỹ phẩm & Chai lọ thủy tinh - Bình Dương', pickup: 'VSIP 1, Thuận An, Bình Dương', pLng: 106.7050, pLat: 10.9300, deliv: 'Kho tổng kho ngoại quan Cát Lái, TP. HCM', dLng: 106.7950, dLat: 10.7650, status: OrderStatus.DELIVERED },
      { weight: 1900, desc: 'Dược phẩm & Vật tư y tế - Quận 10', pickup: 'Bệnh viện Chợ Rẫy, Quận 5, TP. HCM', pLng: 106.6600, pLat: 10.7570, deliv: 'Trung tâm Y tế Quận 9, TP. HCM', dLng: 106.8100, dLat: 10.8300, status: OrderStatus.DELIVERING },
      { weight: 700, desc: 'Phụ tùng ô tô & Xe máy chuyên dụng - Thủ Đức', pickup: 'Linh Trung 1, Thủ Đức, TP. HCM', pLng: 106.7850, pLat: 10.8650, deliv: 'Đường Cộng Hòa, Tân Bình, TP. HCM', dLng: 106.6400, dLat: 10.8000, status: OrderStatus.ASSIGNED },
      { weight: 1350, desc: 'Bao bì giấy & Hộp carton - Tân Phú', pickup: 'KCN Tân Bình, Tân Phú, TP. HCM', pLng: 106.6200, pLat: 10.8100, deliv: 'Đại lộ Võ Văn Kiệt, Quận 5, TP. HCM', dLng: 106.6750, dLat: 10.7520, status: OrderStatus.ASSIGNED },
      { weight: 2800, desc: 'Thức ăn chăn nuôi dạng hạt - Long An', pickup: 'KCN Tân Đô, Đức Hòa, Long An', pLng: 106.4900, pLat: 10.7800, deliv: 'Trang trại chăn nuôi Củ Chi, TP. HCM', dLng: 106.5200, dLat: 10.9600, status: OrderStatus.ASSIGNED },
    ];

    for (const info of ordersInfo) {
      const order = await orderRepository.save(
        orderRepository.create({
          weightKg: info.weight,
          description: info.desc,
          pickupAddress: info.pickup,
          pickupLocation: { type: 'Point', coordinates: [info.pLng, info.pLat] },
          deliveryAddress: info.deliv,
          deliveryLocation: { type: 'Point', coordinates: [info.dLng, info.dLat] },
          status: info.status,
          photoUrl: `https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop`,
          signatureUrl: `https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&h=400&fit=crop`,
        })
      );
      ordersData.push(order);
    }
    console.log(`Seeded ${ordersData.length} orders.`);

    // Trips and verifications
    console.log('Seeding trips & journey verifications...');
    
    // Trip 1 (Nguyễn Văn Hùng - Isuzu medium plate '51C-432.10') - status: IN_PROGRESS
    const trip1 = await tripRepository.save(
      tripRepository.create({
        vehicle: vehiclesData[0],
        driver: driversData[0],
        status: TripStatus.IN_PROGRESS,
        startedAt: new Date(Date.now() - 3 * 3600000), // 3 hours ago
        totalDistanceKm: 18.5,
        estimatedFuelCost: 150000,
        plannedRoute: {
          type: 'LineString',
          coordinates: [
            [106.6600, 10.7570],
            [106.7000, 10.7800],
            [106.7500, 10.8000],
            [106.8100, 10.8300],
          ]
        },
        actualRoute: {
          type: 'LineString',
          coordinates: [
            [106.6600, 10.7570],
            [106.6850, 10.7700],
            [106.7020, 10.7820],
          ]
        }
      })
    );

    // Bind Order 7 & 8 to Trip 1
    await tripOrderRepository.save(tripOrderRepository.create({ tripId: trip1.id, orderId: ordersData[6].id, sequence: 1 }));
    await tripOrderRepository.save(tripOrderRepository.create({ tripId: trip1.id, orderId: ordersData[7].id, sequence: 2 }));

    // Seeding verifications for active Trip 1, Order 7 (delivering)
    console.log('Seeding verifications for Order 7...');
    await verificationRepository.save(
      verificationRepository.create({
        orderId: ordersData[6].id,
        step: VerificationStep.ACCEPT,
        fingerprintStatus: true,
        facePhotoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&h=300&fit=crop',
        cargoPhotoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=400&fit=crop',
        location: { type: 'Point', coordinates: [106.6600, 10.7570] },
      })
    );
    await verificationRepository.save(
      verificationRepository.create({
        orderId: ordersData[6].id,
        step: VerificationStep.PICKUP,
        fingerprintStatus: true,
        facePhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
        cargoPhotoUrl: 'https://images.unsplash.com/photo-1549194388-f61be84a6e9e?w=400&h=400&fit=crop',
        location: { type: 'Point', coordinates: [106.6620, 10.7580] },
      })
    );

    // Trip 2 (Trần Thanh Hải - status: DELIVERED/COMPLETED history)
    const trip2 = await tripRepository.save(
      tripRepository.create({
        vehicle: vehiclesData[1],
        driver: driversData[1],
        status: TripStatus.COMPLETED,
        startedAt: new Date(Date.now() - 24 * 3600000), // 1 day ago
        completedAt: new Date(Date.now() - 20 * 3600000),
        totalDistanceKm: 28.2,
        estimatedFuelCost: 320000,
      })
    );
    await tripOrderRepository.save(tripOrderRepository.create({ tripId: trip2.id, orderId: ordersData[0].id, sequence: 1 }));
    await tripOrderRepository.save(tripOrderRepository.create({ tripId: trip2.id, orderId: ordersData[1].id, sequence: 2 }));

    // Seed historical verifications for Trip 2
    for (const order of [ordersData[0], ordersData[1]]) {
      await verificationRepository.save(
        verificationRepository.create({
          orderId: order.id,
          step: VerificationStep.ACCEPT,
          fingerprintStatus: true,
          facePhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop',
          cargoPhotoUrl: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=400&fit=crop',
          location: { type: 'Point', coordinates: [106.6979, 10.7725] },
        })
      );
      await verificationRepository.save(
        verificationRepository.create({
          orderId: order.id,
          step: VerificationStep.DELIVERY,
          fingerprintStatus: true,
          facePhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop',
          cargoPhotoUrl: 'https://images.unsplash.com/photo-1598257006458-087169a1f08d?w=400&h=400&fit=crop',
          location: { type: 'Point', coordinates: [106.7900, 10.7600] },
        })
      );
    }

    console.log('Seeded trips and journey verifications successfully.');

    // Seed GPS locations
    console.log('Seeding GPS locations...');
    const gpsPoints = [
      { lng: 106.6600, lat: 10.7570, speed: 0, heading: 0 },
      { lng: 106.6700, lat: 10.7620, speed: 45, heading: 60 },
      { lng: 106.6800, lat: 10.7680, speed: 50, heading: 60 },
      { lng: 106.6900, lat: 10.7750, speed: 12, heading: 75 }, // Abnormal slow stop violation point
      { lng: 106.7020, lat: 10.7820, speed: 30, heading: 45 },
    ];

    for (let j = 0; j < gpsPoints.length; j++) {
      const pt = gpsPoints[j];
      await gpsRepository.save(
        gpsRepository.create({
          vehicleId: vehiclesData[0].id,
          tripId: trip1.id,
          location: { type: 'Point', coordinates: [pt.lng, pt.lat] },
          speedKmh: pt.speed,
          heading: pt.heading,
          recordedAt: new Date(Date.now() - (gpsPoints.length - j) * 60000),
        })
      );
    }
    console.log('GPS locations seeded.');

    // Seed alerts
    console.log('Seeding alerts...');
    await alertRepository.save(
      alertRepository.create({
        vehicle: vehiclesData[0],
        driver: driversData[0],
        trip: trip1,
        type: AlertType.SPEED_VIOLATION,
        severity: AlertSeverity.MEDIUM,
        message: 'Tài xế Nguyễn Văn Hùng vượt quá tốc độ cho phép 85km/h tại Đại Lộ Đông Tây.',
        location: { type: 'Point', coordinates: [106.6800, 10.7680] },
        isResolved: false,
      })
    );
    await alertRepository.save(
      alertRepository.create({
        vehicle: vehiclesData[0],
        driver: driversData[0],
        trip: trip1,
        type: AlertType.ABNORMAL_STOP,
        severity: AlertSeverity.HIGH,
        message: 'Dừng bất thường quá 15 phút không rõ nguyên nhân tại giao lộ Nguyễn Văn Cừ.',
        location: { type: 'Point', coordinates: [106.6900, 10.7750] },
        isResolved: false,
      })
    );
    console.log('Alerts seeded.');

    console.log('Seeding completed successfully! Database is populated with premium, realistic data.');
  } catch (err) {
    console.error('Fatal error encountered during database seeding:', err.message);
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
