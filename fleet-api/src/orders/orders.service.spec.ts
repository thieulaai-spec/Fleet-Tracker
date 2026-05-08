import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from '../entities/order.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let repository: Repository<Order>;

  const mockOrder = {
    id: 'order-1',
    pickupAddress: 'Address A',
    deliveryAddress: 'Address B',
    status: OrderStatus.PENDING,
    pickupLocation: { type: 'Point', coordinates: [106, 10] },
    deliveryLocation: { type: 'Point', coordinates: [107, 11] },
  } as Order;

  const mockRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest
      .fn()
      .mockImplementation((order) =>
        Promise.resolve({ id: 'order-1', ...order }),
      ),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockOrder], 1]),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    repository = module.get<Repository<Order>>(getRepositoryToken(Order));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an order successfully', async () => {
      const createOrderDto = {
        pickupLat: 10,
        pickupLng: 106,
        deliveryLat: 11,
        deliveryLng: 107,
        pickupAddress: 'Address A',
        deliveryAddress: 'Address B',
        weightKg: 100,
      };

      const result = await service.create(createOrderDto);

      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(result.pickupLocation).toEqual({
        type: 'Point',
        coordinates: [106, 10],
      });
      expect(result.deliveryLocation).toEqual({
        type: 'Point',
        coordinates: [107, 11],
      });
    });

    it('should throw BadRequestException if pickup and delivery address are the same', async () => {
      const createOrderDto = {
        pickupAddress: 'Same Address',
        deliveryAddress: 'Same Address',
        pickupLat: 10,
        pickupLng: 106,
        deliveryLat: 11,
        deliveryLng: 107,
      };

      await expect(service.create(createOrderDto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated orders', async () => {
      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual([mockOrder]);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should apply status filter if provided', async () => {
      const queryBuilder = mockRepository.createQueryBuilder();
      await service.findAll({ status: OrderStatus.PENDING });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('order.status = :status'),
        { status: OrderStatus.PENDING },
      );
    });
  });

  describe('findOne', () => {
    it('should return an order if found', async () => {
      mockRepository.findOne.mockResolvedValue(mockOrder);
      const result = await service.findOne('order-1');
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an order in PENDING status', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockOrder });

      const updateDto = { pickupAddress: 'New Address' };
      const result = await service.update('order-1', updateDto);

      expect(result.pickupAddress).toBe('New Address');
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if order status is not PENDING', async () => {
      mockRepository.findOne.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.ASSIGNED,
      });
      await expect(service.update('order-1', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update location if lat/lng are provided', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockOrder });
      const updateDto = { pickupLat: 12, pickupLng: 108 };
      const result = await service.update('order-1', updateDto);
      expect(result.pickupLocation.coordinates).toEqual([108, 12]);
    });
  });

  describe('updateStatus', () => {
    it('should allow valid transition PENDING -> ASSIGNED', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockOrder });
      const result = await service.updateStatus(
        'order-1',
        OrderStatus.ASSIGNED,
      );
      expect(result.status).toBe(OrderStatus.ASSIGNED);
    });

    it('should throw BadRequestException for invalid transition PENDING -> DELIVERING', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockOrder });
      await expect(
        service.updateStatus('order-1', OrderStatus.DELIVERING),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should remove order if in PENDING status', async () => {
      mockRepository.findOne.mockResolvedValue(mockOrder);
      await service.remove('order-1');
      expect(repository.remove).toHaveBeenCalledWith(mockOrder);
    });

    it('should throw BadRequestException if not in PENDING status', async () => {
      mockRepository.findOne.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PICKED_UP,
      });
      await expect(service.remove('order-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
