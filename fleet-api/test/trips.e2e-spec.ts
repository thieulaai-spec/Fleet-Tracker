import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TripsController } from '../src/trips/trips.controller';
import { TripsService } from '../src/trips/trips.service';
import { TripStatus } from '../src/entities/trip.entity';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { UserRole } from '../src/entities/user.entity';

describe('TripsController (e2e)', () => {
  let app: INestApplication;
  const mockUser = { id: 'admin-id', role: UserRole.ADMIN };

  const mockTrip = {
    id: 'trip-1',
    status: TripStatus.PENDING,
    vehicle: { id: 'v1', plateNumber: '51A-111' },
    driver: { id: 'd1', fullName: 'Driver 1' },
    tripOrders: [],
  };

  const mockTripsService = {
    findAll: jest.fn().mockResolvedValue([mockTrip]),
    findOne: jest.fn().mockResolvedValue(mockTrip),
    updateStatus: jest.fn().mockResolvedValue({ ...mockTrip, status: TripStatus.ACCEPTED }),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TripsController],
      providers: [{ provide: TripsService, useValue: mockTripsService }],
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

  it('GET /trips - should return all trips', async () => {
    const res = await request(app.getHttpServer()).get('/trips').expect(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body).toHaveLength(1);
  });

  it('GET /trips/:id - should return trip details', async () => {
    const res = await request(app.getHttpServer()).get('/trips/trip-1').expect(200);
    expect(res.body.id).toBe('trip-1');
  });

  it('PATCH /trips/:id/status - should update trip status', async () => {
    const res = await request(app.getHttpServer())
      .patch('/trips/trip-1/status')
      .send({ status: TripStatus.ACCEPTED })
      .expect(200);
    expect(res.body.status).toBe(TripStatus.ACCEPTED);
  });

  it('PATCH /trips/:id/status - should reject invalid status', async () => {
    await request(app.getHttpServer())
      .patch('/trips/trip-1/status')
      .send({ status: 'invalid_status' })
      .expect(400);
  });
});
