import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from '../entities/trip.entity';
import { Order } from '../entities/order.entity';
import { RouteService } from './route.service';
import { OptimizationService } from './optimization.service';
import { ConfigModule } from '@nestjs/config';

import { OptimizationController } from './optimization.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, Order]), ConfigModule],
  controllers: [OptimizationController],
  providers: [RouteService, OptimizationService],
  exports: [RouteService, OptimizationService],
})
export class OptimizationModule {}
