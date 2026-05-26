import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderVerification } from '../entities/order-verification.entity';
import { Order } from '../entities/order.entity';
import { OrderVerificationsService } from './order-verifications.service';
import { OrderVerificationsController } from './order-verifications.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderVerification, Order]),
  ],
  controllers: [OrderVerificationsController],
  providers: [OrderVerificationsService],
  exports: [OrderVerificationsService],
})
export class OrderVerificationsModule {}
