import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DataSource } from 'typeorm';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Alert, AlertType, AlertSeverity } from '../entities/alert.entity';
import { Trip } from '../entities/trip.entity';
import { Order, OrderStatus } from '../entities/order.entity';
import { TripOrder } from '../entities/trip-order.entity';
import { CreateAlertDto } from './dto/create-alert.dto';
import { AlertQueryDto } from './dto/alert-query.dto';

@Injectable()
export class AlertsService implements OnModuleInit {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
  ) {}

  onModuleInit() {
    // Check every 60 seconds
    setInterval(() => {
      this.checkOverdueOrders().catch((err) => {
        this.logger.error('Error checking overdue orders:', err);
      });
    }, 60000);
  }

  async checkOverdueOrders() {
    let retries = 3;
    let delay = 1000;
    while (retries > 0) {
      try {
        await this.runCheckOverdueOrders();
        break;
      } catch (error) {
        retries--;
        const errMsg = error instanceof Error ? error.message : String(error);
        const errObj = error as { code?: unknown };
        const errCode =
          errObj && typeof errObj === 'object' && 'code' in errObj
            ? String(errObj.code)
            : '';
        const isConnectionError =
          errMsg.includes('terminating connection') ||
          errCode === '57P01' ||
          errMsg.includes('connection');

        if (isConnectionError && retries > 0) {
          this.logger.warn(
            `Database connection error during overdue check, retrying in ${delay}ms... (${retries} retries left): ${errMsg}`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
        } else {
          throw error;
        }
      }
    }
  }

  private async runCheckOverdueOrders() {
    const now = new Date();
    const ordersRepository = this.dataSource.getRepository(Order);
    const tripOrderRepository = this.dataSource.getRepository(TripOrder);

    // Find orders that are past deadline and not delivered/cancelled/failed
    const overdueOrders = await ordersRepository
      .createQueryBuilder('order')
      .where('order.delivery_deadline IS NOT NULL')
      .andWhere('order.delivery_deadline < :now', { now })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [
          OrderStatus.ASSIGNED,
          OrderStatus.PICKED_UP,
          OrderStatus.DELIVERING,
        ],
      })
      .getMany();

    for (const order of overdueOrders) {
      // Check if alert already exists for this order
      const existingAlert = await this.alertRepository.findOne({
        where: {
          type: AlertType.DELIVERY_OVERDUE,
          message: Like(`%#${order.id.substring(0, 8).toUpperCase()}%`),
        },
      });

      if (!existingAlert) {
        // Find vehicle and driver via TripOrder
        const tripOrder = await tripOrderRepository.findOne({
          where: { orderId: order.id },
          relations: ['trip', 'trip.vehicle', 'trip.driver'],
        });

        if (tripOrder && tripOrder.trip && tripOrder.trip.vehicle) {
          const vehicle = tripOrder.trip.vehicle;
          const driver = tripOrder.trip.driver;

          const alert = this.alertRepository.create({
            tripId: tripOrder.trip.id,
            vehicleId: vehicle.id,
            driverId: driver ? driver.id : null,
            type: AlertType.DELIVERY_OVERDUE,
            severity: AlertSeverity.HIGH,
            message: `Đơn hàng #${order.id.substring(0, 8).toUpperCase()} quá hạn giao hàng! Hạn cuối: ${new Date(order.deliveryDeadline).toLocaleTimeString('vi-VN')} ${new Date(order.deliveryDeadline).toLocaleDateString('vi-VN')}`,
            isResolved: false,
          });

          const savedAlert = await this.alertRepository.save(alert);
          this.eventEmitter.emit('alert.new', savedAlert);
          this.logger.log(`Created overdue alert for order ${order.id}`);
        }
      }
    }
  }

  async createAlert(data: CreateAlertDto) {
    const { tripId, vehicleId, type, severity, message, location } = data;

    let driverId: string | undefined = undefined;

    if (tripId) {
      const trip = await this.tripRepository.findOne({ where: { id: tripId } });
      driverId = trip?.driverId || undefined;
    }

    const alert = this.alertRepository.create({
      tripId,
      vehicleId,
      driverId,
      type,
      severity,
      message,
      location,
      isResolved: false,
    });

    const savedAlert = await this.alertRepository.save(alert);

    // Emit event for real-time notification
    this.eventEmitter.emit('alert.new', savedAlert);

    this.logger.log(`New alert created: ${type} - ${message}`);
    return savedAlert;
  }

  async resolveAlert(id: string) {
    const alert = await this.alertRepository.findOne({ where: { id } });
    if (!alert) {
      this.logger.warn(`Attempted to resolve non-existent alert: ${id}`);
      return null;
    }

    await this.alertRepository.update(id, {
      isResolved: true,
      resolvedAt: new Date(),
    });

    const resolvedAlert = await this.alertRepository.findOne({ where: { id } });

    // Emit resolved event
    this.eventEmitter.emit('alert.resolved', resolvedAlert);

    return resolvedAlert;
  }

  async getActiveAlerts() {
    return this.alertRepository.find({
      where: { isResolved: false },
      order: { createdAt: 'DESC' },
      relations: ['vehicle', 'driver', 'trip'],
    });
  }

  async getAlertStats() {
    return this.alertRepository
      .createQueryBuilder('alert')
      .select('alert.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('alert.type')
      .getRawMany();
  }

  async findAll(query: AlertQueryDto) {
    const { driverId, vehicleId, isResolved, activeOnly, type, severity } =
      query;

    const where: any = {};

    if (driverId) where.driverId = driverId;
    if (vehicleId) where.vehicleId = vehicleId;

    if (activeOnly !== undefined) {
      where.isResolved = !activeOnly;
    } else if (isResolved !== undefined) {
      where.isResolved = isResolved;
    }

    if (type) where.type = type;
    if (severity) where.severity = severity;

    return this.alertRepository.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['vehicle', 'driver', 'trip'],
    });
  }

  @OnEvent('order.status_changed')
  async handleOrderStatusChanged(payload: { id: string; status: OrderStatus }) {
    if (
      payload.status === OrderStatus.DELIVERED ||
      payload.status === OrderStatus.CANCELLED ||
      payload.status === OrderStatus.FAILED
    ) {
      const orderShortId = payload.id.substring(0, 8).toUpperCase();
      const existingAlert = await this.alertRepository.findOne({
        where: {
          type: AlertType.DELIVERY_OVERDUE,
          isResolved: false,
          message: Like(`%#${orderShortId}%`),
        },
      });

      if (existingAlert) {
        await this.resolveAlert(existingAlert.id);
        this.logger.log(
          `Auto-resolved overdue alert for order ${payload.id} (Status: ${payload.status})`,
        );
      }
    }
  }
}
