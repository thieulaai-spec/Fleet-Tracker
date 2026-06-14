import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { TripsService } from './trips.service';
import { Trip, TripStatus } from '../entities/trip.entity';
import { Driver, DriverStatus } from '../entities/driver.entity';
import { Vehicle, VehicleStatus } from '../entities/vehicle.entity';
import { Order, OrderStatus } from '../entities/order.entity';
import { TripOrder } from '../entities/trip-order.entity';
import { Alert } from '../entities/alert.entity';
import { OptimizationService } from '../optimization/optimization.service';

describe('TripsService', () => {
  let service: TripsService;
  let tripRepository: Repository<Trip>;
  let dataSource: DataSource;
  let eventEmitter: EventEmitter2;

  const mockTrip = {
    id: 'trip-1',
    status: TripStatus.PENDING,
    driverId: 'driver-1',
    vehicleId: 'vehicle-1',
    driver: { userId: 'user-1' },
    tripOrders: [{ order: { id: 'order-1', status: OrderStatus.PENDING } }],
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((entity, data) => ({ ...data })),
      save: jest.fn(),
      delete: jest.fn().mockResolvedValue(null),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
  };

  const mockTripRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    manager: {
      findOne: jest.fn().mockResolvedValue(null),
    },
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        {
          provide: getRepositoryToken(Trip),
          useValue: mockTripRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: getRepositoryToken(Alert),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: OptimizationService,
          useValue: {
            optimizeTripRoute: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    service = module.get<TripsService>(TripsService);
    tripRepository = module.get<Repository<Trip>>(getRepositoryToken(Trip));
    dataSource = module.get<DataSource>(DataSource);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all trips', async () => {
      mockTripRepository.find.mockResolvedValue([mockTrip]);
      const result = await service.findAll();
      expect(result).toEqual([mockTrip]);
      expect(mockTripRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a trip if found', async () => {
      mockTripRepository.findOne.mockResolvedValue(mockTrip);
      const result = await service.findOne('trip-1');
      expect(result).toEqual(mockTrip);
    });

    it('should throw NotFoundException if trip not found', async () => {
      mockTripRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('none')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update status successfully (PENDING -> ACCEPTED)', async () => {
      mockQueryRunner.manager.findOne.mockImplementation((entity, options) => {
        if (entity === Trip) return Promise.resolve(mockTrip);
        if (entity === Driver)
          return Promise.resolve({
            id: 'driver-1',
            status: DriverStatus.AVAILABLE,
          });
        if (entity === Vehicle)
          return Promise.resolve({
            id: 'vehicle-1',
            status: VehicleStatus.AVAILABLE,
          });
        return Promise.resolve(null);
      });
      mockQueryRunner.manager.save.mockImplementation((entity, data) =>
        Promise.resolve(data),
      );

      const result = await service.updateStatus(
        'trip-1',
        TripStatus.ACCEPTED,
        'user-1',
        'driver',
      );

      expect(result.status).toBe(TripStatus.ACCEPTED);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'trip.status_changed',
        expect.any(Object),
      );
    });

    it('should throw ForbiddenException if driver updates trip they do not own', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue(mockTrip);

      await expect(
        service.updateStatus(
          'trip-1',
          TripStatus.ACCEPTED,
          'other-user',
          'driver',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for invalid transition', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue({
        ...mockTrip,
        status: TripStatus.COMPLETED,
      });

      await expect(
        service.updateStatus('trip-1', TripStatus.ACCEPTED, 'user-1', 'admin'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should rollback on error', async () => {
      mockQueryRunner.manager.findOne.mockRejectedValue(new Error('DB Error'));

      await expect(
        service.updateStatus('trip-1', TripStatus.ACCEPTED, 'user-1', 'admin'),
      ).rejects.toThrow('DB Error');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should keep order status unchanged when status is IN_PROGRESS', async () => {
      const tripWithOrders = {
        ...mockTrip,
        status: TripStatus.ACCEPTED,
        tripOrders: [{ order: { id: 'o1', status: OrderStatus.PENDING } }],
      };

      mockQueryRunner.manager.findOne.mockResolvedValue(tripWithOrders);
      mockQueryRunner.manager.save.mockImplementation((entity, data) =>
        Promise.resolve(data),
      );

      const result = await service.updateStatus(
        'trip-1',
        TripStatus.IN_PROGRESS,
        'user-1',
        'driver',
      );

      expect(result.status).toBe(TripStatus.IN_PROGRESS);
      expect(tripWithOrders.tripOrders[0].order.status).toBe(
        OrderStatus.PENDING,
      );
    });

    it('should reset vehicle and driver when status is COMPLETED', async () => {
      const tripAccepted = { ...mockTrip, status: TripStatus.IN_PROGRESS };
      const driver = { id: 'd1', status: DriverStatus.ON_TRIP };
      const vehicle = {
        id: 'v1',
        status: VehicleStatus.DELIVERING,
        currentLoadKg: 100,
      };

      mockQueryRunner.manager.findOne.mockImplementation((entity) => {
        if (entity === Trip) return Promise.resolve(tripAccepted);
        if (entity === Driver) return Promise.resolve(driver);
        if (entity === Vehicle) return Promise.resolve(vehicle);
        return Promise.resolve(null);
      });

      await service.updateStatus(
        'trip-1',
        TripStatus.COMPLETED,
        'user-1',
        'driver',
      );

      expect(driver.status).toBe(DriverStatus.AVAILABLE);
      expect(vehicle.status).toBe(VehicleStatus.AVAILABLE);
      expect(vehicle.currentLoadKg).toBe(0);
    });

    it('should reset everything when status is CANCELLED and no active trip exists', async () => {
      const tripPending = { ...mockTrip, status: TripStatus.PENDING };
      const driver = { id: 'd1', status: DriverStatus.ON_TRIP };
      const vehicle = {
        id: 'v1',
        status: VehicleStatus.DELIVERING,
        currentLoadKg: 100,
      };

      mockQueryRunner.manager.findOne.mockImplementation((entity, criteria) => {
        if (entity === Trip) {
          if (criteria && criteria.where && criteria.where.status) {
            return Promise.resolve(null);
          }
          return Promise.resolve(tripPending);
        }
        if (entity === Driver) return Promise.resolve(driver);
        if (entity === Vehicle) return Promise.resolve(vehicle);
        return Promise.resolve(null);
      });
      mockQueryRunner.manager.find.mockResolvedValue(tripPending.tripOrders);

      await service.updateStatus(
        'trip-1',
        TripStatus.CANCELLED,
        'user-1',
        'admin',
      );

      expect(driver.status).toBe(DriverStatus.AVAILABLE);
      expect(vehicle.status).toBe(VehicleStatus.AVAILABLE);
      expect(tripPending.tripOrders[0].order.status).toBe(OrderStatus.PENDING);
    });

    it('should deduct load and preserve status if another active trip is running when CANCELLED', async () => {
      const tripPending = { ...mockTrip, status: TripStatus.PENDING };
      const driver = { id: 'd1', status: DriverStatus.ON_TRIP };
      const vehicle = {
        id: 'v1',
        status: VehicleStatus.DELIVERING,
        currentLoadKg: 100,
      };
      const activeRunningTrip = {
        id: 'active-trip-2',
        status: TripStatus.IN_PROGRESS,
      };

      mockQueryRunner.manager.findOne.mockImplementation((entity, criteria) => {
        if (entity === Trip) {
          if (criteria && criteria.where && criteria.where.status) {
            return Promise.resolve(activeRunningTrip);
          }
          return Promise.resolve(tripPending);
        }
        if (entity === Driver) return Promise.resolve(driver);
        if (entity === Vehicle) return Promise.resolve(vehicle);
        return Promise.resolve(null);
      });
      mockQueryRunner.manager.find.mockResolvedValue([
        {
          order: { id: 'order-1', weightKg: 30 },
        },
      ]);

      await service.updateStatus(
        'trip-1',
        TripStatus.CANCELLED,
        'user-1',
        'admin',
      );

      expect(driver.status).toBe(DriverStatus.ON_TRIP);
      expect(vehicle.status).toBe(VehicleStatus.DELIVERING);
      expect(vehicle.currentLoadKg).toBe(70);
    });

    it('should safely merge orders into running trip when status is ACCEPTED', async () => {
      const tripPending = { ...mockTrip, status: TripStatus.PENDING };
      const runningTrip = {
        id: 'running-trip-id',
        status: TripStatus.IN_PROGRESS,
        driverId: 'driver-1',
      };
      const pendingTripOrders = [
        {
          tripId: 'trip-1',
          orderId: 'o-new-1',
          sequence: 1,
          order: { id: 'o-new-1', status: OrderStatus.PENDING },
        },
      ];
      const runningTripOrders = [
        {
          tripId: 'running-trip-id',
          orderId: 'o-old-1',
          sequence: 1,
        },
      ];

      mockQueryRunner.manager.findOne.mockImplementation((entity, criteria) => {
        if (entity === Trip) {
          if (criteria && criteria.where && criteria.where.status) {
            return Promise.resolve(runningTrip);
          }
          return Promise.resolve(tripPending);
        }
        return Promise.resolve(null);
      });

      mockQueryRunner.manager.find.mockImplementation((entity, criteria) => {
        if (entity === TripOrder) {
          if (
            criteria &&
            criteria.where &&
            criteria.where.tripId === 'trip-1'
          ) {
            return Promise.resolve(pendingTripOrders);
          }
          if (
            criteria &&
            criteria.where &&
            criteria.where.tripId === 'running-trip-id'
          ) {
            return Promise.resolve(runningTripOrders);
          }
        }
        return Promise.resolve([]);
      });

      const result = await service.updateStatus(
        'trip-1',
        TripStatus.ACCEPTED,
        'user-1',
        'driver',
      );

      expect(result.id).toBe('running-trip-id');
      expect(mockQueryRunner.manager.delete).toHaveBeenCalledWith(Trip, {
        id: 'trip-1',
      });
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if trip not found during updateStatus', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue(null);
      await expect(
        service.updateStatus('none', TripStatus.ACCEPTED, 'user-1', 'admin'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
