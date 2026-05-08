import { Test, TestingModule } from '@nestjs/testing';
import { TrackingService } from './tracking.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GpsLocation } from '../entities/gps-location.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Trip } from '../entities/trip.entity';
import { Driver } from '../entities/driver.entity';
import { ViolationDetectorService } from '../alerts/violation-detector.service';

describe('TrackingService', () => {
  let service: TrackingService;
  let gpsRepo: any;
  let vehicleRepo: any;
  let driverRepo: any;
  let tripRepo: any;

  beforeEach(async () => {
    gpsRepo = {
      create: jest.fn().mockImplementation(dto => dto),
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
    };

    driverRepo = {
      findOne: jest.fn(),
    };

    tripRepo = {
      findOne: jest.fn(),
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

  it('should add GPS update to buffer', async () => {
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
    
    expect((service as any).gpsBuffer.length).toBe(1);
    expect(vehicleRepo.createQueryBuilder).toHaveBeenCalled();
  });

  it('should flush buffer and clear it on success', async () => {
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
    expect((service as any).gpsBuffer.length).toBe(1);

    await (service as any).flushBuffer();
    
    expect(gpsRepo.save).toHaveBeenCalledWith(expect.any(Array));
    expect((service as any).gpsBuffer.length).toBe(0);
  });

  it('should not clear buffer on save failure', async () => {
    gpsRepo.save.mockRejectedValue(new Error('DB Error'));
    
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
    await (service as any).flushBuffer();
    
    expect((service as any).gpsBuffer.length).toBe(1);
  });

  it('should validate driver trip successfully', async () => {
    tripRepo.findOne.mockResolvedValue({ id: 't1' });

    const result = await service.validateDriverTrip('d1', 't1', 'v1');
    
    expect(result).toBe(true);
    expect(tripRepo.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: 't1',
        driverId: 'd1',
        vehicleId: 'v1',
      }),
    }));
  });
});
