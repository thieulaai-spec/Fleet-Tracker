import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DriversService } from './drivers.service';
import { Driver, DriverStatus } from '../entities/driver.entity';
import { User } from '../entities/user.entity';

jest.mock('bcrypt');

describe('DriversService', () => {
  let service: DriversService;
  let driverRepository: Repository<Driver>;
  let userRepository: Repository<User>;
  let dataSource: DataSource;

  const mockDriver = {
    id: 'd1',
    fullName: 'John Doe',
    status: DriverStatus.AVAILABLE,
    userId: 'u1',
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      remove: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
  };

  const mockDriverRepository = {
    create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'd1' })),
    save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockDriver], 1]),
    }),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'u1' })),
    save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriversService,
        {
          provide: getRepositoryToken(Driver),
          useValue: mockDriverRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<DriversService>(DriversService);
    driverRepository = module.get<Repository<Driver>>(
      getRepositoryToken(Driver),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      email: 'test@example.com',
      password: 'password',
      fullName: 'John Doe',
      phone: '123456789',
      licenseNumber: 'L123',
    };

    it('should create a driver and user successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hash');

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockDriverRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: 'existing' });
      await expect(service.create(createDto as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated drivers', async () => {
      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.data).toEqual([mockDriver]);
      expect(result.total).toBe(1);
    });

    it('should filter by status', async () => {
      const queryDto = { status: DriverStatus.AVAILABLE };
      await service.findAll(queryDto as any);
      expect(
        mockDriverRepository.createQueryBuilder().andWhere,
      ).toHaveBeenCalledWith('driver.status = :status', {
        status: DriverStatus.AVAILABLE,
      });
    });

    it('should filter by search term', async () => {
      const queryDto = { search: 'John' };
      await service.findAll(queryDto as any);
      expect(
        mockDriverRepository.createQueryBuilder().andWhere,
      ).toHaveBeenCalledWith(
        expect.stringContaining('driver.fullName ILIKE :search'),
        { search: '%John%' },
      );
    });
  });

  describe('findOne', () => {
    it('should return a driver if found', async () => {
      mockDriverRepository.findOne.mockResolvedValue(mockDriver);
      const result = await service.findOne('d1');
      expect(result).toEqual(mockDriver);
    });

    it('should throw NotFoundException if driver not found', async () => {
      mockDriverRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('none')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update driver data successfully', async () => {
      mockDriverRepository.findOne.mockResolvedValue({ ...mockDriver });
      const updateDto = { phone: '987654321' };

      const result = await service.update('d1', updateDto);

      expect(result.phone).toBe('987654321');
      expect(mockDriverRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove driver and user successfully', async () => {
      mockDriverRepository.findOne.mockResolvedValue(mockDriver);

      await service.remove('d1');

      expect(mockQueryRunner.manager.remove).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should throw ConflictException if driver is on trip', async () => {
      mockDriverRepository.findOne.mockResolvedValue({
        ...mockDriver,
        status: DriverStatus.ON_TRIP,
      });
      await expect(service.remove('d1')).rejects.toThrow(ConflictException);
    });

    it('should rollback and rethrow on transaction error', async () => {
      mockDriverRepository.findOne.mockResolvedValue(mockDriver);
      mockQueryRunner.manager.remove.mockRejectedValue(new Error('DB Error'));

      await expect(service.remove('d1')).rejects.toThrow('DB Error');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('Placeholders', () => {
    it('getKpi should return default values', async () => {
      mockDriverRepository.findOne.mockResolvedValue(mockDriver);
      const result = await service.getKpi('d1');
      expect(result.averageRating).toBe(5.0);
    });

    it('getTrips should return empty array', async () => {
      mockDriverRepository.findOne.mockResolvedValue(mockDriver);
      const result = await service.getTrips('d1');
      expect(result).toEqual([]);
    });

    it('getViolations should return empty array', async () => {
      mockDriverRepository.findOne.mockResolvedValue(mockDriver);
      const result = await service.getViolations('d1');
      expect(result).toEqual([]);
    });
  });
});
