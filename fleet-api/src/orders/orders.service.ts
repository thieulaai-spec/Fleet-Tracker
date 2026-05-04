import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const {
      pickupLat,
      pickupLng,
      deliveryLat,
      deliveryLng,
      ...orderData
    } = createOrderDto;

    const order = this.ordersRepository.create({
      ...orderData,
      pickupLocation: {
        type: 'Point',
        coordinates: [pickupLng, pickupLat],
      },
      deliveryLocation: {
        type: 'Point',
        coordinates: [deliveryLng, deliveryLat],
      },
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

  async findOne(id: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Can only update orders in PENDING status');
    }

    const {
      pickupLat,
      pickupLng,
      deliveryLat,
      deliveryLng,
      ...orderData
    } = updateOrderDto;

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

    Object.assign(order, orderData);

    return this.ordersRepository.save(order);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);
    
    // Basic validation for status transitions could be added here
    order.status = status;
    return this.ordersRepository.save(order);
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
