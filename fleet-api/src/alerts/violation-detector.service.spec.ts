import { Test, TestingModule } from '@nestjs/testing';
import { ViolationDetectorService } from './violation-detector.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Trip } from '../entities/trip.entity';
import { AlertsService } from './alerts.service';
import { AlertType } from '../entities/alert.entity';

describe('ViolationDetectorService', () => {
  let service: ViolationDetectorService;
  let tripRepo: any;
  let alertsService: any;

  beforeEach(async () => {
    tripRepo = {
      findOne: jest.fn(),
      query: jest.fn().mockResolvedValue([{ distance: 0 }]),
    };

    alertsService = {
      createAlert: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ViolationDetectorService,
        {
          provide: getRepositoryToken(Trip),
          useValue: tripRepo,
        },
        {
          provide: AlertsService,
          useValue: alertsService,
        },
      ],
    }).compile();

    service = module.get<ViolationDetectorService>(ViolationDetectorService);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should detect speed violations', async () => {
    const data = {
      vehicleId: 'v1',
      tripId: 't1',
      latitude: 10,
      longitude: 20,
      speed: 100, // Above MAX_SPEED (80)
      heading: 0,
      timestamp: new Date().toISOString(),
    };

    await service.checkViolations(data);
    expect(alertsService.createAlert).toHaveBeenCalledWith(expect.objectContaining({
      type: AlertType.SPEED_VIOLATION,
    }));
  });

  it('should debounce alerts', async () => {
    const data = {
      vehicleId: 'v1',
      tripId: 't1',
      latitude: 10,
      longitude: 20,
      speed: 100,
      heading: 0,
      timestamp: new Date().toISOString(),
    };

    // First violation
    await service.checkViolations(data);
    expect(alertsService.createAlert).toHaveBeenCalledTimes(1);

    // Immediate second violation (should be debounced)
    await service.checkViolations(data);
    expect(alertsService.createAlert).toHaveBeenCalledTimes(1);

    // Fast forward time past COOLDOWN (5 mins)
    jest.advanceTimersByTime(6 * 60 * 1000);

    // Third violation (should trigger alert again)
    await service.checkViolations(data);
    expect(alertsService.createAlert).toHaveBeenCalledTimes(2);
  });

  it('should cache planned route', async () => {
    const data = {
      vehicleId: 'v1',
      tripId: 't1',
      latitude: 10,
      longitude: 20,
      speed: 50,
      heading: 0,
      timestamp: new Date().toISOString(),
    };

    tripRepo.findOne.mockResolvedValue({ id: 't1', plannedRoute: { type: 'LineString', coordinates: [] } });

    // First call - should query DB
    await service.checkViolations(data);
    expect(tripRepo.findOne).toHaveBeenCalledTimes(1);

    // Second call - should use cache
    await service.checkViolations(data);
    expect(tripRepo.findOne).toHaveBeenCalledTimes(1);
  });

  it('should detect route deviation', async () => {
    const data = {
      vehicleId: 'v1',
      tripId: 't1',
      latitude: 10,
      longitude: 20,
      speed: 50,
      heading: 0,
      timestamp: new Date().toISOString(),
    };

    tripRepo.findOne.mockResolvedValue({ id: 't1', plannedRoute: { type: 'LineString', coordinates: [] } });
    tripRepo.query.mockResolvedValue([{ distance: 1000 }]); // 1000m > 500m threshold

    await service.checkViolations(data);
    expect(alertsService.createAlert).toHaveBeenCalledWith(expect.objectContaining({
      type: AlertType.ROUTE_DEVIATION,
    }));
  });
});
