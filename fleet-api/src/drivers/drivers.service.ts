import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Driver, DriverStatus } from '../entities/driver.entity';
import { User, UserRole } from '../entities/user.entity';
import { DriverKpi } from '../entities/driver-kpi.entity';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { DriverQueryDto } from './dto/driver-query.dto';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private readonly driversRepository: Repository<Driver>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(DriverKpi)
    private readonly kpiRepository: Repository<DriverKpi>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createDriverDto: CreateDriverDto): Promise<Driver> {
    const { email, password, fullName, phone, ...driverData } = createDriverDto;

    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Create User entity
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const user = this.usersRepository.create({
      email,
      passwordHash,
      role: UserRole.DRIVER,
      fullName,
      phone,
    });

    await this.usersRepository.save(user);

    // Create Driver entity
    const driver = this.driversRepository.create({
      ...driverData,
      user,
      userId: user.id,
    });

    return this.driversRepository.save(driver);
  }

  async findAll(queryDto: DriverQueryDto) {
    const { page = 1, limit = 10, status, search } = queryDto;
    const query = this.driversRepository
      .createQueryBuilder('driver')
      .leftJoinAndSelect('driver.user', 'user')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      query.andWhere('driver.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        '(user.fullName ILIKE :search OR user.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Driver> {
    const driver = await this.driversRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${id} not found`);
    }

    return driver;
  }

  async update(id: string, updateDriverDto: UpdateDriverDto): Promise<Driver> {
    const driver = await this.findOne(id);
    const { fullName, phone, ...driverData } = updateDriverDto;

    // Update User profile if needed
    if (fullName || phone) {
      if (fullName) driver.user.fullName = fullName;
      if (phone) driver.user.phone = phone;
      await this.usersRepository.save(driver.user);
    }

    // Update Driver specific data
    Object.assign(driver, driverData);
    return this.driversRepository.save(driver);
  }

  async remove(id: string): Promise<void> {
    const driver = await this.findOne(id);

    if (driver.status === DriverStatus.ON_TRIP) {
      throw new ConflictException('Cannot delete driver while on a trip');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.remove(Driver, driver);
      await queryRunner.manager.delete(User, { id: driver.userId });
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getKpi(id: string) {
    await this.findOne(id);
    const kpi = await this.kpiRepository.findOne({ where: { driverId: id } });
    
    if (!kpi) {
      return {
        driverId: id,
        totalTrips: 0,
        completedTrips: 0,
        completionRate: 0,
        totalViolations: 0,
        speedViolations: 0,
        routeViolations: 0,
        kpiScore: 100,
        updatedAt: new Date(),
      };
    }
    
    return kpi;
  }

  async getTrips(id: string) {
    await this.findOne(id);
    // Placeholder logic for Phase 03
    return [];
  }

  async getViolations(id: string) {
    await this.findOne(id);
    // Placeholder logic for Phase 03
    return [];
  }

  async findByUserId(userId: string): Promise<Driver> {
    const driver = await this.driversRepository.findOne({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException(`Driver for user ID ${userId} not found`);
    }

    return driver;
  }

  async updateStatusByUserId(userId: string, status: DriverStatus): Promise<Driver> {
    const driver = await this.findByUserId(userId);

    // Prevent manual status change if currently on a trip
    if (driver.status === DriverStatus.ON_TRIP) {
      throw new ConflictException('Cannot change status while on a trip');
    }

    driver.status = status;
    return this.driversRepository.save(driver);
  }
}
