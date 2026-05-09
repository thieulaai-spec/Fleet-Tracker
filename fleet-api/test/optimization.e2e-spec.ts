import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { OptimizationController } from '../src/optimization/optimization.controller';
import { OptimizationService } from '../src/optimization/optimization.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { UserRole } from '../src/entities/user.entity';

describe('OptimizationController (e2e)', () => {
  let app: INestApplication;

  const mockOptimizationService = {
    estimateETA: jest.fn().mockResolvedValue({ eta: '15 minutes', distanceKm: 5.2 }),
    optimizeTripRoute: jest.fn().mockResolvedValue({ optimized: true, savedKm: 3.5 }),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OptimizationController],
      providers: [{ provide: OptimizationService, useValue: mockOptimizationService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: (ctx: any) => { ctx.switchToHttp().getRequest().user = { id: 'u1', role: UserRole.ADMIN }; return true; } })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterEach(async () => { await app.close(); });

  it('GET /optimization/trip/:id/eta - should return ETA estimate', async () => {
    const res = await request(app.getHttpServer())
      .get('/optimization/trip/trip-1/eta?lat=10.762&lng=106.660')
      .expect(200);
    expect(res.body.eta).toBe('15 minutes');
    expect(mockOptimizationService.estimateETA).toHaveBeenCalled();
  });

  it('POST /optimization/trip/:id/optimize - should optimize route', async () => {
    const res = await request(app.getHttpServer())
      .post('/optimization/trip/trip-1/optimize')
      .expect(201);
    expect(res.body.optimized).toBe(true);
    expect(mockOptimizationService.optimizeTripRoute).toHaveBeenCalledWith('trip-1');
  });
});
