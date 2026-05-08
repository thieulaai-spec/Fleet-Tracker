import { Test, TestingModule } from '@nestjs/testing';
import { OptimizationController } from './optimization.controller';
import { OptimizationService } from './optimization.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('OptimizationController', () => {
  let controller: OptimizationController;
  let service: OptimizationService;

  const mockOptimizationService = {
    estimateETA: jest.fn().mockResolvedValue({ eta: '10 mins' }),
    optimizeTripRoute: jest.fn().mockResolvedValue({ optimized: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OptimizationController],
      providers: [
        {
          provide: OptimizationService,
          useValue: mockOptimizationService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OptimizationController>(OptimizationController);
    service = module.get<OptimizationService>(OptimizationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTripETA', () => {
    it('should return trip ETA', async () => {
      const location = { lat: 10.1, lng: 106.1 };
      expect(await controller.getTripETA('t1', location)).toEqual({
        eta: '10 mins',
      });
      expect(service.estimateETA).toHaveBeenCalledWith('t1', location);
    });
  });

  describe('optimizeTrip', () => {
    it('should call optimizeTripRoute', async () => {
      expect(await controller.optimizeTrip('t1')).toEqual({ optimized: true });
      expect(service.optimizeTripRoute).toHaveBeenCalledWith('t1');
    });
  });
});
