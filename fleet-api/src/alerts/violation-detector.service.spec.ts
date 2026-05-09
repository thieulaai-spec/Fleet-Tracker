import { Test, TestingModule } from '@nestjs/testing';
import { ViolationDetectorService } from './violation-detector.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Trip, TripStatus } from '../entities/trip.entity';
import { AlertsService } from './alerts.service';
import { AlertType, AlertSeverity } from '../entities/alert.entity';
import { Repository } from 'typeorm';

describe('ViolationDetectorService', () => {
  let service: ViolationDetectorService;
  let tripRepo: Repository<Trip>;
  let alertsService: AlertsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ViolationDetectorService,
        {
          provide: getRepositoryToken(Trip),
          useValue: {
            findOne: jest.fn(),
            query: jest.fn().mockResolvedValue([{ distance: 100 }]),
          },
        },
        {
          provide: AlertsService,
          useValue: {
            createAlert: jest.fn().mockResolvedValue({ id: 'alert-id' }),
          },
        },
      ],
    }).compile();

    service = module.get<ViolationDetectorService>(ViolationDetectorService);
    tripRepo = module.get<Repository<Trip>>(getRepositoryToken(Trip));
    alertsService = module.get<AlertsService>(AlertsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkViolations', () => {
    const baseGpsData = {
      vehicleId: 'v1',
      tripId: 't1',
      latitude: 10.0,
      longitude: 106.0,
      speed: 60,
      heading: 0,
      timestamp: new Date().toISOString(),
    };

    it('should detect speed violations', async () => {
      const speedingData = { ...baseGpsData, speed: 90 }; // Limit is 80

      await service.checkViolations(speedingData);

      expect(alertsService.createAlert).toHaveBeenCalledWith(expect.objectContaining({
        type: AlertType.SPEED_VIOLATION,
        severity: AlertSeverity.MEDIUM,
      }));
    });

    it('should detect abnormal stop', async () => {
      // Mock timers
      jest.useFakeTimers();
      
      const stoppedData = { ...baseGpsData, speed: 0 };
      
      // First update - sets stop start time
      await service.checkViolations(stoppedData);
      expect(alertsService.createAlert).not.toHaveBeenCalled();

      // Advance time by 11 minutes (threshold is 10)
      jest.advanceTimersByTime(11 * 60 * 1000);

      // Second update - triggers alert
      await service.checkViolations(stoppedData);
      expect(alertsService.createAlert).toHaveBeenCalledWith(expect.objectContaining({
        type: AlertType.ABNORMAL_STOP,
      }));

      jest.useRealTimers();
    });

    it('should reset stop timer if vehicle moves', async () => {
      jest.useFakeTimers();
      const stoppedData = { ...baseGpsData, speed: 0 };
      const movingData = { ...baseGpsData, speed: 10 };

      await service.checkViolations(stoppedData);
      await service.checkViolations(movingData);
      
      jest.advanceTimersByTime(11 * 60 * 1000);
      await service.checkViolations(stoppedData); // Restarts timer
      
      expect(alertsService.createAlert).not.toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('should detect route deviation', async () => {
      const routeData = { ...baseGpsData, tripId: 't1' };
      
      // Mock trip with planned route
      jest.spyOn(tripRepo, 'findOne').mockResolvedValue({ 
        id: 't1', 
        plannedRoute: { type: 'LineString', coordinates: [] } 
      } as any);

      // Mock distance > threshold (500m)
      jest.spyOn(tripRepo, 'query').mockResolvedValue([{ distance: 600 }]);

      await service.checkViolations(routeData);

      expect(alertsService.createAlert).toHaveBeenCalledWith(expect.objectContaining({
        type: AlertType.ROUTE_DEVIATION,
      }));
    });

    it('should not alert if within cooldown', async () => {
      const speedingData = { ...baseGpsData, speed: 90 };

      await service.checkViolations(speedingData);
      await service.checkViolations(speedingData); // Second call immediately

      expect(alertsService.createAlert).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleTripStatusChanged', () => {
    it('should clear route cache and alert map for completed trips', () => {
      // Use internal maps to verify (private but accessible in JS/TS tests with any or cast)
      (service as any).routeCache.set('t1', {});
      (service as any).lastAlertMap.set('t1:SPEED', 123);

      service.handleTripStatusChanged({ id: 't1', status: TripStatus.COMPLETED });

      expect((service as any).routeCache.has('t1')).toBe(false);
      expect((service as any).lastAlertMap.has('t1:SPEED')).toBe(false);
    });
  });

  describe('cleanupStaleEntries', () => {
    it('should remove entries older than threshold', () => {
      const now = Date.now();
      const staleTime = now - (13 * 60 * 60 * 1000); // 13 hours (threshold is 12)
      
      (service as any).lastAlertMap.set('stale', staleTime);
      (service as any).lastAlertMap.set('fresh', now);

      (service as any).cleanupStaleEntries();

      expect((service as any).lastAlertMap.has('stale')).toBe(false);
      expect((service as any).lastAlertMap.has('fresh')).toBe(true);
    });
  });
});
