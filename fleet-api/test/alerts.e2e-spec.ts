import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AlertsController } from '../src/alerts/alerts.controller';
import { AlertsService } from '../src/alerts/alerts.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { UserRole } from '../src/entities/user.entity';

describe('AlertsController (e2e)', () => {
  let app: INestApplication;

  const mockAlertsService = {
    getActiveAlerts: jest.fn().mockResolvedValue([
      { id: 'a1', type: 'speed_violation', severity: 'high', resolved: false },
    ]),
    resolveAlert: jest.fn().mockResolvedValue({ id: 'a1', resolved: true }),
    getAlertStats: jest.fn().mockResolvedValue({ total: 10, active: 2, resolved: 8 }),
    createAlert: jest.fn().mockResolvedValue({ id: 'a3', type: 'incident' }),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AlertsController],
      providers: [{ provide: AlertsService, useValue: mockAlertsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: (ctx: any) => { ctx.switchToHttp().getRequest().user = { id: 'u1', role: UserRole.ADMIN }; return true; } })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterEach(async () => { await app.close(); });

  it('GET /alerts/active - should return active alerts', async () => {
    const res = await request(app.getHttpServer()).get('/alerts/active').expect(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  it('PUT /alerts/:id/resolve - should resolve alert', async () => {
    const res = await request(app.getHttpServer()).put('/alerts/a1/resolve').expect(200);
    expect(res.body.resolved).toBe(true);
  });

  it('GET /alerts/stats - should return alert statistics', async () => {
    const res = await request(app.getHttpServer()).get('/alerts/stats').expect(200);
    expect(res.body.total).toBe(10);
  });

  it('POST /alerts/report-incident - should create incident alert', async () => {
    const res = await request(app.getHttpServer())
      .post('/alerts/report-incident')
      .send({
        vehicleId: '550e8400-e29b-41d4-a716-446655440001',
        tripId: '550e8400-e29b-41d4-a716-446655440002',
        message: 'Flat tire on highway',
      })
      .expect(201);
    expect(res.body.id).toBe('a3');
  });

  it('POST /alerts/report-incident - should reject missing fields', async () => {
    await request(app.getHttpServer())
      .post('/alerts/report-incident')
      .send({ vehicleId: 'not-a-uuid' })
      .expect(400);
  });
});
