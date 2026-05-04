import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Driver } from './entities/driver.entity';
import { Vehicle } from './entities/vehicle.entity';
import { Order } from './entities/order.entity';
import { Trip } from './entities/trip.entity';
import { TripOrder } from './entities/trip-order.entity';
import { GpsLocation } from './entities/gps-location.entity';
import { Alert } from './entities/alert.entity';
import { DriverKpi } from './entities/driver-kpi.entity';
import { AuthModule } from './auth/auth.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { DriversModule } from './drivers/drivers.module';
import { OrdersModule } from './orders/orders.module';
import { UploadModule } from './upload/upload.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { TripsModule } from './trips/trips.module';

@Module({
  imports: [
    // Environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
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
        ],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        ssl: {
          rejectUnauthorized: false,
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
