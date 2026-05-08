import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, In } from 'typeorm';
import { DispatchService } from './dispatch.service';
import { Order, OrderStatus } from '../entities/order.entity';
import { Vehicle, VehicleStatus } from '../entities/vehicle.entity';
import { Trip } from '../entities/trip.entity';
import { DriverStatus } from '../entities/driver.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('DispatchService', () => {
  let service: DispatchService;
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
        create: jest.fn(),
        save: jest.fn(),
      },
    };

    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DispatchService,
        {
          provide: getRepositoryToken(Order),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Vehicle),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Trip),
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<DispatchService>(DispatchService);
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
      mockQueryRunner.manager.create.mockImplementation((entity, data) => ({ id: 'new-id', ...data }));
      mockQueryRunner.manager.save.mockImplementation((entity, data) => Promise.resolve(data));

      const result = await service.assignBulkOrders(orderIds, vehicleId);

      // Verify deduplication: uniqueOrderIds should be ['o1', 'o2']
      expect(mockQueryRunner.manager.find).toHaveBeenCalledWith(Order, expect.objectContaining({
        where: { id: In(['o1', 'o2']) },
        lock: { mode: 'pessimistic_write' },
      }));

      // Verify batch saves
      // 1. Save Trip
      // 2. Save TripOrders (array)
      // 3. Save Orders (array)
      // 4. Save Vehicle
      expect(mockQueryRunner.manager.save).toHaveBeenCalledTimes(4);
      
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if some orders are missing', async () => {
      const orderIds = ['o1', 'o2'];
      const vehicleId = 'v1';

      mockQueryRunner.manager.findOne.mockResolvedValue({ 
        status: VehicleStatus.AVAILABLE, 
        driver: { status: DriverStatus.AVAILABLE },
        maxCapacityKg: 1000,
        currentLoadKg: 0
      });
      mockQueryRunner.manager.find.mockResolvedValue([{ id: 'o1' }]); // Only o1 found

      await expect(service.assignBulkOrders(orderIds, vehicleId)).rejects.toThrow(NotFoundException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if vehicle capacity is exceeded', async () => {
      const orderIds = ['o1'];
      const vehicleId = 'v1';

      const mockVehicle = {
        id: 'v1',
        status: VehicleStatus.AVAILABLE,
        driver: { status: DriverStatus.AVAILABLE },
        maxCapacityKg: 50,
        currentLoadKg: 0,
      };

      const mockOrders = [
        { id: 'o1', status: OrderStatus.PENDING, weightKg: 100 }, // Over capacity
      ];

      mockQueryRunner.manager.findOne.mockResolvedValue(mockVehicle);
      mockQueryRunner.manager.find.mockResolvedValue(mockOrders);

      await expect(service.assignBulkOrders(orderIds, vehicleId)).rejects.toThrow(BadRequestException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });
});
