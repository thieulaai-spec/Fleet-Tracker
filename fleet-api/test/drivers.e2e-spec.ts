import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DriversController } from '../src/drivers/drivers.controller';
import { DriversService } from '../src/drivers/drivers.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { UserRole } from '../src/entities/user.entity';

describe('DriversController (e2e)', () => {
  let app: INestApplication;
  const mockUser = { id: 'admin-id', role: UserRole.ADMIN };

  const mockDriver = {
    id: 'driver-1',
    fullName: 'Nguyen Van A',
    phone: '0901234567',
    status: 'available',
  };

  const mockDriversService = {
    create: jest.fn().mockResolvedValue(mockDriver),
    findAll: jest.fn().mockResolvedValue({ data: [mockDriver], total: 1, page: 1, limit: 10, totalPages: 1 }),
    findOne: jest.fn().mockResolvedValue(mockDriver),
    update: jest.fn().mockResolvedValue(mockDriver),
    getKpi: jest.fn().mockResolvedValue({ tripsCompleted: 10, averageRating: 4.5 }),
    getTrips: jest.fn().mockResolvedValue([]),
    getViolations: jest.fn().mockResolvedValue([]),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [DriversController],
      providers: [{ provide: DriversService, useValue: mockDriversService }],
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

  it('GET /drivers - should return paginated list', async () => {
    const res = await request(app.getHttpServer()).get('/drivers').expect(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveLength(1);
  });

  it('GET /drivers/:id - should return driver', async () => {
    const res = await request(app.getHttpServer()).get('/drivers/driver-1').expect(200);
    expect(res.body.fullName).toBe('Nguyen Van A');
  });

  it('GET /drivers/:id/kpi - should return KPI', async () => {
    const res = await request(app.getHttpServer()).get('/drivers/driver-1/kpi').expect(200);
    expect(res.body.tripsCompleted).toBe(10);
  });

  it('GET /drivers/:id/trips - should return trips', async () => {
    const res = await request(app.getHttpServer()).get('/drivers/driver-1/trips').expect(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  it('GET /drivers/:id/violations - should return violations', async () => {
    await request(app.getHttpServer()).get('/drivers/driver-1/violations').expect(200);
  });

  it('DELETE /drivers/:id - should delete driver', async () => {
    await request(app.getHttpServer()).delete('/drivers/driver-1').expect(200);
    expect(mockDriversService.remove).toHaveBeenCalledWith('driver-1');
  });
});
