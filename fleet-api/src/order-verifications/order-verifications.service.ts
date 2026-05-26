import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { OrderVerification, VerificationStep } from '../entities/order-verification.entity';
import { Order, OrderStatus } from '../entities/order.entity';
import { TripOrder } from '../entities/trip-order.entity';
import { Trip } from '../entities/trip.entity';
import { CreateVerificationDto } from './dto/create-verification.dto';

@Injectable()
export class OrderVerificationsService {
  constructor(
    @InjectRepository(OrderVerification)
    private readonly verificationRepository: Repository<OrderVerification>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  async create(orderId: string, dto: CreateVerificationDto): Promise<OrderVerification> {
    const { step, fingerprintStatus, facePhotoUrl, cargoPhotoUrl, latitude, longitude } = dto;

    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, { where: { id: orderId } });
      if (!order) {
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }

      // Validate state transitions
      let nextStatus: OrderStatus | null = null;
      if (step === VerificationStep.ACCEPT) {
        if (order.status !== OrderStatus.PENDING) {
          throw new BadRequestException(`Cannot accept order with status ${order.status}`);
        }
        nextStatus = OrderStatus.ASSIGNED;
      } else if (step === VerificationStep.PICKUP) {
        if (order.status !== OrderStatus.ASSIGNED) {
          throw new BadRequestException(`Cannot pickup order with status ${order.status}`);
        }
        nextStatus = OrderStatus.PICKED_UP;
      } else if (step === VerificationStep.CHECKPOINT) {
        if (order.status !== OrderStatus.PICKED_UP && order.status !== OrderStatus.DELIVERING) {
          throw new BadRequestException(`Cannot record checkpoint for order with status ${order.status}`);
        }
        nextStatus = OrderStatus.DELIVERING;
      } else if (step === VerificationStep.DELIVERY) {
        if (order.status !== OrderStatus.PICKED_UP && order.status !== OrderStatus.DELIVERING) {
          throw new BadRequestException(`Cannot deliver order with status ${order.status}`);
        }
        nextStatus = OrderStatus.DELIVERED;
      }

      const hasCoordinates = 
        latitude !== undefined && latitude !== null &&
        longitude !== undefined && longitude !== null;

      const verification = manager.create(OrderVerification, {
        orderId,
        step,
        fingerprintStatus,
        facePhotoUrl,
        cargoPhotoUrl,
        location: hasCoordinates
          ? {
              type: 'Point',
              coordinates: [longitude, latitude],
            }
          : null,
      });

      const savedVerification = await manager.save(OrderVerification, verification);

      // Update corresponding order status and actual coordinates
      const locationObj = hasCoordinates
        ? { type: 'Point', coordinates: [longitude, latitude] }
        : null;

      if (step === VerificationStep.PICKUP) {
        if (cargoPhotoUrl) {
          order.photoUrl = cargoPhotoUrl;
        }
        if (locationObj) {
          order.pickupActualLocation = locationObj;
        }
      } else if (step === VerificationStep.DELIVERY) {
        if (cargoPhotoUrl) {
          order.photoUrl = cargoPhotoUrl;
        }
        if (locationObj) {
          order.deliveryActualLocation = locationObj;
        }
      }

      if (nextStatus) {
        order.status = nextStatus;
      }
      await manager.save(Order, order);

      return savedVerification;
    });
  }

  async findByOrder(orderId: string): Promise<OrderVerification[]> {
    return this.verificationRepository.find({
      where: { orderId },
      order: { createdAt: 'ASC' },
    });
  }

  async findByTrip(tripId: string): Promise<OrderVerification[]> {
    // Get all orders in this trip
    const tripOrders = await this.dataSource.getRepository(TripOrder).find({
      where: { tripId },
    });

    if (tripOrders.length === 0) {
      return [];
    }

    const orderIds = tripOrders.map((to) => to.orderId);

    // Find all verifications
    return this.verificationRepository.createQueryBuilder('v')
      .where('v.order_id IN (:...orderIds)', { orderIds })
      .leftJoinAndSelect('v.order', 'order')
      .orderBy('v.created_at', 'ASC')
      .getMany();
  }

  async findByDriver(driverId: string): Promise<OrderVerification[]> {
    // Get all trips for this driver
    const trips = await this.dataSource.getRepository(Trip).find({
      where: { driverId },
    });

    if (trips.length === 0) {
      return [];
    }

    const tripIds = trips.map((t) => t.id);

    // Get all orders for these trips
    const tripOrders = await this.dataSource.getRepository(TripOrder).createQueryBuilder('to')
      .where('to.trip_id IN (:...tripIds)', { tripIds })
      .getMany();

    if (tripOrders.length === 0) {
      return [];
    }

    const orderIds = tripOrders.map((to) => to.orderId);

    // Return verifications
    return this.verificationRepository.createQueryBuilder('v')
      .where('v.order_id IN (:...orderIds)', { orderIds })
      .leftJoinAndSelect('v.order', 'order')
      .orderBy('v.created_at', 'DESC')
      .getMany();
  }
}
