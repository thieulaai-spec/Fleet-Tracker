import {
  Injectable,
  Logger,
  OnModuleDestroy,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not, IsNull } from 'typeorm';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { GpsLocation } from '../entities/gps-location.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Trip, TripStatus } from '../entities/trip.entity';
import { Driver, DriverStatus } from '../entities/driver.entity';
import { GpsUpdateDto } from './dto/gps-update.dto';
import { DeviceGpsUpdateDto } from './dto/device-gps-update.dto';
import { VerifyHardwareDto } from './dto/verify-hardware.dto';
import { ViolationDetectorService } from '../alerts/violation-detector.service';
import { UploadService } from '../upload/upload.service';
import { OrderVerificationsService } from '../order-verifications/order-verifications.service';
import { TripOrder } from '../entities/trip-order.entity';
import {
  OrderVerification,
  VerificationStep,
} from '../entities/order-verification.entity';
import { Order, OrderStatus } from '../entities/order.entity';

@Injectable()
export class TrackingService implements OnModuleDestroy {
  private readonly logger = new Logger(TrackingService.name);
  private gpsBuffer: GpsLocation[] = [];
  private readonly BATCH_INTERVAL = 5000; // 5 seconds
  private flushInterval: NodeJS.Timeout;
  private isFlushing = false;
  private pendingEnrollments = new Map<string, number>();
  private pendingDeletions = new Map<string, number>();
  private pendingClearAll = new Map<string, boolean>();
  private readonly lastHardwareGpsMap = new Map<string, number>();
  private readonly activeOrdersMap = new Map<
    string,
    { orderId: string; expiry: number }
  >();

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

      const isConstraintError =
        error.message.includes('constraint') ||
        error.message.includes('violates') ||
        error.message.includes('foreign key');

      if (isConstraintError) {
        // Attempt to save individually to isolate and discard invalid entries (e.g. FK violations)
        this.logger.warn(
          `Attempting to save ${batch.length} GPS points individually to isolate errors`,
        );

        for (const point of batch) {
          try {
            await this.gpsRepository.save(point);
          } catch (saveError) {
            this.logger.error(
              `Discarding invalid GPS point for vehicle ${point.vehicleId} due to error: ${saveError.message}`,
            );
            // Discard permanently
          }
        }
      } else {
        // General database error (connection down, timeout) - put back to retry later
        this.gpsBuffer = [...batch, ...this.gpsBuffer];

        // Limit buffer size to prevent memory leaks if DB is down for long
        if (this.gpsBuffer.length > 5000) {
          this.logger.warn('GPS Buffer too large, dropping oldest points');
          this.gpsBuffer = this.gpsBuffer.slice(-5000);
        }
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

    // Completely bypass phone GPS database updates and historical buffer.
    // Telemetry is now 100% strictly driven by vehicle IoT hardware.
    this.logger.debug(
      `[Phone GPS] Bypassed update for vehicle ${vehicleId}. Telemetry is strictly driven by IoT hardware.`,
    );

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
      driverId: vehicle?.driver?.id || null,
      driverPhone: vehicle?.driver?.user?.phone || null,
    };
  }

  async processGpsBatch(data: GpsUpdateDto[]) {
    if (!data || data.length === 0) return [];

    this.logger.debug(
      `[Phone GPS] Bypassed batch update of ${data.length} points. Telemetry is strictly driven by IoT hardware.`,
    );

    // Bypassed completely. Just return input points to acknowledge client.
    return data.map((pointData) => ({
      vehicleId: pointData.vehicleId,
      tripId: pointData.tripId,
      latitude: pointData.latitude,
      longitude: pointData.longitude,
      speed: pointData.speed,
      heading: pointData.heading,
      timestamp: pointData.timestamp,
    }));
  }

  async processDeviceGpsUpdate(data: DeviceGpsUpdateDto) {
    const { deviceId, latitude, longitude, speed = 0, heading = 0 } = data;

    this.logger.log(
      `[Hardware GPS] Received update from device ID ${deviceId}: Lat ${latitude}, Lng ${longitude}, Speed ${speed} km/h, Heading ${heading}°`,
    );

    // 1. Find vehicle by deviceId
    const vehicle = await this.vehicleRepository.findOne({
      where: { deviceId },
      relations: ['driver', 'driver.user'],
    });

    if (!vehicle) {
      this.logger.warn(
        `[Hardware GPS] Device ID ${deviceId} has no matching vehicle in database`,
      );
      throw new Error(`Vehicle with deviceId ${deviceId} not found`);
    }

    this.logger.log(
      `[Hardware GPS] Device ID ${deviceId} matched with Vehicle Plate: ${vehicle.plateNumber} (ID: ${vehicle.id})`,
    );

    // Update last known hardware GPS timestamp
    this.lastHardwareGpsMap.set(vehicle.id, Date.now());

    // 2. Check for active trip to link history (can be ACCEPTED or IN_PROGRESS)
    const activeTrip = await this.tripRepository.findOne({
      where: [
        { vehicleId: vehicle.id, status: TripStatus.IN_PROGRESS },
        { vehicleId: vehicle.id, status: TripStatus.ACCEPTED },
      ],
    });

    if (activeTrip) {
      this.logger.log(
        `[Hardware GPS] Vehicle ${vehicle.plateNumber} is currently on active/accepted Trip ID: ${activeTrip.id} (Status: ${activeTrip.status})`,
      );
    } else {
      this.logger.log(
        `[Hardware GPS] Vehicle ${vehicle.plateNumber} has no active/accepted trip`,
      );
    }

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

    // 5. Trigger Violation Detection (Async) - only for IN_PROGRESS trips
    if (activeTrip && activeTrip.status === TripStatus.IN_PROGRESS) {
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
      driverId: vehicle.driver?.id || null,
      driverPhone: vehicle.driver?.user?.phone || null,
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
    const vehicles = await this.vehicleRepository.find({
      relations: ['driver', 'driver.user'],
      select: {
        id: true,
        plateNumber: true,
        type: true,
        status: true,
        imageUrl: true,
        lastKnownLocation: true,
        driver: {
          id: true,
          user: {
            fullName: true,
            phone: true,
          },
        },
      },
    });

    // Query active/accepted trips
    const activeTrips = await this.tripRepository.find({
      where: [
        { status: TripStatus.IN_PROGRESS },
        { status: TripStatus.ACCEPTED },
      ],
      select: ['id', 'vehicleId'],
    });

    // Map active tripId to each vehicle
    return vehicles.map((v) => {
      const trip = activeTrips.find((t) => t.vehicleId === v.id);
      return {
        ...v,
        tripId: trip?.id || null,
      };
    });
  }

  async getDriverByUserId(userId: string): Promise<Driver | null> {
    return this.driverRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async setActiveOrderForDriver(
    userId: string,
    orderId: string,
  ): Promise<{ success: boolean }> {
    const driver = await this.getDriverByUserId(userId);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const vehicle = await this.vehicleRepository.findOne({
      where: { driverId: driver.id },
    });
    if (!vehicle) {
      throw new BadRequestException('No vehicle assigned to this driver');
    }

    const activeTrip = await this.tripRepository.findOne({
      where: [
        { vehicleId: vehicle.id, status: TripStatus.IN_PROGRESS },
        { vehicleId: vehicle.id, status: TripStatus.ACCEPTED },
      ],
    });

    if (!activeTrip) {
      throw new BadRequestException(
        `No active or accepted trip for vehicle ${vehicle.plateNumber}`,
      );
    }

    const tripOrder = await this.dataSource.getRepository(TripOrder).findOne({
      where: { tripId: activeTrip.id, orderId },
    });

    if (!tripOrder) {
      throw new BadRequestException(
        `Selected order ${orderId} does not belong to active trip ${activeTrip.id}`,
      );
    }

    // Set with 10 minutes TTL
    this.activeOrdersMap.set(vehicle.id, {
      orderId,
      expiry: Date.now() + 10 * 60 * 1000,
    });

    this.logger.log(
      `[Hardware Biometric] Driver ${driver.user?.fullName || 'Unknown'} selected active order ${orderId} for vehicle ${vehicle.plateNumber}`,
    );

    return { success: true };
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
      `[Hardware Biometric] Received verification request from device ${deviceId} with fingerprint ID ${fingerprintId}`,
    );

    // 1. Find vehicle by deviceId
    const vehicle = await this.vehicleRepository.findOne({
      where: { deviceId },
      relations: ['driver', 'driver.user'],
    });

    if (!vehicle) {
      this.logger.warn(
        `[Hardware Biometric] Verification failed: Device ID ${deviceId} not found`,
      );
      throw new NotFoundException(
        `Vehicle with deviceId ${deviceId} not found`,
      );
    }

    // 2. Check for active trip (can be accepted or in_progress)
    const activeTrip = await this.tripRepository.findOne({
      where: [
        { vehicleId: vehicle.id, status: TripStatus.IN_PROGRESS },
        { vehicleId: vehicle.id, status: TripStatus.ACCEPTED },
      ],
    });

    if (!activeTrip) {
      this.logger.warn(
        `[Hardware Biometric] Verification failed: No active/accepted trip for vehicle ${vehicle.plateNumber}`,
      );
      throw new BadRequestException(
        `No active trip in progress or accepted for vehicle ${vehicle.plateNumber}`,
      );
    }

    // 3. Verify Biometrics: Does fingerprintId match driver's registered fingerprintId?
    const driver = vehicle.driver;
    if (!driver) {
      this.logger.warn(
        `[Hardware Biometric] Verification failed: No driver assigned to vehicle ${vehicle.plateNumber}`,
      );
      throw new BadRequestException(
        `No driver assigned to vehicle ${vehicle.plateNumber}`,
      );
    }

    if (driver.fingerprintId !== fingerprintId) {
      this.logger.error(
        `[Hardware Biometric] FAILED! Scanned fingerprint ID ${fingerprintId} does not match registered ID ${driver.fingerprintId} for driver ${driver.user?.fullName}`,
      );
      throw new UnauthorizedException(
        `Biometric mismatch. Scanned fingerprint ID ${fingerprintId} does not match driver's registered ID.`,
      );
    }

    this.logger.log(
      `[Hardware Biometric] SUCCESS! Fingerprint ID ${fingerprintId} matched for driver ${driver.user?.fullName || 'Unknown'} (Vehicle: ${vehicle.plateNumber})`,
    );

    // 4. Identify the active order & step to verify
    // Query all trip orders for this active trip, sorted by sequence
    const tripOrders = await this.dataSource.getRepository(TripOrder).find({
      where: { tripId: activeTrip.id },
      order: { sequence: 'ASC' },
      relations: ['order'],
    });

    if (tripOrders.length === 0) {
      throw new BadRequestException(
        `No orders found for active trip ${activeTrip.id}`,
      );
    }

    let activeOrder: Order | null = null;
    let targetStep: VerificationStep | null = null;

    // Check if driver pre-selected an active order on phone app
    let activeOrderId: string | null = null;
    const entry = this.activeOrdersMap.get(vehicle.id);
    if (entry) {
      if (Date.now() > entry.expiry) {
        this.activeOrdersMap.delete(vehicle.id);
      } else {
        activeOrderId = entry.orderId;
      }
    }

    if (activeOrderId) {
      const targetTripOrder = tripOrders.find(
        (to) => to.orderId === activeOrderId,
      );
      if (targetTripOrder && targetTripOrder.order) {
        const order = targetTripOrder.order;
        const verifications = await this.dataSource
          .getRepository(OrderVerification)
          .find({
            where: { orderId: order.id },
            order: { createdAt: 'ASC' },
          });

        const hasPickup = verifications.some(
          (v) => v.step === VerificationStep.PICKUP,
        );
        const hasDelivery = verifications.some(
          (v) => v.step === VerificationStep.DELIVERY,
        );

        if (!hasPickup) {
          activeOrder = order;
          targetStep = VerificationStep.PICKUP;
        } else if (!hasDelivery) {
          activeOrder = order;
          targetStep = VerificationStep.DELIVERY;
        }
      }
    }

    // Fallback: Find the first incomplete order by sequence if no active selection or selected order is completed
    if (!activeOrder || !targetStep) {
      for (const to of tripOrders) {
        const order = to.order;
        if (!order) continue;

        // Query verifications for this order
        const verifications = await this.dataSource
          .getRepository(OrderVerification)
          .find({
            where: { orderId: order.id },
            order: { createdAt: 'ASC' },
          });

        const hasPickup = verifications.some(
          (v) => v.step === VerificationStep.PICKUP,
        );
        const hasDelivery = verifications.some(
          (v) => v.step === VerificationStep.DELIVERY,
        );

        if (!hasPickup) {
          activeOrder = order;
          targetStep = VerificationStep.PICKUP;
          break;
        } else if (!hasDelivery) {
          activeOrder = order;
          targetStep = VerificationStep.DELIVERY;
          break;
        }
      }
    }

    if (!activeOrder || !targetStep) {
      throw new BadRequestException(
        'All orders for this trip are already fully verified and delivered.',
      );
    }

    // 5. Upload Face Photo from ESP32 to Supabase Storage
    this.logger.log(
      `[Hardware Biometric] Uploading ESP32 selfie snapshot (${file?.size || 0} bytes) to storage...`,
    );
    const facePhotoUrl = await this.uploadService.uploadFile(
      file,
      'verifications',
    );
    this.logger.log(
      `[Hardware Biometric] Snapshot uploaded successfully: ${facePhotoUrl}`,
    );

    // Get vehicle last known location coordinates
    let latitude: number | undefined = undefined;
    let longitude: number | undefined = undefined;
    if (vehicle.lastKnownLocation && vehicle.lastKnownLocation.coordinates) {
      longitude = vehicle.lastKnownLocation.coordinates[0];
      latitude = vehicle.lastKnownLocation.coordinates[1];
    }

    // Validate Geofencing for PICKUP and DELIVERY steps
    if (
      targetStep === VerificationStep.PICKUP ||
      targetStep === VerificationStep.DELIVERY
    ) {
      const targetLocation =
        targetStep === VerificationStep.PICKUP
          ? activeOrder.pickupLocation
          : activeOrder.deliveryLocation;

      if (!targetLocation || !targetLocation.coordinates) {
        throw new BadRequestException(
          `Target location for order step ${targetStep} is not configured.`,
        );
      }

      if (
        latitude === undefined ||
        latitude === null ||
        longitude === undefined ||
        longitude === null
      ) {
        throw new BadRequestException(
          `Tọa độ GPS của xe hiện chưa sẵn sàng. Không thể xác thực phạm vi.`,
        );
      }

      const distance = this.calculateDistance(
        latitude,
        longitude,
        targetLocation.coordinates[1],
        targetLocation.coordinates[0],
      );

      if (distance > 200) {
        this.logger.error(
          `[Hardware Biometric] FAILED! Vehicle is ${Math.round(distance)}m away from target. Geofencing limit is 200m.`,
        );
        throw new BadRequestException(
          `Khoảng cách quá xa. Xe cách điểm ${targetStep === VerificationStep.PICKUP ? 'lấy hàng' : 'giao hàng'} ${Math.round(distance)}m (yêu cầu dưới 200m).`,
        );
      }
    }

    // 6. Submit Verification via OrderVerificationsService
    this.logger.log(
      `[Hardware Biometric] Registering verification: Order ${activeOrder.id}, Step ${targetStep}, Face URL: ${facePhotoUrl}, Location: [${latitude || 'N/A'}, ${longitude || 'N/A'}]`,
    );
    const verification = await this.orderVerificationsService.create(
      activeOrder.id,
      {
        step: targetStep,
        fingerprintStatus: true,
        facePhotoUrl,
        cargoPhotoUrl: facePhotoUrl, // ESP32 Camera selfie as both face and cargo photo
        latitude,
        longitude,
      },
    );

    // 7. Auto-advance statuses based on verification step
    if (targetStep === VerificationStep.PICKUP) {
      // Advance order to DELIVERING and trip to IN_PROGRESS
      this.logger.log(
        `[Hardware Biometric] Auto-advancing order ${activeOrder.id} status to DELIVERING and trip ${activeTrip.id} status to IN_PROGRESS`,
      );
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
    } else if (targetStep === VerificationStep.DELIVERY) {
      // Mark order as DELIVERED and reduce vehicle load
      this.logger.log(
        `[Hardware Biometric] Delivery verified for order ${activeOrder.id}. Updating load: -${activeOrder.weightKg}kg`,
      );
      activeOrder.status = OrderStatus.DELIVERED;
      await this.dataSource.getRepository(Order).save(activeOrder);

      // Decrease vehicle current load safely
      vehicle.currentLoadKg = Math.max(
        0,
        Number(vehicle.currentLoadKg) - Number(activeOrder.weightKg),
      );
      await this.vehicleRepository.save(vehicle);
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

    // Clear active order from selection map on success
    this.activeOrdersMap.delete(vehicle.id);

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
    this.logger.log(
      `[Hardware Biometric] Command: Requested remote fingerprint enrollment for device ${deviceId} at slot #${fingerprintId}`,
    );
  }

  getPendingEnrollment(deviceId: string): number | null {
    const enrollId = this.pendingEnrollments.get(deviceId) || null;
    if (enrollId) {
      this.logger.log(
        `[Hardware Biometric] Polled: Device ${deviceId} fetched pending enrollment slot #${enrollId}`,
      );
      this.pendingEnrollments.delete(deviceId); // Consume immediately to prevent infinite loop on device
    }
    return enrollId;
  }

  getPendingDeletion(deviceId: string): number | null {
    const deleteId = this.pendingDeletions.get(deviceId) || null;
    if (deleteId) {
      this.logger.log(
        `[Hardware Biometric] Polled: Device ${deviceId} fetched pending deletion slot #${deleteId}`,
      );
      this.pendingDeletions.delete(deviceId); // Consume immediately to prevent infinite loop on device
    }
    return deleteId;
  }

  getPendingClearAll(deviceId: string): boolean | null {
    const clearAll = this.pendingClearAll.get(deviceId) || null;
    if (clearAll) {
      this.logger.log(
        `[Hardware Biometric] Polled: Device ${deviceId} fetched pending clear_all command`,
      );
      this.pendingClearAll.delete(deviceId); // Consume immediately to prevent infinite loop on device
    }
    return clearAll;
  }

  async saveEnrollmentResult(
    deviceId: string,
    fingerprintId: number,
    success: boolean,
  ) {
    this.logger.log(
      `[Hardware Biometric] Result: Received enrollment callback from device ${deviceId}, slot #${fingerprintId}: Status=${success ? 'SUCCESS' : 'FAILED'}`,
    );

    // Consume the pending enrollment request upon receiving the result callback from the device
    this.pendingEnrollments.delete(deviceId);

    // Find vehicle & driver associated with the device
    const vehicle = await this.vehicleRepository.findOne({
      where: { deviceId },
      relations: ['driver'],
    });

    if (!vehicle) {
      this.logger.warn(
        `[Hardware Biometric] Enrollment save failed: Device ${deviceId} not matched with any vehicle`,
      );
      throw new NotFoundException(
        `Vehicle with deviceId ${deviceId} not found`,
      );
    }

    if (!vehicle.driver) {
      this.logger.warn(
        `[Hardware Biometric] Enrollment save failed: Vehicle ${vehicle.plateNumber} has no assigned driver`,
      );
      throw new NotFoundException(
        `No driver assigned to vehicle ${vehicle.plateNumber}`,
      );
    }

    if (!success) {
      this.logger.warn(
        `[Hardware Biometric] Enrollment failed on device ${deviceId} for slot #${fingerprintId}`,
      );

      // Re-queue the remote enrollment request in memory so the vehicle will retry on next poll!
      this.requestEnrollment(deviceId, fingerprintId);

      // Emit socket event for failure
      this.eventEmitter.emit('enroll.result', {
        driverId: vehicle.driver.id,
        deviceId,
        fingerprintId,
        success: false,
        message:
          'Đăng ký vân tay thất bại! Vui lòng đặt ngón tay lên cảm biến để thử lại.',
      });
      return { success: false, message: 'Enrollment failed on device' };
    }

    // Save driver's fingerprintId in DB
    vehicle.driver.fingerprintId = String(fingerprintId);
    await this.driverRepository.save(vehicle.driver);
    this.logger.log(
      `[Hardware Biometric] DB Update: Assigned fingerprint ID #${fingerprintId} to driver ID ${vehicle.driver.id}`,
    );

    // Emit socket event for success
    this.eventEmitter.emit('enroll.result', {
      driverId: vehicle.driver.id,
      deviceId,
      fingerprintId,
      success: true,
      message:
        'Đăng ký vân tay thành công! Vân tay của bạn đã được liên kết với thiết bị trên xe.',
    });

    return { success: true, driverId: vehicle.driver.id, fingerprintId };
  }

  async saveDeletionResult(
    deviceId: string,
    fingerprintId: number,
    success: boolean,
  ) {
    this.logger.log(
      `[Hardware Biometric] Result: Received deletion callback from device ${deviceId}, slot #${fingerprintId}: Status=${success ? 'SUCCESS' : 'FAILED'}`,
    );

    // Consume the pending deletion request upon receiving the result callback from the device
    this.pendingDeletions.delete(deviceId);

    // Find vehicle & driver associated with the device
    const vehicle = await this.vehicleRepository.findOne({
      where: { deviceId },
      relations: ['driver'],
    });

    if (!vehicle) {
      this.logger.warn(
        `[Hardware Biometric] Deletion save failed: Device ${deviceId} not matched with any vehicle`,
      );
      throw new NotFoundException(
        `Vehicle with deviceId ${deviceId} not found`,
      );
    }

    if (!vehicle.driver) {
      this.logger.warn(
        `[Hardware Biometric] Deletion save failed: Vehicle ${vehicle.plateNumber} has no assigned driver`,
      );
      throw new NotFoundException(
        `No driver assigned to vehicle ${vehicle.plateNumber}`,
      );
    }

    // Emit socket event for success/failure
    this.eventEmitter.emit('fingerprint.deleted', {
      driverId: vehicle.driver.id,
      deviceId,
      fingerprintId,
      success,
      message: success
        ? 'Đã đồng bộ xóa vân tay thành công trên thiết bị xe!'
        : 'Xóa vân tay trên thiết bị thất bại! Vui lòng kiểm tra kết nối thiết bị.',
    });

    return { success, driverId: vehicle.driver.id, fingerprintId };
  }

  async saveClearAllResult(deviceId: string, success: boolean) {
    this.logger.log(
      `[Hardware Biometric] Result: Received clear-all callback from device ${deviceId}: Status=${success ? 'SUCCESS' : 'FAILED'}`,
    );

    // Consume the pending clear_all request upon receiving the result callback from the device
    this.pendingClearAll.delete(deviceId);

    // Find vehicle & driver associated with the device
    const vehicle = await this.vehicleRepository.findOne({
      where: { deviceId },
      relations: ['driver'],
    });

    if (!vehicle) {
      this.logger.warn(
        `[Hardware Biometric] Clear-all save failed: Device ${deviceId} not matched with any vehicle`,
      );
      throw new NotFoundException(
        `Vehicle with deviceId ${deviceId} not found`,
      );
    }

    // Emit socket event for success/failure
    this.eventEmitter.emit('fingerprint.all_cleared', {
      deviceId,
      success,
      message: success
        ? 'Đã xóa toàn bộ bộ nhớ vân tay thành công trên thiết bị xe!'
        : 'Xóa toàn bộ vân tay trên xe thất bại! Vui lòng kiểm tra kết nối thiết bị.',
    });

    return { success, deviceId };
  }

  @OnEvent('trip.status_changed')
  async handleTripStatusChangedForEnroll(payload: {
    id: string;
    status: string;
    vehicleId: string;
    driverId: string;
  }) {
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
        this.logger.warn(
          `No vehicle/deviceId found for ID ${payload.vehicleId} to auto-enroll`,
        );
        return;
      }

      // Find all currently used fingerprint IDs
      const allDrivers = await this.driverRepository.find({
        select: ['fingerprintId'],
      });

      const usedIds = new Set(
        allDrivers
          .map((d) => (d.fingerprintId ? Number(d.fingerprintId) : null))
          .filter((id) => id !== null && !isNaN(id)),
      );

      // Also add currently pending enrollment slots in memory to usedIds
      for (const pendingId of this.pendingEnrollments.values()) {
        usedIds.add(pendingId);
      }

      // Allocate first available slot ID between 1 and 127
      let autoId = 1;
      for (let i = 1; i <= 127; i++) {
        if (!usedIds.has(i)) {
          autoId = i;
          break;
        }
      }

      this.logger.log(
        `[Hardware Biometric] Driver ${driver.id} has no fingerprint. Auto-allocating slot #${autoId} on device ${vehicle.deviceId}`,
      );

      // Register remote enrollment in memory
      this.requestEnrollment(vehicle.deviceId, autoId);

      // Emit WS event to guide Driver via Mobile App & Alert Admin
      this.eventEmitter.emit('enroll.required', {
        driverId: driver.id,
        deviceId: vehicle.deviceId,
        fingerprintId: autoId,
        message:
          'Tài xế mới! Hãy đặt ngón tay lên cảm biến trên xe để đăng ký vân tay.',
      });
    }
  }

  @OnEvent('fingerprint.cleared')
  async handleFingerprintCleared(payload: {
    driverId: string;
    fingerprintId: string;
  }) {
    this.logger.log(
      `[Hardware Biometric] handleFingerprintCleared payload: ${JSON.stringify(payload)}`,
    );

    // 1. Check if driver currently has an active trip (ACCEPTED or IN_PROGRESS)
    const activeTrip = await this.tripRepository.findOne({
      where: [
        { driverId: payload.driverId, status: TripStatus.ACCEPTED },
        { driverId: payload.driverId, status: TripStatus.IN_PROGRESS },
      ],
      relations: ['vehicle', 'driver'],
    });

    // 2. Find vehicle: Use active trip's vehicle first, or fallback to permanently assigned vehicle
    const vehicle =
      activeTrip?.vehicle ||
      (await this.vehicleRepository.findOne({
        where: { driverId: payload.driverId },
        relations: ['driver'],
      }));

    if (vehicle) {
      this.logger.log(
        `[Hardware Biometric] Found vehicle ${vehicle.plateNumber} for driver ${payload.driverId}. DeviceId: ${vehicle.deviceId}`,
      );
    } else {
      this.logger.warn(
        `[Hardware Biometric] No vehicle found for driver ${payload.driverId} to sync fingerprint deletion!`,
      );
    }

    if (vehicle && vehicle.deviceId) {
      const fingerprintIdNum = parseInt(payload.fingerprintId, 10);
      if (!isNaN(fingerprintIdNum)) {
        this.pendingDeletions.set(vehicle.deviceId, fingerprintIdNum);
        this.logger.log(
          `[Hardware Biometric] Queued deletion for device ${vehicle.deviceId} (slot #${fingerprintIdNum})`,
        );

        // Robust check if driver is currently active on a trip
        const isCurrentlyOnTrip = !!activeTrip;

        // Proactive Enroll: If driver is currently active on a trip, auto-trigger a new enrollment immediately!
        if (isCurrentlyOnTrip) {
          // Find all currently used fingerprint IDs
          const allDrivers = await this.driverRepository.find({
            select: ['fingerprintId'],
          });

          const usedIds = new Set(
            allDrivers
              .map((d) => (d.fingerprintId ? Number(d.fingerprintId) : null))
              .filter((id) => id !== null && !isNaN(id)),
          );

          // Ensure the slot we just queued for deletion is not immediately re-allocated before actual deletion completes
          usedIds.add(fingerprintIdNum);

          // Also add currently pending enrollment slots in memory to usedIds
          for (const pendingId of this.pendingEnrollments.values()) {
            usedIds.add(pendingId);
          }

          // Allocate first available slot ID between 1 and 127
          let autoId = 1;
          for (let i = 1; i <= 127; i++) {
            if (!usedIds.has(i)) {
              autoId = i;
              break;
            }
          }

          const driverEntity = activeTrip?.driver || vehicle.driver;
          if (driverEntity) {
            this.logger.log(
              `[Hardware Biometric] Driver ${driverEntity.id} is active on trip. Auto-triggering remote fingerprint enrollment slot #${autoId} on device ${vehicle.deviceId} after deletion`,
            );

            // Register remote enrollment in memory
            this.requestEnrollment(vehicle.deviceId, autoId);

            // Emit WS event to guide Driver via Mobile App & Alert Admin
            this.eventEmitter.emit('enroll.required', {
              driverId: driverEntity.id,
              deviceId: vehicle.deviceId,
              fingerprintId: autoId,
              message:
                'Đăng ký lại vân tay! Vui lòng đặt ngón tay lên cảm biến trên xe để đăng ký vân tay mới cho chuyến đi hiện tại.',
            });
          }
        }
      }
    }
  }

  @OnEvent('fingerprint.cleared_all')
  async handleFingerprintClearedAll() {
    this.logger.log(
      `[Hardware Biometric] handleFingerprintClearedAll triggered`,
    );

    // Get all vehicles with deviceId
    const vehicles = await this.vehicleRepository.find({
      where: { deviceId: Not(IsNull()) },
    });

    for (const vehicle of vehicles) {
      if (vehicle.deviceId) {
        this.pendingClearAll.set(vehicle.deviceId, true);
        this.logger.log(
          `[Hardware Biometric] Queued full flash clear for device ${vehicle.deviceId}`,
        );
      }
    }
  }

  async checkAndTriggerEnrollmentForActiveDriver(driverId: string) {
    const driver = await this.driverRepository.findOne({
      where: { id: driverId },
    });

    if (driver && !driver.fingerprintId) {
      // Find active trip for this driver
      const activeTrip = await this.tripRepository.findOne({
        where: [
          { driverId, status: TripStatus.ACCEPTED },
          { driverId, status: TripStatus.IN_PROGRESS },
        ],
        relations: ['vehicle'],
      });

      if (activeTrip && activeTrip.vehicle && activeTrip.vehicle.deviceId) {
        const deviceId = activeTrip.vehicle.deviceId;

        // Find if an enrollment is already queued for this device
        let enrollId = this.pendingEnrollments.get(deviceId) || null;

        if (!enrollId) {
          // Allocate a new slot ID
          const allDrivers = await this.driverRepository.find({
            select: ['fingerprintId'],
          });

          const usedIds = new Set(
            allDrivers
              .map((d) => (d.fingerprintId ? Number(d.fingerprintId) : null))
              .filter((id) => id !== null && !isNaN(id)),
          );

          for (const pendingId of this.pendingEnrollments.values()) {
            usedIds.add(pendingId);
          }

          let autoId = 1;
          for (let i = 1; i <= 127; i++) {
            if (!usedIds.has(i)) {
              autoId = i;
              break;
            }
          }
          enrollId = autoId;
          this.requestEnrollment(deviceId, enrollId);
        }

        this.logger.log(
          `[Hardware Biometric] Driver ${driverId} connected with active trip. Triggering/Re-emitting remote fingerprint enrollment slot #${enrollId} on device ${deviceId}`,
        );

        // Emit WS event to guide Driver via Mobile App
        this.eventEmitter.emit('enroll.required', {
          driverId,
          deviceId,
          fingerprintId: enrollId,
          message:
            'Chuyến đi đang hoạt động! Vui lòng đặt ngón tay lên cảm biến trên xe để đăng ký vân tay để xác thực chặng.',
        });
      }
    }
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d * 1000; // Return distance in meters
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
