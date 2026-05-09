import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TrackingController } from '../src/tracking/tracking.controller';
import { TrackingService } from '../src/tracking/tracking.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { UserRole } from '../src/entities/user.entity';

describe('TrackingController (e2e)', () => {
  let app: INestApplication;

  const mockUser = { id: 'admin-id', role: UserRole.ADMIN };

  const mockLocations = [
    { vehicleId: 'v1', lat: 10.762, lng: 106.660, speed: 40, timestamp: new Date() },
    { vehicleId: 'v2', lat: 10.823, lng: 106.629, speed: 60, timestamp: new Date() },
  ];

  const mockHistory = [
    { id: '1', lat: 10.762, lng: 106.660, speed: 40, recordedAt: new Date() },
    { id: '2', lat: 10.770, lng: 106.665, speed: 50, recordedAt: new Date() },
  ];

  const mockTrackingService = {
    getAllLiveLocations: jest.fn().mockResolvedValue(mockLocations),
    getVehicleHistory: jest.fn().mockResolvedValue(mockHistory),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TrackingController],
      providers: [
        { provide: TrackingService, useValue: mockTrackingService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: any) => {
          ctx.switchToHttp().getRequest().user = mockUser;
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /tracking/live', () => {
    it('should return live locations of all vehicles', async () => {
      const response = await request(app.getHttpServer())
        .get('/tracking/live')
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body).toHaveLength(2);
      expect(mockTrackingService.getAllLiveLocations).toHaveBeenCalled();
    });
  });

  describe('GET /tracking/vehicle/:id/history', () => {
    it('should return vehicle GPS history', async () => {
      const response = await request(app.getHttpServer())
        .get('/tracking/vehicle/v1/history?from=2026-01-01&to=2026-01-31')
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(mockTrackingService.getVehicleHistory).toHaveBeenCalledWith(
        'v1',
        expect.any(Date),
        expect.any(Date),
      );
    });

    it('should handle missing date params', async () => {
      await request(app.getHttpServer())
        .get('/tracking/vehicle/v1/history')
        .expect(200);

      expect(mockTrackingService.getVehicleHistory).toHaveBeenCalledWith(
        'v1',
        undefined,
        undefined,
      );
    });
  });
});
