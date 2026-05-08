import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GpsLocation } from '../entities/gps-location.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Trip, TripStatus } from '../entities/trip.entity';
import { Driver } from '../entities/driver.entity';
import { GpsUpdateDto } from './dto/gps-update.dto';
import { ViolationDetectorService } from '../alerts/violation-detector.service';

@Injectable()
export class TrackingService implements OnModuleDestroy {
  private readonly logger = new Logger(TrackingService.name);
  private gpsBuffer: GpsLocation[] = [];
  private readonly BATCH_INTERVAL = 5000; // 5 seconds
  private flushInterval: NodeJS.Timeout;
  private isFlushing = false;

  constructor(
    @InjectRepository(GpsLocation)
    private readonly gpsRepository: Repository<GpsLocation>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    private readonly violationDetector: ViolationDetectorService,
  ) {}

  onModuleInit() {
    // Start batch processing
    this.flushInterval = setInterval(
      () => this.flushBuffer(),
      this.BATCH_INTERVAL,
    );
  }

  onModuleDestroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
  }

  private async flushBuffer() {
    if (this.gpsBuffer.length === 0 || this.isFlushing) return;

    this.isFlushing = true;
    const batch = [...this.gpsBuffer];
    // Atomically clear the portion we're about to save
    this.gpsBuffer = this.gpsBuffer.slice(batch.length);

    try {
      await this.gpsRepository.save(batch);
      this.logger.debug(`Flushed ${batch.length} GPS points to DB`);
    } catch (error) {
      this.logger.error(`Failed to flush GPS buffer: ${error.message}`);
      // Put back items if failed to save (at the beginning of the buffer)
      this.gpsBuffer = [...batch, ...this.gpsBuffer];

      // Limit buffer size to prevent memory leaks if DB is down for long
      if (this.gpsBuffer.length > 5000) {
        this.logger.warn('GPS Buffer too large, dropping oldest points');
        this.gpsBuffer = this.gpsBuffer.slice(-5000);
      }
    } finally {
      this.isFlushing = false;
    }
  }

  async processGpsUpdate(data: GpsUpdateDto) {
    const {
      vehicleId,
      tripId,
      latitude,
      longitude,
      speed,
      heading,
      timestamp,
    } = data;

    // 1. Create PostGIS Point
    const point = {
      type: 'Point',
      coordinates: [longitude, latitude],
    };

    // 2. Add to buffer for batch insert
    const gpsLocation = this.gpsRepository.create({
      vehicleId,
      tripId,
      location: point,
      speedKmh: speed,
      heading,
      recordedAt: new Date(timestamp),
    });
    this.gpsBuffer.push(gpsLocation);

    // 3. Update Vehicle's last known location (using Parameterized Query to prevent SQL Injection)
    await this.vehicleRepository
      .createQueryBuilder()
      .update(Vehicle)
      .set({
        lastKnownLocation: () =>
          `ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)`,
      })
      .where('id = :vehicleId', { vehicleId })
      .setParameters({ lng: longitude, lat: latitude })
      .execute();

    // 4. Trigger Violation Detection (Async)
    if (tripId) {
      this.violationDetector
        .checkViolations(data)
        .catch((err) =>
          this.logger.error(`Violation check failed: ${err.message}`),
        );
    }

    // 5. Return processed data for broadcasting
    return {
      vehicleId,
      tripId,
      latitude,
      longitude,
      speed,
      heading,
      timestamp,
    };
  }

  async getVehicleHistory(vehicleId: string, from?: Date, to?: Date) {
    const query = this.gpsRepository
      .createQueryBuilder('gps')
      .where('gps.vehicleId = :vehicleId', { vehicleId });

    if (from) {
      query.andWhere('gps.recordedAt >= :from', { from });
    }
    if (to) {
      query.andWhere('gps.recordedAt <= :to', { to });
    }

    return query.orderBy('gps.recordedAt', 'ASC').getMany();
  }

  async getAllLiveLocations() {
    return this.vehicleRepository.find({
      select: ['id', 'plateNumber', 'type', 'status', 'lastKnownLocation'],
    });
  }

  async getDriverByUserId(userId: string): Promise<Driver | null> {
    return this.driverRepository.findOne({ where: { userId } });
  }

  async getTripById(tripId: string): Promise<Trip | null> {
    return this.tripRepository.findOne({ where: { id: tripId } });
  }

  async validateDriverTrip(driverId: string, tripId: string, vehicleId: string): Promise<boolean> {
    const trip = await this.tripRepository.findOne({ 
      where: { 
        id: tripId, 
        driverId,
        vehicleId,
        status: TripStatus.IN_PROGRESS 
      } 
    });

    return !!trip;
  }
}
