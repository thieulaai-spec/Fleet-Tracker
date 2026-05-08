import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Alert, AlertType, AlertSeverity } from '../entities/alert.entity';
import { Trip } from '../entities/trip.entity';
import { CreateAlertDto } from './dto/create-alert.dto';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createAlert(data: CreateAlertDto) {
    const { tripId, vehicleId, type, severity, message, location } = data;

    let driverId: string | undefined = undefined;

    if (tripId) {
      const trip = await this.tripRepository.findOne({ where: { id: tripId } });
      driverId = trip ? trip.driverId : undefined;
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
}
