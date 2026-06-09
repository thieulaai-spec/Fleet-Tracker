import { Test, TestingModule } from '@nestjs/testing';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';
import { UserRole } from '../entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('DriversController', () => {
  let controller: DriversController;
  let service: DriversService;

  const mockDriver = {
    id: 'd1',
    fullName: 'John Doe',
    phone: '123456789',
  };

  const mockDriversService = {
    create: jest.fn().mockResolvedValue(mockDriver),
    findAll: jest.fn().mockResolvedValue({ data: [mockDriver], total: 1 }),
    findOne: jest.fn().mockResolvedValue(mockDriver),
    update: jest.fn().mockResolvedValue(mockDriver),
    remove: jest.fn().mockResolvedValue(undefined),
    getKpi: jest.fn().mockResolvedValue({ tripsCompleted: 10 }),
    getTrips: jest.fn().mockResolvedValue([]),
    getViolations: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DriversController],
      providers: [
        {
          provide: DriversService,
          useValue: mockDriversService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DriversController>(DriversController);
    service = module.get<DriversService>(DriversService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a driver', async () => {
      const dto = { fullName: 'John Doe' } as any;
      expect(await controller.create(dto)).toEqual(mockDriver);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all drivers', async () => {
      const query = { page: 1, limit: 10 };
      expect(await controller.findAll(query as any)).toEqual({
        data: [mockDriver],
        total: 1,
      });
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return a driver by id', async () => {
      expect(await controller.findOne('d1')).toEqual(mockDriver);
      expect(service.findOne).toHaveBeenCalledWith('d1');
    });
  });

  describe('update', () => {
    it('should update a driver', async () => {
      const dto = { fullName: 'Jane Doe' } as any;
      expect(await controller.update('d1', dto)).toEqual(mockDriver);
      expect(service.update).toHaveBeenCalledWith('d1', dto);
    });
  });

  describe('getKpi', () => {
    it('should return driver kpis', async () => {
      expect(await controller.getKpi('d1', {} as any)).toEqual({
        tripsCompleted: 10,
      });
      expect(service.getKpi).toHaveBeenCalledWith('d1');
    });
  });

  describe('getTrips', () => {
    it('should return driver trips', async () => {
      expect(await controller.getTrips('d1')).toEqual([]);
      expect(service.getTrips).toHaveBeenCalledWith('d1');
    });
  });

  describe('getViolations', () => {
    it('should return driver violations', async () => {
      expect(await controller.getViolations('d1')).toEqual([]);
      expect(service.getViolations).toHaveBeenCalledWith('d1');
    });
  });

  describe('remove', () => {
    it('should remove a driver', async () => {
      expect(await controller.remove('d1')).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith('d1');
    });
  });
});
