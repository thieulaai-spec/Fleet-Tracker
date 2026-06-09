import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Driver } from './entities/driver.entity';
import { Vehicle } from './entities/vehicle.entity';
import { Order } from './entities/order.entity';
import { Trip } from './entities/trip.entity';
import { TripOrder } from './entities/trip-order.entity';
import { GpsLocation } from './entities/gps-location.entity';
import { Alert } from './entities/alert.entity';
import { DriverKpi } from './entities/driver-kpi.entity';
import { OrderVerification } from './entities/order-verification.entity';
import { AuthModule } from './auth/auth.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { DriversModule } from './drivers/drivers.module';
import { OrdersModule } from './orders/orders.module';
import { UploadModule } from './upload/upload.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { TripsModule } from './trips/trips.module';
import { TrackingModule } from './tracking/tracking.module';
import { AlertsModule } from './alerts/alerts.module';
import { ReportsModule } from './reports/reports.module';
import { OptimizationModule } from './optimization/optimization.module';
import { HealthModule } from './common/health/health.module';
import { UsersModule } from './users/users.module';
import { OrderVerificationsModule } from './order-verifications/order-verifications.module';

@Module({
  imports: [
    // Environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Event Emitter
    EventEmitterModule.forRoot(),

    // Rate Limiting (Phase 08 - Security fix)
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60000), // TTL is in milliseconds for Throttler v6
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    // Database connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
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
        synchronize:
          configService.get<string>('NODE_ENV') === 'production'
            ? false
            : configService.get<string>('DB_SYNCHRONIZE') === 'true',
        logging: configService.get<string>('NODE_ENV') !== 'production',
        ssl:
          configService.get<string>('NODE_ENV') === 'production'
            ? true
            : configService.get<string>('DB_SSL') === 'true',
        extra: {
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
          ssl:
            configService.get<string>('NODE_ENV') === 'production' ||
            configService.get<string>('DB_SSL') === 'true'
              ? {
                  rejectUnauthorized: false,
                }
              : null,
        },
      }),
    }),

    // AuthModule added in Phase 02
    AuthModule,

    // Phase 03 modules
    VehiclesModule,
    DriversModule,
    OrdersModule,
    UploadModule,
    DispatchModule,
    TripsModule,
    TrackingModule,
    AlertsModule,
    ReportsModule,
    OptimizationModule,
    HealthModule,
    UsersModule,
    OrderVerificationsModule,

    // Modules to be added in future phases
    // TripsModule will be added in Phase 04
    // DispatchModule will be added in Phase 04
    // TrackingModule will be added in Phase 05
    // AlertsModule will be added in Phase 05
    // ReportsModule will be added in Phase 06
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
