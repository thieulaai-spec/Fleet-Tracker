import { Test, TestingModule } from '@nestjs/testing';
import { TrackingService } from './tracking.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GpsLocation } from '../entities/gps-location.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Trip } from '../entities/trip.entity';
import { Driver } from '../entities/driver.entity';
import { ViolationDetectorService } from '../alerts/violation-detector.service';
import { UploadService } from '../upload/upload.service';
import { OrderVerificationsService } from '../order-verifications/order-verifications.service';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('TrackingService', () => {
  let service: TrackingService;
  let gpsRepo: any;
  let vehicleRepo: any;
  let driverRepo: any;
  let tripRepo: any;

  beforeEach(async () => {
    gpsRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn(),
    };

    vehicleRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      }),
      find: jest.fn(),
      findOne: jest.fn().mockResolvedValue({
        id: 'v1',
        plateNumber: '51A-999.99',
        status: 'available',
        driver: {
          id: 'd1',
          user: { fullName: 'Nguyen Van Hung' },
        },
      }),
    };

    driverRepo = {
      findOne: jest.fn(),
    };

    tripRepo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingService,
        {
          provide: getRepositoryToken(GpsLocation),
          useValue: gpsRepo,
        },
        {
          provide: getRepositoryToken(Vehicle),
          useValue: vehicleRepo,
        },
        {
          provide: getRepositoryToken(Trip),
          useValue: tripRepo,
        },
        {
          provide: getRepositoryToken(Driver),
          useValue: driverRepo,
        },
        {
          provide: ViolationDetectorService,
          useValue: {
            checkViolations: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: UploadService,
          useValue: {
            uploadFile: jest.fn(),
          },
        },
        {
          provide: OrderVerificationsService,
          useValue: {
            verifyStep: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            getRepository: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TrackingService>(TrackingService);
    jest.useFakeTimers();
  });

  afterEach(() => {
    service.onModuleDestroy();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should add hardware GPS update to buffer', async () => {
    const deviceData = {
      deviceId: 'device_001',
      latitude: 10,
      longitude: 20,
      speed: 50,
      heading: 90,
    };

    await service.processDeviceGpsUpdate(deviceData);

    expect((service as any).gpsBuffer.length).toBe(1);
    expect(vehicleRepo.createQueryBuilder).toHaveBeenCalled();
  });

  it('should bypass phone GPS update completely', async () => {
    const data = {
      vehicleId: 'v1',
      tripId: 't1',
      latitude: 10,
      longitude: 20,
      speed: 50,
      heading: 90,
      timestamp: new Date().toISOString(),
    };

    await service.processGpsUpdate(data);

    // Phone GPS updates must not add to buffer or query builder
    expect((service as any).gpsBuffer.length).toBe(0);
  });

  it('should flush buffer and clear it on success', async () => {
    const deviceData = {
      deviceId: 'device_001',
      latitude: 10,
      longitude: 20,
      speed: 50,
      heading: 90,
    };

    await service.processDeviceGpsUpdate(deviceData);
    expect((service as any).gpsBuffer.length).toBe(1);

    await (service as any).flushBuffer();

    expect(gpsRepo.save).toHaveBeenCalledWith(expect.any(Array));
    expect((service as any).gpsBuffer.length).toBe(0);
  });

  it('should not clear buffer on save failure', async () => {
    gpsRepo.save.mockRejectedValue(new Error('DB Error'));

    const deviceData = {
      deviceId: 'device_001',
      latitude: 10,
      longitude: 20,
      speed: 50,
      heading: 90,
    };

    await service.processDeviceGpsUpdate(deviceData);
    await (service as any).flushBuffer();

    expect((service as any).gpsBuffer.length).toBe(1);
  });

  it('should validate driver trip successfully', async () => {
    tripRepo.findOne.mockResolvedValue({ id: 't1' });

    const result = await service.validateDriverTrip('d1', 't1', 'v1');

    expect(result).toBe(true);
    expect(tripRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 't1',
          driverId: 'd1',
          vehicleId: 'v1',
        }),
      }),
    );
  });

  it('should get vehicle history', async () => {
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    gpsRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    await service.getVehicleHistory('v1', new Date(), new Date());

    expect(mockQueryBuilder.where).toHaveBeenCalledWith(
      'gps.vehicleId = :vehicleId',
      { vehicleId: 'v1' },
    );
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
    expect(mockQueryBuilder.getMany).toHaveBeenCalled();
  });

  it('should get all live locations', async () => {
    vehicleRepo.find.mockResolvedValue([]);
    await service.getAllLiveLocations();
    expect(vehicleRepo.find).toHaveBeenCalled();
  });

  it('should drop oldest points if buffer exceeds limit on failure', async () => {
    gpsRepo.save.mockRejectedValue(new Error('DB Error'));

    // Fill buffer beyond 5000
    (service as any).gpsBuffer = new Array(5100).fill({ id: 'old' });

    await (service as any).flushBuffer();

    expect((service as any).gpsBuffer.length).toBe(5000);
  });

  describe('Helpers', () => {
    it('getDriverByUserId should return a driver', async () => {
      driverRepo.findOne.mockResolvedValue({ id: 'd1' });
      const result = await service.getDriverByUserId('u1');
      expect(result).toEqual({ id: 'd1' });
    });

    it('getTripById should return a trip', async () => {
      tripRepo.findOne.mockResolvedValue({ id: 't1' });
      const result = await service.getTripById('t1');
      expect(result).toEqual({ id: 't1' });
    });

    it('processDeviceGpsUpdate should handle violation check errors gracefully', async () => {
      jest.useRealTimers();
      const detector = (service as any).violationDetector;
      detector.checkViolations.mockRejectedValue(new Error('Detector Error'));
      const loggerSpy = jest.spyOn((service as any).logger, 'error');

      tripRepo.findOne.mockResolvedValue({ id: 't1', status: 'in_progress' });

      const deviceData = {
        deviceId: 'device_001',
        latitude: 10,
        longitude: 20,
        speed: 50,
        heading: 90,
      };

      await service.processDeviceGpsUpdate(deviceData);

      // We need to wait for the async checkViolations to fail
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Violation check failed: Detector Error'),
      );
    });
  });

  describe('Hardware Active Order Verification', () => {
    let mockTripOrderRepo: any;
    let mockOrderVerificationRepo: any;
    let mockOrderRepo: any;
    let mockUploadService: any;
    let mockOrderVerificationsService: any;

    beforeEach(() => {
      mockTripOrderRepo = {
        find: jest.fn(),
        findOne: jest.fn(),
      };
      mockOrderVerificationRepo = {
        find: jest.fn(),
        save: jest.fn(),
      };
      mockOrderRepo = {
        save: jest.fn(),
      };

      const dataSource = (service as any).dataSource;
      dataSource.getRepository.mockImplementation((entity: any) => {
        if (entity.name === 'TripOrder') return mockTripOrderRepo;
        if (entity.name === 'OrderVerification')
          return mockOrderVerificationRepo;
        if (entity.name === 'Order') return mockOrderRepo;
        return null;
      });

      mockUploadService = (service as any).uploadService;
      mockUploadService.uploadFile.mockResolvedValue(
        'https://example.com/face.jpg',
      );

      mockOrderVerificationsService = (service as any)
        .orderVerificationsService;
      mockOrderVerificationsService.create.mockResolvedValue({ id: 'v_ok' });
    });

    it('should set active order for driver successfully', async () => {
      const driver = { id: 'd1', user: { fullName: 'Driver A' } };
      const vehicle = { id: 'v1', plateNumber: '29A-12345' };
      const trip = { id: 't1', status: 'accepted' };
      const tripOrder = { tripId: 't1', orderId: 'order_2' };

      driverRepo.findOne.mockResolvedValue(driver);
      vehicleRepo.findOne.mockResolvedValue(vehicle);
      tripRepo.findOne.mockResolvedValue(trip);
      mockTripOrderRepo.findOne.mockResolvedValue(tripOrder);

      const res = await service.setActiveOrderForDriver('u1', 'order_2');
      expect(res.success).toBe(true);
      expect((service as any).activeOrdersMap.has('v1')).toBe(true);
    });

    it('should throw error when setting active order if order does not belong to active trip', async () => {
      const driver = { id: 'd1', user: { fullName: 'Driver A' } };
      const vehicle = { id: 'v1', plateNumber: '29A-12345' };
      const trip = { id: 't1', status: 'accepted' };

      driverRepo.findOne.mockResolvedValue(driver);
      vehicleRepo.findOne.mockResolvedValue(vehicle);
      tripRepo.findOne.mockResolvedValue(trip);
      mockTripOrderRepo.findOne.mockResolvedValue(null);

      await expect(
        service.setActiveOrderForDriver('u1', 'order_wrong'),
      ).rejects.toThrow(
        'Selected order order_wrong does not belong to active trip t1',
      );
    });

    it('should verify correct pre-selected order even if it is second in sequence', async () => {
      const vehicle = {
        id: 'v1',
        plateNumber: '29A-12345',
        deviceId: 'dev_001',
        driver: {
          id: 'd1',
          fingerprintId: 'fp_123',
          user: { fullName: 'Driver A' },
        },
        lastKnownLocation: { type: 'Point', coordinates: [105.8, 21.0] },
      };
      const trip = { id: 't1', status: 'in_progress', vehicleId: 'v1' };

      const order1 = {
        id: 'order_1',
        pickupLocation: { type: 'Point', coordinates: [105.8, 21.0] },
        deliveryLocation: { type: 'Point', coordinates: [105.9, 21.1] },
      };
      const order2 = {
        id: 'order_2',
        pickupLocation: { type: 'Point', coordinates: [105.8, 21.0] },
        deliveryLocation: { type: 'Point', coordinates: [105.9, 21.1] },
      };

      const tripOrders = [
        { tripId: 't1', orderId: 'order_1', sequence: 1, order: order1 },
        { tripId: 't1', orderId: 'order_2', sequence: 2, order: order2 },
      ];

      vehicleRepo.findOne.mockResolvedValue(vehicle);
      tripRepo.findOne.mockResolvedValue(trip);
      mockTripOrderRepo.find.mockResolvedValue(tripOrders);

      // mock OrderVerification: order_1 is NOT verified, order_2 is NOT verified
      mockOrderVerificationRepo.find.mockImplementation((options: any) => {
        return Promise.resolve([]);
      });

      // Pre-select order_2
      (service as any).activeOrdersMap.set('v1', {
        orderId: 'order_2',
        expiry: Date.now() + 100000,
      });

      const body = { fingerprintId: 'fp_123', deviceId: 'dev_001' };
      const file = { size: 100 } as any;

      const res = await service.processHardwareVerification(file, body);
      expect(res.success).toBe(true);
      expect(res.orderId).toBe('order_2'); // Should pick order_2 because it is pre-selected!
      expect((service as any).activeOrdersMap.has('v1')).toBe(false); // cleared on success
    });

    it('should fallback to first incomplete sequence order when no active order pre-selected', async () => {
      const vehicle = {
        id: 'v1',
        plateNumber: '29A-12345',
        deviceId: 'dev_001',
        driver: {
          id: 'd1',
          fingerprintId: 'fp_123',
          user: { fullName: 'Driver A' },
        },
        lastKnownLocation: { type: 'Point', coordinates: [105.8, 21.0] },
      };
      const trip = { id: 't1', status: 'in_progress', vehicleId: 'v1' };

      const order1 = {
        id: 'order_1',
        pickupLocation: { type: 'Point', coordinates: [105.8, 21.0] },
      };
      const order2 = {
        id: 'order_2',
        pickupLocation: { type: 'Point', coordinates: [105.8, 21.0] },
      };

      const tripOrders = [
        { tripId: 't1', orderId: 'order_1', sequence: 1, order: order1 },
        { tripId: 't1', orderId: 'order_2', sequence: 2, order: order2 },
      ];

      vehicleRepo.findOne.mockResolvedValue(vehicle);
      tripRepo.findOne.mockResolvedValue(trip);
      mockTripOrderRepo.find.mockResolvedValue(tripOrders);

      mockOrderVerificationRepo.find.mockResolvedValue([]);

      const body = { fingerprintId: 'fp_123', deviceId: 'dev_001' };
      const file = { size: 100 } as any;

      const res = await service.processHardwareVerification(file, body);
      expect(res.success).toBe(true);
      expect(res.orderId).toBe('order_1'); // Fallback to order_1 because no pre-selection
    });
  });

  it('should start and stop batch processing on module lifecycle', () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    service.onModuleInit();
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 5000);

    service.onModuleDestroy();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
