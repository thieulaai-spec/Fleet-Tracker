import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Order, OrderStatus } from '../entities/order.entity';
import { TripOrder } from '../entities/trip-order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderQueryDto } from './dto/order-query.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const {
      pickupLat,
      pickupLng,
      deliveryLat,
      deliveryLng,
      pickupAddress,
      deliveryAddress,
      ...orderData
    } = createOrderDto;

    if (pickupAddress === deliveryAddress) {
      throw new BadRequestException(
        'Pickup address and delivery address cannot be the same',
      );
    }

    const order = this.ordersRepository.create({
      ...orderData,
      pickupAddress,
      deliveryAddress,
      pickupLocation: {
        type: 'Point',
        coordinates: [pickupLng, pickupLat],
      },
      deliveryLocation: {
        type: 'Point',
        coordinates: [deliveryLng, deliveryLat],
      },
      deliveryDeadline: createOrderDto.deliveryDeadline ? new Date(createOrderDto.deliveryDeadline) : undefined,
    });

    return this.ordersRepository.save(order);
  }

  async findAll(queryDto: OrderQueryDto) {
    const { page = 1, limit = 10, status, search } = queryDto;
    const query = this.ordersRepository
      .createQueryBuilder('order')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      query.andWhere('order.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        '(order.pickupAddress ILIKE :search OR order.deliveryAddress ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    query.orderBy('order.createdAt', 'DESC');

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<any> {
    const order = await this.ordersRepository.findOne({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Find associated trip details for driver name/phone and vehicle license plate
    const tripOrder = await this.dataSource.getRepository(TripOrder).findOne({
      where: { orderId: id },
      relations: ['trip', 'trip.driver', 'trip.driver.user', 'trip.vehicle'],
    });

    if (tripOrder && tripOrder.trip) {
      return {
        ...order,
        assignedTrip: {
          id: tripOrder.trip.id,
          status: tripOrder.trip.status,
          driver: tripOrder.trip.driver ? {
            id: tripOrder.trip.driver.id,
            fullName: tripOrder.trip.driver.user?.fullName || null,
            phone: tripOrder.trip.driver.user?.phone || null,
          } : null,
          vehicle: tripOrder.trip.vehicle ? {
            id: tripOrder.trip.vehicle.id,
            plateNumber: tripOrder.trip.vehicle.plateNumber || null,
          } : null,
        },
      };
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Can only update orders in PENDING status');
    }

    const { pickupLat, pickupLng, deliveryLat, deliveryLng, deliveryDeadline, ...orderData } =
      updateOrderDto;

    if (pickupLat !== undefined && pickupLng !== undefined) {
      order.pickupLocation = {
        type: 'Point',
        coordinates: [pickupLng, pickupLat],
      };
    }

    if (deliveryLat !== undefined && deliveryLng !== undefined) {
      order.deliveryLocation = {
        type: 'Point',
        coordinates: [deliveryLng, deliveryLat],
      };
    }

    if (deliveryDeadline !== undefined) {
      order.deliveryDeadline = deliveryDeadline ? new Date(deliveryDeadline) : null;
    }

    Object.assign(order, orderData);

    return this.ordersRepository.save(order);
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const { status, photoUrl, signatureUrl } = updateStatusDto;
    const order = await this.findOne(id);

    // Status transition validation
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
      [OrderStatus.ASSIGNED]: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
      [OrderStatus.PICKED_UP]: [OrderStatus.DELIVERING],
      [OrderStatus.DELIVERING]: [OrderStatus.DELIVERED, OrderStatus.FAILED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.FAILED]: [OrderStatus.PENDING], // Allow retry
      [OrderStatus.CANCELLED]: [OrderStatus.PENDING], // Allow reactivation
    };

    if (!allowedTransitions[order.status].includes(status)) {
      throw new BadRequestException(
        `Invalid status transition from ${order.status} to ${status}`,
      );
    }

    order.status = status;
    if (photoUrl) order.photoUrl = photoUrl;
    if (signatureUrl) order.signatureUrl = signatureUrl;

    if (updateStatusDto.actionLat && updateStatusDto.actionLng) {
      const location = {
        type: 'Point',
        coordinates: [updateStatusDto.actionLng, updateStatusDto.actionLat],
      };

      if (status === OrderStatus.PICKED_UP) {
        order.pickupActualLocation = location;
      } else if (status === OrderStatus.DELIVERED) {
        order.deliveryActualLocation = location;
      }
    }

    const savedOrder = await this.ordersRepository.save(order);
    this.eventEmitter.emit('order.status_changed', {
      id: savedOrder.id,
      status: savedOrder.status,
    });
    return savedOrder;
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Can only delete orders in PENDING status');
    }

    await this.ordersRepository.remove(order);
  }

  async findPending() {
    return this.ordersRepository.find({
      where: { status: OrderStatus.PENDING },
      order: { createdAt: 'ASC' },
    });
  }
}
