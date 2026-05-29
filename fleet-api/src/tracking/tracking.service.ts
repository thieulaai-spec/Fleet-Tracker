import { Injectable, Logger, OnModuleDestroy, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { GpsLocation } from '../entities/gps-location.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Trip, TripStatus } from '../entities/trip.entity';
import { Driver } from '../entities/driver.entity';
import { GpsUpdateDto } from './dto/gps-update.dto';
import { DeviceGpsUpdateDto } from './dto/device-gps-update.dto';
import { VerifyHardwareDto } from './dto/verify-hardware.dto';
import { ViolationDetectorService } from '../alerts/violation-detector.service';
import { UploadService } from '../upload/upload.service';
import { OrderVerificationsService } from '../order-verifications/order-verifications.service';
import { TripOrder } from '../entities/trip-order.entity';
import { OrderVerification, VerificationStep } from '../entities/order-verification.entity';
import { Order, OrderStatus } from '../entities/order.entity';

@Injectable()
export class TrackingService implements OnModuleDestroy {
  private readonly logger = new Logger(TrackingService.name);
  private gpsBuffer: GpsLocation[] = [];
  private readonly BATCH_INTERVAL = 5000; // 5 seconds
  private flushInterval: NodeJS.Timeout;
  private isFlushing = false;
  private pendingEnrollments = new Map<string, number>();

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
    private readonly uploadService: UploadService,
    private readonly orderVerificationsService: OrderVerificationsService,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
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

    // 3. Update Vehicle's last known location
    await this.vehicleRepository
      .createQueryBuilder()
      .update(Vehicle)
      .set({
        lastKnownLocation: () => `ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)`,
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

    // 5. Fetch vehicle details for broadcasting
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
      relations: ['driver', 'driver.user'],
    });

    return {
      vehicleId,
      tripId,
      latitude,
      longitude,
      speed,
      heading,
      timestamp,
      status: vehicle?.status || 'available',
      licensePlate: vehicle?.plateNumber || `VH-${vehicleId.slice(0, 6)}`,
      driverName: vehicle?.driver?.user?.fullName || 'Unknown Driver',
    };
  }

  async processGpsBatch(data: GpsUpdateDto[]) {
    if (!data || data.length === 0) return [];

    this.logger.log(`Processing batch of ${data.length} GPS points`);

    const results: any[] = [];

    // For batch updates, we process them but maybe skip some heavy logic
    // or optimize the vehicle update to only the latest point.
    const latestPoint = data[data.length - 1];

    for (const pointData of data) {
      const {
        vehicleId,
        tripId,
        latitude,
        longitude,
        speed,
        heading,
        timestamp,
      } = pointData;

      // Add to buffer
      const gpsLocation = this.gpsRepository.create({
        vehicleId,
        tripId,
        location: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        speedKmh: speed,
        heading,
        recordedAt: new Date(timestamp),
      });
      this.gpsBuffer.push(gpsLocation);

      results.push({
        vehicleId,
        tripId,
        latitude,
        longitude,
        speed,
        heading,
        timestamp,
      });
    }

    // Update vehicle to the latest position only
    await this.vehicleRepository
      .createQueryBuilder()
      .update(Vehicle)
      .set({
        lastKnownLocation: () => `ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)`,
      })
      .where('id = :vehicleId', { vehicleId: latestPoint.vehicleId })
      .setParameters({ lng: latestPoint.longitude, lat: latestPoint.latitude })
      .execute();

    return results;
  }

  async processDeviceGpsUpdate(data: DeviceGpsUpdateDto) {
    const { deviceId, latitude, longitude, speed = 0, heading = 0 } = data;

    // 1. Find vehicle by deviceId
    const vehicle = await this.vehicleRepository.findOne({
      where: { deviceId },
      relations: ['driver', 'driver.user'],
    });

    if (!vehicle) {
      throw new Error(`Vehicle with deviceId ${deviceId} not found`);
    }

    // 2. Check for active trip to link history
    const activeTrip = await this.tripRepository.findOne({
      where: { vehicleId: vehicle.id, status: TripStatus.IN_PROGRESS },
    });

    // 3. Create PostGIS Point
    const point = {
      type: 'Point',
      coordinates: [longitude, latitude],
    };

    // 4. Add to buffer for batch insert
    const gpsLocation = this.gpsRepository.create({
      vehicleId: vehicle.id,
      tripId: activeTrip?.id || null,
      location: point,
      speedKmh: speed,
      heading,
      recordedAt: new Date(),
    });
    this.gpsBuffer.push(gpsLocation);

    // 5. Trigger Violation Detection (Async)
    if (activeTrip) {
      this.violationDetector
        .checkViolations({
          vehicleId: vehicle.id,
          tripId: activeTrip.id,
          latitude,
          longitude,
          speed,
          heading,
          timestamp: new Date().toISOString(),
        })
        .catch((err) =>
          this.logger.error(`Violation check failed: ${err.message}`),
        );
    }

    // 5. Update Vehicle's last known location
    await this.vehicleRepository
      .createQueryBuilder()
      .update(Vehicle)
      .set({
        lastKnownLocation: () => `ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)`,
      })
      .where('id = :vehicleId', { vehicleId: vehicle.id })
      .setParameters({ lng: longitude, lat: latitude })
      .execute();

    return {
      vehicleId: vehicle.id,
      tripId: activeTrip?.id || null,
      latitude,
      longitude,
      speed,
      heading,
      timestamp: new Date().toISOString(),
      status: vehicle.status,
      licensePlate: vehicle.plateNumber,
      driverName: vehicle.driver?.user?.fullName || 'Unknown Driver',
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
      relations: ['driver', 'driver.user'],
      select: {
        id: true,
        plateNumber: true,
        type: true,
        status: true,
        lastKnownLocation: true,
        driver: {
          id: true,
          user: {
            fullName: true,
          },
        },
      },
    });
  }

  async getDriverByUserId(userId: string): Promise<Driver | null> {
    return this.driverRepository.findOne({ where: { userId } });
  }

  async getTripById(tripId: string): Promise<Trip | null> {
    return this.tripRepository.findOne({ where: { id: tripId } });
  }

  async validateDriverTrip(
    driverId: string,
    tripId: string,
    vehicleId: string,
  ): Promise<boolean> {
    const trip = await this.tripRepository.findOne({
      where: {
        id: tripId,
        driverId,
        vehicleId,
        status: TripStatus.IN_PROGRESS,
      },
    });

    return !!trip;
  }

  async processHardwareVerification(
    file: Express.Multer.File,
    body: VerifyHardwareDto,
  ) {
    const { deviceId, fingerprintId } = body;

    this.logger.log(
      `Received hardware verification request from device ${deviceId} and fingerprint ${fingerprintId}`,
    );

    // 1. Find vehicle by deviceId
    const vehicle = await this.vehicleRepository.findOne({
      where: { deviceId },
      relations: ['driver', 'driver.user'],
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with deviceId ${deviceId} not found`);
    }

    // 2. Check for active trip (can be accepted or in_progress)
    const activeTrip = await this.tripRepository.findOne({
      where: [
        { vehicleId: vehicle.id, status: TripStatus.IN_PROGRESS },
        { vehicleId: vehicle.id, status: TripStatus.ACCEPTED }
      ],
    });

    if (!activeTrip) {
      throw new BadRequestException(`No active trip in progress or accepted for vehicle ${vehicle.plateNumber}`);
    }

    // 3. Verify Biometrics: Does fingerprintId match driver's registered fingerprintId?
    const driver = vehicle.driver;
    if (!driver) {
      throw new BadRequestException(`No driver assigned to vehicle ${vehicle.plateNumber}`);
    }

    if (driver.fingerprintId !== fingerprintId) {
      throw new UnauthorizedException(
        `Biometric mismatch. Scanned fingerprint ID ${fingerprintId} does not match driver's registered ID.`,
      );
    }

    // 4. Identify the active order & step to verify
    // Query all trip orders for this active trip, sorted by sequence
    const tripOrders = await this.dataSource.getRepository(TripOrder).find({
      where: { tripId: activeTrip.id },
      order: { sequence: 'ASC' },
      relations: ['order'],
    });

    if (tripOrders.length === 0) {
      throw new BadRequestException(`No orders found for active trip ${activeTrip.id}`);
    }

    // Find the first incomplete order and check its verification status
    let activeOrder: Order | null = null;
    let targetStep: VerificationStep | null = null;

    for (const to of tripOrders) {
       const order = to.order;
       if (!order) continue;

       // Query verifications for this order
       const verifications = await this.dataSource.getRepository(OrderVerification).find({
         where: { orderId: order.id },
         order: { createdAt: 'ASC' },
       });

       const hasPickup = verifications.some((v) => v.step === VerificationStep.PICKUP);
       const hasCheckpoint = verifications.some((v) => v.step === VerificationStep.CHECKPOINT);
       const hasDelivery = verifications.some((v) => v.step === VerificationStep.DELIVERY);

       if (!hasPickup) {
         activeOrder = order;
         targetStep = VerificationStep.PICKUP;
         break;
       } else if (!hasCheckpoint) {
         activeOrder = order;
         targetStep = VerificationStep.CHECKPOINT;
         break;
       } else if (!hasDelivery) {
         activeOrder = order;
         targetStep = VerificationStep.DELIVERY;
         break;
       }
       // If all steps (including delivery) are verified, this order is fully completed. Go to next order.
    }

    if (!activeOrder || !targetStep) {
       throw new BadRequestException('All orders for this trip are already fully verified and delivered.');
    }

    // 5. Upload Face Photo from ESP32 to Supabase Storage
    this.logger.log(`Uploading ESP32 face photo to Supabase storage...`);
    const facePhotoUrl = await this.uploadService.uploadFile(file, 'verifications');
    this.logger.log(`Uploaded successfully: ${facePhotoUrl}`);

    // Get vehicle last known location coordinates
    let latitude: number | undefined = undefined;
    let longitude: number | undefined = undefined;
    if (vehicle.lastKnownLocation && vehicle.lastKnownLocation.coordinates) {
       longitude = vehicle.lastKnownLocation.coordinates[0];
       latitude = vehicle.lastKnownLocation.coordinates[1];
    }

    // 6. Submit Verification via OrderVerificationsService
    this.logger.log(`Creating order verification: Order ${activeOrder.id}, Step ${targetStep}`);
    const verification = await this.orderVerificationsService.create(activeOrder.id, {
      step: targetStep,
      fingerprintStatus: true,
      facePhotoUrl,
      cargoPhotoUrl: facePhotoUrl, // ESP32 Camera selfie as both face and cargo photo
      latitude,
      longitude,
    });

    // 7. Auto-advance statuses if step is PICKUP
    if (targetStep === VerificationStep.PICKUP) {
      this.logger.log(`Auto-advancing order ${activeOrder.id} status to DELIVERING and trip ${activeTrip.id} status to IN_PROGRESS`);
      
      activeOrder.status = OrderStatus.DELIVERING;
      await this.dataSource.getRepository(Order).save(activeOrder);

      activeTrip.status = TripStatus.IN_PROGRESS;
      activeTrip.startedAt = new Date();
      await this.tripRepository.save(activeTrip);

      // Emit trip status changed event so gateways/controllers/dashboard know
      this.eventEmitter.emit('trip.status_changed', {
        id: activeTrip.id,
        status: TripStatus.IN_PROGRESS,
        vehicleId: activeTrip.vehicleId,
        driverId: activeTrip.driverId,
      });
    }

    // 8. Emit order.verified event
    this.eventEmitter.emit('order.verified', {
      orderId: activeOrder.id,
      tripId: activeTrip.id,
      driverId: driver.id,
      step: targetStep,
      success: true,
      verification,
    });

    return {
      success: true,
      orderId: activeOrder.id,
      step: targetStep,
      driverName: driver.user?.fullName || 'Driver',
      plateNumber: vehicle.plateNumber,
      facePhotoUrl,
      verificationId: verification.id,
      timestamp: new Date().toISOString(),
    };
  }

  requestEnrollment(deviceId: string, fingerprintId: number) {
    this.pendingEnrollments.set(deviceId, fingerprintId);
    this.logger.log(`Requested remote enrollment for device ${deviceId} at slot ${fingerprintId}`);
  }

  getPendingEnrollment(deviceId: string): number | null {
    const enrollId = this.pendingEnrollments.get(deviceId) || null;
    if (enrollId) {
      this.pendingEnrollments.delete(deviceId); // Consume the request once
    }
    return enrollId;
  }

  async saveEnrollmentResult(deviceId: string, fingerprintId: number, success: boolean) {
    this.logger.log(`Received enrollment result for device ${deviceId}, slot ${fingerprintId}: ${success ? 'SUCCESS' : 'FAILED'}`);
    if (!success) {
      return { success: false, message: 'Enrollment failed on device' };
    }

    // Find vehicle & driver associated with the device
    const vehicle = await this.vehicleRepository.findOne({
      where: { deviceId },
      relations: ['driver'],
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with deviceId ${deviceId} not found`);
    }

    if (!vehicle.driver) {
      throw new NotFoundException(`No driver assigned to vehicle ${vehicle.plateNumber}`);
    }

    // Save driver's fingerprintId in DB
    vehicle.driver.fingerprintId = String(fingerprintId);
    await this.driverRepository.save(vehicle.driver);
    this.logger.log(`Successfully updated fingerprint ID to ${fingerprintId} for driver ${vehicle.driver.id}`);

    return { success: true, driverId: vehicle.driver.id, fingerprintId };
  }

  @OnEvent('trip.status_changed')
  async handleTripStatusChangedForEnroll(payload: { id: string; status: string; vehicleId: string; driverId: string }) {
    if (payload.status !== TripStatus.ACCEPTED) return;

    // Check if the driver already has a fingerprintId
    const driver = await this.driverRepository.findOne({
      where: { id: payload.driverId },
    });

    if (driver && !driver.fingerprintId) {
      // Find vehicle & deviceId
      const vehicle = await this.vehicleRepository.findOne({
        where: { id: payload.vehicleId },
      });

      if (!vehicle || !vehicle.deviceId) {
        this.logger.warn(`No vehicle/deviceId found for ID ${payload.vehicleId} to auto-enroll`);
        return;
      }

      // Find all currently used fingerprint IDs
      const allDrivers = await this.driverRepository.find({
        select: ['fingerprintId'],
      });

      const usedIds = new Set(
        allDrivers
          .map((d) => d.fingerprintId ? Number(d.fingerprintId) : null)
          .filter((id) => id !== null && !isNaN(id)),
      );

      // Allocate first available slot ID between 1 and 127
      let autoId = 1;
      for (let i = 1; i <= 127; i++) {
        if (!usedIds.has(i)) {
          autoId = i;
          break;
        }
      }

      this.logger.log(`Tài xế mới ${driver.id} chưa có vân tay. Tự động gán slot ${autoId} trên thiết bị ${vehicle.deviceId}`);

      // Register remote enrollment in memory
      this.requestEnrollment(vehicle.deviceId, autoId);

      // Update driver fingerprintId immediately to reserve the slot
      driver.fingerprintId = String(autoId);
      await this.driverRepository.save(driver);

      // Emit WS event to guide Driver via Mobile App & Alert Admin
      this.eventEmitter.emit('enroll.required', {
        driverId: driver.id,
        deviceId: vehicle.deviceId,
        fingerprintId: autoId,
        message: 'Tài xế mới! Hãy đặt ngón tay lên cảm biến trên xe để đăng ký vân tay.',
      });
    }
  }
}
