import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, In } from 'typeorm';
import { DispatchService } from './dispatch.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Order, OrderStatus } from '../entities/order.entity';
import { Vehicle, VehicleStatus } from '../entities/vehicle.entity';
import { Trip } from '../entities/trip.entity';
import { DriverStatus } from '../entities/driver.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('DispatchService', () => {
  let service: DispatchService;
  let orderRepo: any;
  let vehicleRepo: any;
  let tripRepo: any;
  let mockDataSource: any;
  let mockQueryRunner: any;

  beforeEach(async () => {
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn(),
        find: jest.fn(),
        create: jest
          .fn()
          .mockImplementation((entity, data) => ({ id: 'new-id', ...data })),
        save: jest
          .fn()
          .mockImplementation((entity, data) => Promise.resolve(data)),
      },
    };

    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    orderRepo = {
      findOneBy: jest.fn(),
      find: jest.fn(),
    };

    vehicleRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        getRawAndEntities: jest.fn().mockResolvedValue({ entities: [], raw: [] }),
      }),
    };

    tripRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DispatchService,
        {
          provide: getRepositoryToken(Order),
          useValue: orderRepo,
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
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<DispatchService>(DispatchService);
  });

  describe('suggestVehicles', () => {
    it('should throw NotFoundException if order not found', async () => {
      orderRepo.findOneBy.mockResolvedValue(null);
      await expect(service.suggestVehicles('o1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if order is not pending', async () => {
      orderRepo.findOneBy.mockResolvedValue({
        id: 'o1',
        status: OrderStatus.ASSIGNED,
      });
      await expect(service.suggestVehicles('o1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return suggested vehicles', async () => {
      orderRepo.findOneBy.mockResolvedValue({
        id: 'o1',
        status: OrderStatus.PENDING,
        weightKg: 100,
        pickupLocation: { type: 'Point', coordinates: [106.6, 10.7] },
      });
      const mockVehicles = [{ id: 'v1', plateNumber: '51G-12345', type: 'TRUCK' }];
      const mockRaw = [{ v_id: 'v1', distance: 5000 }];
      
      vehicleRepo.createQueryBuilder().getRawAndEntities.mockResolvedValue({
        entities: mockVehicles,
        raw: mockRaw
      });

      const result = await service.suggestVehicles('o1');

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].vehicle.id).toBe('v1');
      expect(vehicleRepo.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('assignOrder', () => {
    it('should successfully assign a single order', async () => {
      const mockOrder = {
        id: 'o1',
        status: OrderStatus.PENDING,
        weightKg: 100,
      };
      const mockVehicle = {
        id: 'v1',
        status: VehicleStatus.AVAILABLE,
        driverId: 'd1',
        driver: { id: 'd1', status: DriverStatus.AVAILABLE },
        maxCapacityKg: 1000,
        currentLoadKg: 0,
      };

      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(mockVehicle);

      const result = await service.assignOrder('o1', 'v1');

      expect(mockQueryRunner.manager.save).toHaveBeenCalledTimes(4); // Trip, TripOrder, Order, Vehicle
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should rollback if something fails', async () => {
      mockQueryRunner.manager.findOne.mockRejectedValue(new Error('DB Error'));
      await expect(service.assignOrder('o1', 'v1')).rejects.toThrow('DB Error');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('assignBulkOrders', () => {
    it('should successfully assign multiple orders to a vehicle and deduplicate IDs', async () => {
      const orderIds = ['o1', 'o2', 'o1']; // Duplicate o1
      const vehicleId = 'v1';

      const mockVehicle = {
        id: 'v1',
        status: VehicleStatus.AVAILABLE,
        driverId: 'd1',
        driver: { status: DriverStatus.AVAILABLE },
        maxCapacityKg: 1000,
        currentLoadKg: 0,
      };

      const mockOrders = [
        { id: 'o1', status: OrderStatus.PENDING, weightKg: 100 },
        { id: 'o2', status: OrderStatus.PENDING, weightKg: 200 },
      ];

      mockQueryRunner.manager.findOne.mockResolvedValue(mockVehicle);
      mockQueryRunner.manager.find.mockResolvedValue(mockOrders);

      const result = await service.assignBulkOrders(orderIds, vehicleId);

      expect(mockQueryRunner.manager.find).toHaveBeenCalledWith(
        Order,
        expect.objectContaining({
          where: { id: In(['o1', 'o2']) },
        }),
      );
      expect(mockQueryRunner.manager.save).toHaveBeenCalledTimes(4);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('clusterOrders', () => {
    it('should return empty array if no pending orders', async () => {
      orderRepo.find.mockResolvedValue([]);
      const result = await service.clusterOrders();
      expect(result).toEqual([]);
    });

    it('should group orders into clusters based on distance', async () => {
      const o1 = {
        id: 'o1',
        pickupAddress: 'A',
        weightKg: 10,
        pickupLocation: { coordinates: [106.0, 10.0] },
      };
      const o2 = {
        id: 'o2',
        pickupAddress: 'B',
        weightKg: 20,
        pickupLocation: { coordinates: [106.01, 10.01] }, // Close to A
      };
      const o3 = {
        id: 'o3',
        pickupAddress: 'C',
        weightKg: 30,
        pickupLocation: { coordinates: [107.0, 11.0] }, // Far from A
      };

      orderRepo.find.mockResolvedValue([o1, o2, o3]);

      const result = await service.clusterOrders();

      expect(result.length).toBe(2);
      expect(result[0].orders.length).toBe(2); // o1, o2
      expect(result[1].orders.length).toBe(1); // o3
    });
  });
});
