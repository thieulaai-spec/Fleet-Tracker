import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from '../entities/trip.entity';
import { Order } from '../entities/order.entity';
import { RouteService } from './route.service';
import { OptimizationService } from './optimization.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trip, Order]),
    ConfigModule,
  ],
  providers: [RouteService, OptimizationService],
  exports: [RouteService, OptimizationService],
})
export class OptimizationModule {}
