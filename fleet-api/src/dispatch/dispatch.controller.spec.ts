import { Test, TestingModule } from '@nestjs/testing';
import { DispatchController } from './dispatch.controller';
import { DispatchService } from './dispatch.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('DispatchController', () => {
  let controller: DispatchController;
  let service: DispatchService;

  const mockDispatchService = {
    suggestVehicles: jest.fn(),
    assignOrder: jest.fn(),
    assignBulkOrders: jest.fn(),
    clusterOrders: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DispatchController],
      providers: [
        {
          provide: DispatchService,
          useValue: mockDispatchService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DispatchController>(DispatchController);
    service = module.get<DispatchService>(DispatchService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('suggestVehicles', () => {
    it('should call service.suggestVehicles', async () => {
      await controller.suggestVehicles('o1');
      expect(service.suggestVehicles).toHaveBeenCalledWith('o1');
    });
  });

  describe('assignOrder', () => {
    it('should call service.assignOrder', async () => {
      const dto = { orderId: 'o1', vehicleId: 'v1' };
      await controller.assignOrder(dto);
      expect(service.assignOrder).toHaveBeenCalledWith('o1', 'v1');
    });
  });

  describe('assignBulkOrders', () => {
    it('should call service.assignBulkOrders', async () => {
      const dto = { orderIds: ['o1', 'o2'], vehicleId: 'v1' };
      await controller.assignBulkOrders(dto);
      expect(service.assignBulkOrders).toHaveBeenCalledWith(['o1', 'o2'], 'v1');
    });
  });

  describe('clusterOrders', () => {
    it('should call service.clusterOrders', async () => {
      await controller.clusterOrders();
      expect(service.clusterOrders).toHaveBeenCalled();
    });
  });
});
