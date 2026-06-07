import { Module } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from '../entities/trip.entity';
import { TripOrder } from '../entities/trip-order.entity';
import { Order } from '../entities/order.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Driver } from '../entities/driver.entity';
import { Alert } from '../entities/alert.entity';

import { OptimizationModule } from '../optimization/optimization.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trip, TripOrder, Order, Vehicle, Driver, Alert]),
    OptimizationModule,
  ],
  controllers: [TripsController],
  providers: [TripsService],
})
export class TripsModule {}
