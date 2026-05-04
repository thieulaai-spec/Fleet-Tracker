import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Driver, DriverStatus } from '../entities/driver.entity';
import { User, UserRole } from '../entities/user.entity';
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
    });

    await this.usersRepository.save(user);

    // Create Driver entity
    const driver = this.driversRepository.create({
      ...driverData,
      fullName,
      phone,
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
        '(driver.fullName ILIKE :search OR driver.phone ILIKE :search)',
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
    Object.assign(driver, updateDriverDto);
    return this.driversRepository.save(driver);
  }

  async remove(id: string): Promise<void> {
    const driver = await this.findOne(id);
    
    // In a real system, we might want to check if driver is on a trip
    if (driver.status === DriverStatus.ON_TRIP) {
      throw new ConflictException('Cannot delete driver while on a trip');
    }

    // Since we have cascade delete on user-driver relationship, 
    // we delete the user and it should delete the driver (if configured correctly)
    // Actually our entity has OneToOne(User, { cascade: true, onDelete: 'CASCADE' }) on user field in Driver
    // So deleting Driver will not delete User unless we delete User.
    // Better delete Driver and then User, or just User.
    
    await this.driversRepository.remove(driver);
    await this.usersRepository.delete(driver.userId);
  }
}
