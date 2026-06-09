import { Test, TestingModule } from '@nestjs/testing';
import { AlertsService } from './alerts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Alert, AlertType, AlertSeverity } from '../entities/alert.entity';
import { Trip } from '../entities/trip.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository, DataSource } from 'typeorm';

describe('AlertsService', () => {
  let service: AlertsService;
  let alertRepo: Repository<Alert>;
  let tripRepo: Repository<Trip>;
  let eventEmitter: EventEmitter2;
  let dataSource: DataSource;

  const mockAlert = {
    id: 'a1',
    tripId: 't1',
    vehicleId: 'v1',
    driverId: 'd1',
    type: AlertType.SPEED_VIOLATION,
    severity: AlertSeverity.MEDIUM,
    message: 'Speeding detected',
    location: { type: 'Point', coordinates: [106.0, 10.0] },
    isResolved: false,
    createdAt: new Date(),
  };

  const mockTrip = {
    id: 't1',
    driverId: 'd1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        {
          provide: getRepositoryToken(Alert),
          useValue: {
            create: jest.fn().mockReturnValue(mockAlert),
            save: jest.fn().mockResolvedValue(mockAlert),
            findOne: jest.fn(),
            update: jest.fn().mockResolvedValue({ affected: 1 }),
            find: jest.fn().mockResolvedValue([mockAlert]),
            createQueryBuilder: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              groupBy: jest.fn().mockReturnThis(),
              getRawMany: jest
                .fn()
                .mockResolvedValue([{ type: 'SPEED_VIOLATION', count: '1' }]),
            }),
          },
        },
        {
          provide: getRepositoryToken(Trip),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockTrip),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            getRepository: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
    alertRepo = module.get<Repository<Alert>>(getRepositoryToken(Alert));
    tripRepo = module.get<Repository<Trip>>(getRepositoryToken(Trip));
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAlert', () => {
    it('should create and save an alert with trip and driver info', async () => {
      const dto = {
        tripId: 't1',
        vehicleId: 'v1',
        type: AlertType.SPEED_VIOLATION,
        severity: AlertSeverity.MEDIUM,
        message: 'Speeding detected',
        location: { type: 'Point' as any, coordinates: [106.0, 10.0] },
      };

      const result = await service.createAlert(dto);

      expect(tripRepo.findOne).toHaveBeenCalledWith({ where: { id: 't1' } });
      expect(alertRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          driverId: 'd1',
          isResolved: false,
        }),
      );
      expect(alertRepo.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('alert.new', mockAlert);
      expect(result).toEqual(mockAlert);
    });

    it('should create an alert without trip info if tripId not provided', async () => {
      const dto = {
        vehicleId: 'v1',
        type: AlertType.SPEED_VIOLATION,
        severity: AlertSeverity.MEDIUM,
        message: 'No trip',
      };

      await service.createAlert(dto);

      expect(tripRepo.findOne).not.toHaveBeenCalled();
      expect(alertRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tripId: undefined,
          driverId: undefined,
        }),
      );
    });
  });

  describe('resolveAlert', () => {
    it('should resolve an existing alert', async () => {
      jest
        .spyOn(alertRepo, 'findOne')
        .mockResolvedValueOnce(mockAlert as any) // Check existence
        .mockResolvedValueOnce({ ...mockAlert, isResolved: true } as any); // Return after update

      const result = await service.resolveAlert('a1');

      expect(alertRepo.update).toHaveBeenCalledWith(
        'a1',
        expect.objectContaining({
          isResolved: true,
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'alert.resolved',
        expect.objectContaining({ isResolved: true }),
      );
      expect(result?.isResolved).toBe(true);
    });

    it('should return null if alert not found', async () => {
      jest.spyOn(alertRepo, 'findOne').mockResolvedValue(null);

      const result = await service.resolveAlert('non-existent');

      expect(result).toBeNull();
      expect(alertRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('getActiveAlerts', () => {
    it('should return all unresolved alerts', async () => {
      const result = await service.getActiveAlerts();

      expect(alertRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isResolved: false },
        }),
      );
      expect(result).toEqual([mockAlert]);
    });
  });

  describe('getAlertStats', () => {
    it('should return alert counts grouped by type', async () => {
      const result = await service.getAlertStats();

      expect(alertRepo.createQueryBuilder).toHaveBeenCalled();
      expect(result).toEqual([{ type: 'SPEED_VIOLATION', count: '1' }]);
    });
  });

  describe('checkOverdueOrders', () => {
    it('should retry on connection error and eventually succeed', async () => {
      const mockOrderRepo = {
        createQueryBuilder: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]),
        }),
      };

      let callCount = 0;
      jest.spyOn(dataSource, 'getRepository').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error(
            'terminating connection due to administrator command',
          );
        }
        return mockOrderRepo as any;
      });

      jest.useFakeTimers();
      const checkPromise = service.checkOverdueOrders();

      await jest.runAllTimersAsync();
      await checkPromise;

      expect(callCount).toBe(3);
      jest.useRealTimers();
    });

    it('should throw error if retries exhausted', async () => {
      jest.spyOn(dataSource, 'getRepository').mockImplementation(() => {
        throw new Error('terminating connection due to administrator command');
      });

      jest.useFakeTimers();
      const checkPromise = expect(service.checkOverdueOrders()).rejects.toThrow(
        'terminating connection due to administrator command',
      );
      await jest.runAllTimersAsync();
      await checkPromise;
      jest.useRealTimers();
    });
  });
});
