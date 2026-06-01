import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip } from '../entities/trip.entity';
import { GpsUpdateDto } from '../tracking/dto/gps-update.dto';
import { Alert, AlertSeverity, AlertType } from '../entities/alert.entity';
import { AlertsService } from './alerts.service';
import { OnEvent } from '@nestjs/event-emitter';
import { TripStatus } from '../entities/trip.entity';

@Injectable()
export class ViolationDetectorService implements OnModuleInit {
  private readonly logger = new Logger(ViolationDetectorService.name);
  private readonly MAX_SPEED = 80; // km/h
  private readonly IDLE_THRESHOLD = 10 * 60 * 1000; // 10 minutes in ms
  private readonly ROUTE_DEVIATION_THRESHOLD = 500; // meters
  private readonly ALERT_COOLDOWN = 5 * 60 * 1000; // 5 minutes

  private stopStartTimeMap = new Map<string, number>(); // vehicleId -> timestamp
  private routeCache = new Map<string, any>(); // tripId -> plannedRoute
  private lastAlertMap = new Map<string, number>(); // tripId:type -> timestamp

  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    private readonly alertsService: AlertsService,
  ) {}

  async checkViolations(gpsData: GpsUpdateDto) {
    const { speed, tripId, vehicleId, latitude, longitude } = gpsData;

    // 1. Abnormal Stop Check (speed < 1.0 km/h to tolerate GPS drift/jitter)
    if (speed < 1.0) {
      if (!this.stopStartTimeMap.has(vehicleId)) {
        this.stopStartTimeMap.set(vehicleId, Date.now());
      } else {
        const stopDuration =
          Date.now() - (this.stopStartTimeMap.get(vehicleId) || Date.now());
        if (stopDuration > this.IDLE_THRESHOLD) {
          const alertKey = `${tripId || vehicleId}:${AlertType.ABNORMAL_STOP}`;
          if (this.shouldAlert(alertKey)) {
            await this.alertsService.createAlert({
              tripId,
              vehicleId,
              type: AlertType.ABNORMAL_STOP,
              severity: AlertSeverity.LOW,
              message: `Xe dừng bất thường hơn 10 phút`,
              location: { type: 'Point', coordinates: [longitude, latitude] },
            });
            this.lastAlertMap.set(alertKey, Date.now());
          }
        }
      }
    } else {
      this.stopStartTimeMap.delete(vehicleId);
    }

    // 2. Speed Violation Check
    if (speed > this.MAX_SPEED) {
      const alertKey = `${tripId || vehicleId}:${AlertType.SPEED_VIOLATION}`;
      if (this.shouldAlert(alertKey)) {
        await this.alertsService.createAlert({
          tripId,
          vehicleId,
          type: AlertType.SPEED_VIOLATION,
          severity: AlertSeverity.MEDIUM,
          message: `Vượt quá tốc độ cho phép: ${speed.toFixed(1)} km/h (Giới hạn: ${this.MAX_SPEED} km/h)`,
          location: { type: 'Point', coordinates: [longitude, latitude] },
        });
        this.lastAlertMap.set(alertKey, Date.now());
      }
    }

    // 3. Route Deviation Check
    if (tripId) {
      let plannedRoute = this.routeCache.get(tripId);
      if (plannedRoute === undefined) {
        const trip = await this.tripRepository.findOne({
          where: { id: tripId },
          select: ['id', 'plannedRoute'],
        });
        plannedRoute = trip?.plannedRoute || null;
        this.routeCache.set(tripId, plannedRoute);
      }

      if (plannedRoute) {
        const distance = await this.calculateDistanceFromRoute(
          latitude,
          longitude,
          tripId,
        );
        if (distance > this.ROUTE_DEVIATION_THRESHOLD) {
          const alertKey = `${tripId}:${AlertType.ROUTE_DEVIATION}`;
          if (this.shouldAlert(alertKey)) {
            await this.alertsService.createAlert({
              tripId,
              vehicleId,
              type: AlertType.ROUTE_DEVIATION,
              severity: AlertSeverity.HIGH,
              message: `Xe đi sai lộ trình: Cách tuyến đường chính ${distance.toFixed(0)}m`,
              location: { type: 'Point', coordinates: [longitude, latitude] },
            });
            this.lastAlertMap.set(alertKey, Date.now());
          }
        }
      }
    }
  }

  @OnEvent('trip.status_changed')
  handleTripStatusChanged(payload: { id: string; status: string }) {
    if (
      payload.status === TripStatus.COMPLETED ||
      payload.status === TripStatus.CANCELLED
    ) {
      this.routeCache.delete(payload.id);

      // Clear lastAlertMap entries for this trip
      for (const key of this.lastAlertMap.keys()) {
        if (key.startsWith(payload.id)) {
          this.lastAlertMap.delete(key);
        }
      }
      this.logger.debug(`Cleared cache for trip ${payload.id}`);
    }
  }

  // Periodic cleanup for stale entries (every hour)
  onModuleInit() {
    setInterval(() => this.cleanupStaleEntries(), 60 * 60 * 1000);
  }

  private cleanupStaleEntries() {
    const now = Date.now();
    const STALE_THRESHOLD = 12 * 60 * 60 * 1000; // Reduced to 12 hours for better memory management

    // Cleanup lastAlertMap
    let alertCleanupCount = 0;
    for (const [key, timestamp] of this.lastAlertMap.entries()) {
      if (now - timestamp > STALE_THRESHOLD) {
        this.lastAlertMap.delete(key);
        alertCleanupCount++;
      }
    }

    // Cleanup stopStartTimeMap
    let stopCleanupCount = 0;
    for (const [key, timestamp] of this.stopStartTimeMap.entries()) {
      if (now - timestamp > STALE_THRESHOLD) {
        this.stopStartTimeMap.delete(key);
        stopCleanupCount++;
      }
    }

    if (alertCleanupCount > 0 || stopCleanupCount > 0) {
      this.logger.log(
        `Cleaned up ${alertCleanupCount} stale alerts and ${stopCleanupCount} stale stop entries`,
      );
    }
  }

  private shouldAlert(key: string): boolean {
    const lastAlert = this.lastAlertMap.get(key);
    return !lastAlert || Date.now() - lastAlert > this.ALERT_COOLDOWN;
  }

  private async calculateDistanceFromRoute(
    lat: number,
    lng: number,
    tripId: string,
  ): Promise<number> {
    const result = await this.tripRepository.query(
      `SELECT ST_Distance(
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        planned_route::geography
      ) as distance
      FROM trips WHERE id = $3`,
      [lng, lat, tripId],
    );
    return result[0]?.distance || 0;
  }
}
