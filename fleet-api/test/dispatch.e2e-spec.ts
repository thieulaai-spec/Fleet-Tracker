import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DispatchController } from '../src/dispatch/dispatch.controller';
import { DispatchService } from '../src/dispatch/dispatch.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { UserRole } from '../src/entities/user.entity';

describe('DispatchController (e2e)', () => {
  let app: INestApplication;
  const mockUser = { id: 'admin-id', role: UserRole.ADMIN };

  // Use real UUIDs for validation
  const orderId = '550e8400-e29b-41d4-a716-446655440001';
  const vehicleId = '550e8400-e29b-41d4-a716-446655440002';
  const orderId2 = '550e8400-e29b-41d4-a716-446655440003';

  const mockDispatchService = {
    suggestVehicles: jest.fn().mockResolvedValue([{ vehicleId, distance: 2.5 }]),
    assignOrder: jest.fn().mockResolvedValue({ id: 'trip-1', status: 'pending' }),
    assignBulkOrders: jest.fn().mockResolvedValue({ id: 'trip-2', status: 'pending' }),
    clusterOrders: jest.fn().mockResolvedValue([{ clusterId: 0, orders: [orderId] }]),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [DispatchController],
      providers: [{ provide: DispatchService, useValue: mockDispatchService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: (ctx: any) => { ctx.switchToHttp().getRequest().user = mockUser; return true; } })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterEach(async () => { await app.close(); });

  it('GET /dispatch/suggest/:orderId - should return suggestions', async () => {
    const res = await request(app.getHttpServer()).get(`/dispatch/suggest/${orderId}`).expect(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  it('POST /dispatch/assign - should assign order', async () => {
    const res = await request(app.getHttpServer())
      .post('/dispatch/assign').send({ orderId, vehicleId }).expect(201);
    expect(res.body.id).toBe('trip-1');
  });

  it('POST /dispatch/assign - should reject invalid UUID', async () => {
    await request(app.getHttpServer())
      .post('/dispatch/assign').send({ orderId: 'invalid', vehicleId: 'also-invalid' }).expect(400);
  });

  it('POST /dispatch/bulk-assign - should bulk assign', async () => {
    const res = await request(app.getHttpServer())
      .post('/dispatch/bulk-assign').send({ orderIds: [orderId, orderId2], vehicleId }).expect(201);
    expect(res.body.id).toBe('trip-2');
  });

  it('POST /dispatch/cluster - should cluster orders', async () => {
    const res = await request(app.getHttpServer()).post('/dispatch/cluster').expect(201);
    expect(Array.isArray(res.body)).toBeTruthy();
  });
});
