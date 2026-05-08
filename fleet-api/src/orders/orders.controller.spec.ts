import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OrderStatus } from '../entities/order.entity';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: OrdersService;

  const mockOrder = {
    id: 'o1',
    status: OrderStatus.PENDING,
  };

  const mockOrdersService = {
    create: jest.fn().mockResolvedValue(mockOrder),
    findAll: jest.fn().mockResolvedValue({ data: [mockOrder], total: 1 }),
    findPending: jest.fn().mockResolvedValue([mockOrder]),
    findOne: jest.fn().mockResolvedValue(mockOrder),
    update: jest.fn().mockResolvedValue(mockOrder),
    updateStatus: jest.fn().mockResolvedValue(mockOrder),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an order', async () => {
      const dto = { customerName: 'Test' } as any;
      expect(await controller.create(dto)).toEqual(mockOrder);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all orders', async () => {
      const query = { page: 1, limit: 10 };
      expect(await controller.findAll(query as any)).toEqual({
        data: [mockOrder],
        total: 1,
      });
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findPending', () => {
    it('should return pending orders', async () => {
      expect(await controller.findPending()).toEqual([mockOrder]);
      expect(service.findPending).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an order by id', async () => {
      expect(await controller.findOne('o1')).toEqual(mockOrder);
      expect(service.findOne).toHaveBeenCalledWith('o1');
    });
  });

  describe('update', () => {
    it('should update an order', async () => {
      const dto = { customerName: 'Updated' } as any;
      expect(await controller.update('o1', dto)).toEqual(mockOrder);
      expect(service.update).toHaveBeenCalledWith('o1', dto);
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const dto = { status: OrderStatus.ASSIGNED };
      expect(await controller.updateStatus('o1', dto)).toEqual(mockOrder);
      expect(service.updateStatus).toHaveBeenCalledWith(
        'o1',
        OrderStatus.ASSIGNED,
      );
    });
  });

  describe('remove', () => {
    it('should remove an order', async () => {
      expect(await controller.remove('o1')).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith('o1');
    });
  });
});
