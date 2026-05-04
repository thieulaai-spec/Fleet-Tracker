import { Module } from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { DispatchController } from './dispatch.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Trip } from '../entities/trip.entity';
import { TripOrder } from '../entities/trip-order.entity';
import { OrdersModule } from '../orders/orders.module';
import { VehiclesModule } from '../vehicles/vehicles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Vehicle, Trip, TripOrder]),
    OrdersModule,
    VehiclesModule,
  ],
  controllers: [DispatchController],
  providers: [DispatchService],
})
export class DispatchModule {}
