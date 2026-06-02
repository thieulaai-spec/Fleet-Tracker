import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Vehicle, VehicleType, VehicleStatus } from '../src/entities/vehicle.entity';
import { Driver } from '../src/entities/driver.entity';
import { User } from '../src/entities/user.entity';
import { Order } from '../src/entities/order.entity';
import { Trip } from '../src/entities/trip.entity';
import { TripOrder } from '../src/entities/trip-order.entity';
import { Alert } from '../src/entities/alert.entity';
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

// Sample locations around Hanoi with coordinates [longitude, latitude]
const locations = [
  { name: 'Hoàn Kiếm (Downtown)', lat: 21.0285, lng: 105.8525 },
  { name: 'Ba Đình (Square)', lat: 21.0368, lng: 105.8347 },
  { name: 'Tây Hồ (West Lake)', lat: 21.0584, lng: 105.8242 },
  { name: 'Cầu Giấy (District)', lat: 21.0306, lng: 105.7963 },
  { name: 'Đống Đa (District)', lat: 21.0181, lng: 105.8252 },
  { name: 'Hai Bà Trưng (District)', lat: 21.0125, lng: 105.8504 },
  { name: 'Thanh Xuân (District)', lat: 20.9938, lng: 105.8122 },
  { name: 'Hà Đông (District)', lat: 20.9723, lng: 105.7739 },
  { name: 'Long Biên (Bridge Area)', lat: 21.0428, lng: 105.8600 },
  { name: 'Nội Bài (Airport)', lat: 21.2187, lng: 105.8056 },
];

async function seedVehicles() {
  try {
    await dataSource.initialize();
    console.log('Connected to database...');

    const vehicleRepository = dataSource.getRepository(Vehicle);

    // Check how many vehicles already exist
    const existingCount = await vehicleRepository.count();
    console.log(`Existing vehicles: ${existingCount}`);

    const newVehicles: Vehicle[] = [];

    for (let i = 0; i < locations.length; i++) {
      const location = locations[i];
      const plateNumber = `HN-${String(1000 + i).slice(-4)}`;

      // Check if vehicle already exists
      const exists = await vehicleRepository.findOne({
        where: { plateNumber },
      });

      if (!exists) {
        const vehicleData = {
          plateNumber,
          type: [VehicleType.SMALL, VehicleType.MEDIUM, VehicleType.LARGE][i % 3],
          maxCapacityKg: [500, 1000, 2000][i % 3],
          currentLoadKg: Math.random() * 500,
          status: [VehicleStatus.AVAILABLE, VehicleStatus.DELIVERING, VehicleStatus.MAINTENANCE][i % 3],
          lastKnownLocation: {
            type: 'Point',
            coordinates: [location.lng, location.lat],
          },
        };

        const vehicle = vehicleRepository.create(vehicleData);
        newVehicles.push(vehicle);
        console.log(`Created vehicle ${plateNumber} at ${location.name} (${location.lat}, ${location.lng})`);
      } else {
        console.log(`Vehicle ${plateNumber} already exists, skipping...`);
      }
    }

    if (newVehicles.length > 0) {
      await vehicleRepository.save(newVehicles);
      console.log(`\n✅ Added ${newVehicles.length} new vehicles to database`);
    } else {
      console.log('\n✅ All vehicles already exist in database');
    }

    // Display all vehicles
    const allVehicles = await vehicleRepository.find();
    console.log(`\nTotal vehicles in database: ${allVehicles.length}`);
    console.log('\nVehicles:');
    allVehicles.forEach((v) => {
      const coords = v.lastKnownLocation?.coordinates || [0, 0];
      console.log(`  ${v.plateNumber} - ${v.type} - Status: ${v.status} - Location: (${coords[1]}, ${coords[0]})`);
    });
  } catch (error) {
    console.error('Error during vehicle seeding:', error);
  } finally {
    await dataSource.destroy();
  }
}

seedVehicles();
