import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Vehicle } from '../src/entities/vehicle.entity';
import { VehiclesModule } from '../src/vehicles/vehicles.module';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { UserRole } from '../src/entities/user.entity';

import { ConfigService } from '@nestjs/config';
import { UploadService } from '../src/upload/upload.service';

describe('VehiclesController (e2e)', () => {
  let app: INestApplication<App>;
  let mockVehicleRepository: any;

  const mockUser = {
    id: 'admin-id',
    role: UserRole.ADMIN,
  };

  beforeEach(async () => {
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    mockVehicleRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [VehiclesModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn().mockImplementation((key) => {
          if (key === 'SUPABASE_URL') return 'http://mock.url';
          if (key === 'SUPABASE_ANON_KEY') return 'mock-key';
          return null;
        }),
      })
      .overrideProvider(UploadService)
      .useValue({
        uploadFile: jest.fn().mockResolvedValue('http://mock.url/image.png'),
      })
      .overrideProvider(getRepositoryToken(Vehicle))
      .useValue(mockVehicleRepository)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockUser;
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /vehicles/available', () => {
    it('should return 200 OK and available vehicles', async () => {
      mockVehicleRepository.createQueryBuilder().getMany.mockResolvedValue([
        { id: 'v1', status: 'available' },
      ]);

      const response = await request(app.getHttpServer())
        .get('/vehicles/available')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0].id).toBe('v1');
    });

    it('should pass capacity query param to service', async () => {
      await request(app.getHttpServer())
        .get('/vehicles/available?capacity=100')
        .expect(200);

      expect(mockVehicleRepository.createQueryBuilder().andWhere).toHaveBeenCalledWith(
        'vehicle.maxCapacityKg >= :capacity',
        { capacity: 100 },
      );
    });
  });
});
