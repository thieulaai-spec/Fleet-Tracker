import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverKpi } from '../entities/driver-kpi.entity';
import { Trip, TripStatus } from '../entities/trip.entity';
import { OnEvent } from '@nestjs/event-emitter';

export const KPI_PENALTIES = {
  speed_violation: 5,
  route_deviation: 8,
  abnormal_stop: 3,
  incident: 10,
};

@Injectable()
export class KpiService {
  private readonly logger = new Logger(KpiService.name);

  constructor(
    @InjectRepository(DriverKpi)
    private kpiRepository: Repository<DriverKpi>,
    @InjectRepository(Trip)
    private tripRepository: Repository<Trip>,
  ) {}

  async getOrCreateKpi(driverId: string): Promise<DriverKpi> {
    let kpi = await this.kpiRepository.findOne({ where: { driverId } });
    if (!kpi) {
      kpi = this.kpiRepository.create({
        driverId,
        totalTrips: 0,
        completedTrips: 0,
        completionRate: 0,
        totalViolations: 0,
        speedViolations: 0,
        routeViolations: 0,
        kpiScore: 100,
      });
      await this.kpiRepository.save(kpi);
    }
    return kpi;
  }

  @OnEvent('trip.status_changed')
  async handleTripStatusChange(payload: { tripId: string; status: TripStatus }) {
    const trip = await this.tripRepository.findOne({
      where: { id: payload.tripId },
      relations: ['driver'],
    });

    if (!trip || !trip.driver) return;

    const kpi = await this.getOrCreateKpi(trip.driver.id);

    if (payload.status === TripStatus.ACCEPTED || payload.status === TripStatus.IN_PROGRESS) {
        // We might want to increment total trips only once
        // For simplicity, let's check if it's already counted or count on creation
    }

    if (payload.status === TripStatus.COMPLETED) {
      kpi.completedTrips += 1;
      // Recalculate total trips if needed or keep tracked
      // completion_rate = completed_trips / total_trips * 100
      this.updateCompletionRate(kpi);
      await this.kpiRepository.save(kpi);
    }
  }

  @OnEvent('alert.new')
  async handleViolation(alert: any) {
    if (!alert.driverId) return;

    const kpi = await this.getOrCreateKpi(alert.driverId);
    const penalty = KPI_PENALTIES[alert.type] || 0;

    kpi.totalViolations += 1;
    if (alert.type === 'speed_violation') kpi.speedViolations += 1;
    if (alert.type === 'route_deviation') kpi.routeViolations += 1;

    // TypeORM decimal comes back as string, need to convert
    kpi.kpiScore = Math.max(0, Number(kpi.kpiScore) - penalty);
    await this.kpiRepository.save(kpi);
  }

  private updateCompletionRate(kpi: DriverKpi) {
    if (kpi.totalTrips > 0) {
      kpi.completionRate = (kpi.completedTrips / kpi.totalTrips) * 100;
    } else {
      kpi.completionRate = 0;
    }
  }

  async getDriverKpiSummary(driverId: string) {
    return this.getOrCreateKpi(driverId);
  }

  async getKpiLeaderboard() {
    return this.kpiRepository.find({
      relations: ['driver'],
      order: { kpiScore: 'DESC' },
      take: 10,
    });
  }

  // Helper to sync total trips if they get out of sync
  async syncTotalTrips(driverId: string) {
    const total = await this.tripRepository.count({ where: { driverId } });
    const kpi = await this.getOrCreateKpi(driverId);
    kpi.totalTrips = total;
    this.updateCompletionRate(kpi);
    await this.kpiRepository.save(kpi);
  }
}
