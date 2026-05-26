import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../entities/user.entity';
import { Driver } from '../entities/driver.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Order } from '../entities/order.entity';
import { Trip } from '../entities/trip.entity';
import { TripOrder } from '../entities/trip-order.entity';
import { GpsLocation } from '../entities/gps-location.entity';
import { Alert } from '../entities/alert.entity';
import { DriverKpi } from '../entities/driver-kpi.entity';
import { OrderVerification } from '../entities/order-verification.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    User,
    Driver,
    Vehicle,
    Order,
    Trip,
    TripOrder,
    GpsLocation,
    Alert,
    DriverKpi,
    OrderVerification,
  ],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  synchronize: false, // Always false for migrations
  ssl: process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production',
  extra: {
    ssl:
      process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production'
        ? {
            rejectUnauthorized: false,
          }
        : null,
  },
});
