import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BadRequestException } from '@nestjs/common';

describe('VehiclesController', () => {
  let controller: VehiclesController;
  let service: VehiclesService;

  const mockVehicle = {
    id: 'v1',
    plateNumber: 'ABC-123',
  };

  const mockVehiclesService = {
    create: jest.fn().mockResolvedValue(mockVehicle),
    findAll: jest.fn().mockResolvedValue({ data: [mockVehicle], total: 1 }),
    findAvailable: jest.fn().mockResolvedValue([mockVehicle]),
    findOne: jest.fn().mockResolvedValue(mockVehicle),
    update: jest.fn().mockResolvedValue(mockVehicle),
    updateImage: jest.fn().mockResolvedValue(mockVehicle),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [
        {
          provide: VehiclesService,
          useValue: mockVehiclesService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<VehiclesController>(VehiclesController);
    service = module.get<VehiclesService>(VehiclesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a vehicle', async () => {
      const dto = { plateNumber: 'ABC-123' } as any;
      expect(await controller.create(dto)).toEqual(mockVehicle);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all vehicles', async () => {
      const query = { page: 1, limit: 10 };
      expect(await controller.findAll(query as any)).toEqual({
        data: [mockVehicle],
        total: 1,
      });
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findAvailable', () => {
    it('should return available vehicles', async () => {
      expect(await controller.findAvailable(10)).toEqual([mockVehicle]);
      expect(service.findAvailable).toHaveBeenCalledWith(10);
    });
  });

  describe('findOne', () => {
    it('should return a vehicle by id', async () => {
      expect(await controller.findOne('v1')).toEqual(mockVehicle);
      expect(service.findOne).toHaveBeenCalledWith('v1');
    });
  });

  describe('update', () => {
    it('should update a vehicle', async () => {
      const dto = { plateNumber: 'DEF-456' } as any;
      expect(await controller.update('v1', dto)).toEqual(mockVehicle);
      expect(service.update).toHaveBeenCalledWith('v1', dto);
    });
  });

  describe('uploadImage', () => {
    it('should upload vehicle image', async () => {
      const mockFile = { originalname: 'test.png' } as any;
      expect(await controller.uploadImage('v1', mockFile)).toEqual(mockVehicle);
      expect(service.updateImage).toHaveBeenCalledWith('v1', mockFile);
    });

    it('should throw BadRequestException if no file', async () => {
      await expect(async () => {
        await controller.uploadImage('v1', null as any);
      }).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should remove a vehicle', async () => {
      expect(await controller.remove('v1')).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith('v1');
    });
  });
});
