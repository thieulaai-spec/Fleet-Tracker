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

    if (step !== VerificationStep.ACCEPT && !cargoPhotoUrl) {
      throw new BadRequestException(`Cargo photo is required for step ${step}`);
    }

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

  async updateCargoPhoto(orderId: string, step: VerificationStep, cargoPhotoUrl: string): Promise<OrderVerification> {
    const verification = await this.verificationRepository.findOne({
      where: { orderId, step },
      order: { createdAt: 'DESC' },
    });

    if (!verification) {
      throw new NotFoundException(`Verification for order ${orderId} at step ${step} not found`);
    }

    verification.cargoPhotoUrl = cargoPhotoUrl;
    
    // Also update order photoUrl
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (order) {
      order.photoUrl = cargoPhotoUrl;
      await this.orderRepository.save(order);
    }

    return this.verificationRepository.save(verification);
  }

  async findByOrder(orderId: string): Promise<OrderVerification[]> {
    return this.verificationRepository.find({
      where: { orderId },
      order: { createdAt: 'ASC' },
    });
  }

  async findByTrip(tripId: string): Promise<OrderVerification[]> {
    // Get all orders in this trip with trip and vehicle info
    const tripOrders = await this.dataSource.getRepository(TripOrder).find({
      where: { tripId },
      relations: ['trip', 'trip.vehicle'],
    });

    if (tripOrders.length === 0) {
      return [];
    }

    const orderIds = tripOrders.map((to) => to.orderId);

    // Find all verifications
    const verifications = await this.verificationRepository.createQueryBuilder('v')
      .where('v.order_id IN (:...orderIds)', { orderIds })
      .leftJoinAndSelect('v.order', 'order')
      .orderBy('v.created_at', 'ASC')
      .getMany();

    // Attach plateNumber
    const orderIdToPlateNumber: Record<string, string> = {};
    for (const to of tripOrders) {
      if (to.trip && to.trip.vehicle) {
        orderIdToPlateNumber[to.orderId] = to.trip.vehicle.plateNumber;
      }
    }

    for (const v of verifications) {
      if (v.order) {
        (v.order as any).plateNumber = orderIdToPlateNumber[v.orderId] || 'N/A';
      }
    }

    return verifications;
  }

  async findByDriver(driverId: string): Promise<OrderVerification[]> {
    // Get all trips for this driver with vehicle loaded
    const trips = await this.dataSource.getRepository(Trip).find({
      where: { driverId },
      relations: ['vehicle'],
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
    const verifications = await this.verificationRepository.createQueryBuilder('v')
      .where('v.order_id IN (:...orderIds)', { orderIds })
      .leftJoinAndSelect('v.order', 'order')
      .orderBy('v.created_at', 'DESC')
      .getMany();

    // Map plate number to each verification's order
    const orderIdToPlateNumber: Record<string, string> = {};
    for (const to of tripOrders) {
      const trip = trips.find((t) => t.id === to.tripId);
      if (trip && trip.vehicle) {
        orderIdToPlateNumber[to.orderId] = trip.vehicle.plateNumber;
      }
    }

    for (const v of verifications) {
      if (v.order) {
        (v.order as any).plateNumber = orderIdToPlateNumber[v.orderId] || 'N/A';
      }
    }

    return verifications;
  }
}
