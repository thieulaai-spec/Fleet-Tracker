import { Test, TestingModule } from '@nestjs/testing';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TripStatus } from '../entities/trip.entity';
import { UserRole } from '../entities/user.entity';

describe('TripsController', () => {
  let controller: TripsController;
  let service: TripsService;

  const mockTrip = {
    id: 't1',
    status: TripStatus.PENDING,
  };

  const mockTripsService = {
    findAll: jest.fn().mockResolvedValue([mockTrip]),
    findOne: jest.fn().mockResolvedValue(mockTrip),
    updateStatus: jest.fn().mockResolvedValue(mockTrip),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TripsController],
      providers: [
        {
          provide: TripsService,
          useValue: mockTripsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TripsController>(TripsController);
    service = module.get<TripsService>(TripsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all trips', async () => {
      expect(await controller.findAll()).toEqual([mockTrip]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a trip by id', async () => {
      expect(await controller.findOne('t1')).toEqual(mockTrip);
      expect(service.findOne).toHaveBeenCalledWith('t1');
    });
  });

  describe('updateStatus', () => {
    it('should update trip status', async () => {
      const dto = { status: TripStatus.IN_PROGRESS };
      const req = { user: { id: 'u1', role: UserRole.DRIVER } };

      expect(await controller.updateStatus('t1', dto, req)).toEqual(mockTrip);
      expect(service.updateStatus).toHaveBeenCalledWith(
        't1',
        TripStatus.IN_PROGRESS,
        'u1',
        UserRole.DRIVER,
      );
    });
  });
});
