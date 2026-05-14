import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehiclesService } from './vehicles.service';
import { Vehicle, VehicleStatus, VehicleType } from '../entities/vehicle.entity';
import { Driver } from '../entities/driver.entity';
import { UploadService } from '../upload/upload.service';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

jest.mock('../upload/upload.service');

describe('VehiclesService', () => {
  let service: VehiclesService;
  let repository: Repository<Vehicle>;
  let uploadService: UploadService;

  const mockVehicle = {
    id: 'vehicle-1',
    plateNumber: '29A-12345',
    type: VehicleType.LARGE,
    status: VehicleStatus.AVAILABLE,
    maxCapacityKg: 5000,
  } as Vehicle;

  const mockRepository = {
    create: jest.fn().mockImplementation((dto) => ({ ...dto })),
    save: jest
      .fn()
      .mockImplementation((v) => Promise.resolve({ id: 'vehicle-1', ...v })),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{ ...mockVehicle }]),
    }),
  };

  const mockUploadService = {
    uploadFile: jest.fn().mockResolvedValue('http://example.com/image.jpg'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: getRepositoryToken(Vehicle),
          useValue: mockRepository,
        },
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
        {
          provide: getRepositoryToken(Driver),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
    repository = module.get<Repository<Vehicle>>(getRepositoryToken(Vehicle));
    uploadService = module.get<UploadService>(UploadService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a vehicle if plate number is unique', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      const dto = {
        plateNumber: '29A-12345',
        type: VehicleType.LARGE,
        maxCapacityKg: 5000,
      };

      const result = await service.create(dto);

      expect(result.plateNumber).toBe(dto.plateNumber);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if plate number exists', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockVehicle });
      const dto = { plateNumber: '29A-12345' };

      await expect(service.create(dto as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      mockRepository.findAndCount.mockResolvedValue([[{ ...mockVehicle }], 1]);
      const query = { page: 1, limit: 10, skip: 0 } as any;
      const result = await service.findAll(query);

      expect(result.data).toEqual([mockVehicle]);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return vehicle if found', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockVehicle });
      const result = await service.findOne('vehicle-1');
      expect(result).toEqual(mockVehicle);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update vehicle if plate number is unique or unchanged', async () => {
      mockRepository.findOne.mockResolvedValueOnce({ ...mockVehicle }); // findOne for initial load
      mockRepository.findOne.mockResolvedValueOnce(null); // findOne for plateNumber check

      const result = await service.update('vehicle-1', {
        plateNumber: '29A-99999',
      });
      expect(result.plateNumber).toBe('29A-99999');
    });

    it('should throw ConflictException if updating to an existing plate number', async () => {
      // 1st call to findOne (inside update): return the existing vehicle
      mockRepository.findOne.mockResolvedValueOnce({ ...mockVehicle });
      // 2nd call to findOne (inside update check): return another vehicle with same plate
      mockRepository.findOne.mockResolvedValueOnce({
        id: 'vehicle-2',
        plateNumber: '29A-99999',
      });

      await expect(
        service.update('vehicle-1', { plateNumber: '29A-99999' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateImage', () => {
    it('should upload file and update vehicle image URL', async () => {
      mockRepository.findOne.mockResolvedValueOnce({ ...mockVehicle });
      const mockFile = { buffer: Buffer.from('test') } as any;

      const result = await service.updateImage('vehicle-1', mockFile);

      expect(uploadService.uploadFile).toHaveBeenCalled();
      expect(result.imageUrl).toBe('http://example.com/image.jpg');
    });
  });

  describe('remove', () => {
    it('should remove vehicle if status is not DELIVERING', async () => {
      mockRepository.findOne.mockResolvedValueOnce({ ...mockVehicle });
      await service.remove('vehicle-1');
      expect(repository.remove).toHaveBeenCalled();
    });

    it('should throw BadRequestException if status is DELIVERING', async () => {
      mockRepository.findOne.mockResolvedValue({
        ...mockVehicle,
        status: VehicleStatus.DELIVERING,
      });
      await expect(service.remove('vehicle-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAvailable', () => {
    it('should return available vehicles', async () => {
      const result = await service.findAvailable(3000);
      expect(result[0].id).toBe(mockVehicle.id);
      expect(result[0].status).toBe(VehicleStatus.AVAILABLE);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });
});
