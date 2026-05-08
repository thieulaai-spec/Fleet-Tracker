import { Injectable } from '@nestjs/common';
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
      try {
        await this.kpiRepository.save(kpi);
      } catch (e) {
        const kpi = await this.kpiRepository.findOne({ where: { driverId } });
        if (!kpi) throw new Error('Failed to create or retrieve KPI record');
        return kpi;
      }
    }
    return kpi;
  }

  @OnEvent('trip.status_changed')
  async handleTripStatusChange(payload: { id: string; status: TripStatus }) {
    const trip = await this.tripRepository.findOne({
      where: { id: payload.id },
      relations: ['driver'],
    });

    if (!trip || !trip.driverId) return;

    // Ensure KPI record exists
    await this.getOrCreateKpi(trip.driverId);

    if (payload.status === TripStatus.ACCEPTED) {
      await this.kpiRepository.increment({ driverId: trip.driverId }, 'totalTrips', 1);
      await this.syncCompletionRate(trip.driverId);
    }

    if (payload.status === TripStatus.COMPLETED) {
      await this.kpiRepository.increment({ driverId: trip.driverId }, 'completedTrips', 1);
      await this.syncCompletionRate(trip.driverId);
    }
  }

  @OnEvent('alert.new')
  async handleViolation(alert: any) {
    if (!alert.driverId) return;

    // Ensure KPI record exists
    await this.getOrCreateKpi(alert.driverId);
    const penalty = KPI_PENALTIES[alert.type] || 0;

    const updateObj: any = {
      totalViolations: () => 'total_violations + 1',
      kpiScore: () => `GREATEST(0, kpi_score - ${penalty})`,
    };

    if (alert.type === 'speed_violation') {
      updateObj.speedViolations = () => 'speed_violations + 1';
    }
    if (alert.type === 'route_deviation') {
      updateObj.routeViolations = () => 'route_violations + 1';
    }

    await this.kpiRepository.update({ driverId: alert.driverId }, updateObj);
  }

  private async syncCompletionRate(driverId: string) {
    await this.kpiRepository.update(
      { driverId },
      { 
        completionRate: () => 'CASE WHEN total_trips > 0 THEN (CAST(completed_trips AS FLOAT) / total_trips) * 100 ELSE 0 END' 
      }
    );
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
    const completed = await this.tripRepository.count({ 
      where: { driverId, status: TripStatus.COMPLETED } 
    });
    
    await this.getOrCreateKpi(driverId);
    await this.kpiRepository.update({ driverId }, { 
      totalTrips: total,
      completedTrips: completed
    });
    await this.syncCompletionRate(driverId);
  }
}
