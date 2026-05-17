import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Vehicle, VehicleStatus } from '../entities/vehicle.entity';
import { Driver, DriverStatus } from '../entities/driver.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleQueryDto } from './dto/vehicle-query.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    private uploadService: UploadService,
  ) {}

  async create(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    const existing = await this.vehicleRepository.findOne({
      where: { plateNumber: createVehicleDto.plateNumber },
    });
    if (existing) {
      throw new ConflictException(
        'Vehicle with this plate number already exists',
      );
    }

    const { driverId, ...vehicleData } = createVehicleDto;

    if (driverId) {
      const driver = await this.driverRepository.findOne({
        where: { id: driverId },
      });
      if (!driver) {
        throw new NotFoundException('Driver not found');
      }
      if (driver.status === DriverStatus.ON_TRIP) {
        throw new ConflictException('Driver is already on another trip');
      }
    }

    const vehicle = this.vehicleRepository.create({
      ...vehicleData,
      driverId: driverId || null,
      lastKnownLocation: {
        type: 'Point',
        coordinates: [106.6353, 10.7838], // [lng, lat] — Warehouse location
      },
    });
    return await this.vehicleRepository.save(vehicle);
  }

  async findAll(query: VehicleQueryDto): Promise<PaginatedResponse<Vehicle>> {
    const { page, limit, skip, type, status, search } = query;

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (search) where.plateNumber = Like(`%${search}%`);

    const [data, total] = await this.vehicleRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: skip,
      relations: ['driver', 'driver.user'],
    });

    // Map fullName to driver for convenience
    data.forEach((vehicle) => {
      if (vehicle.driver && vehicle.driver.user) {
        (vehicle.driver as any).fullName = vehicle.driver.user.fullName;
      }
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
      relations: ['driver', 'driver.user'],
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    if (vehicle.driver && vehicle.driver.user) {
      (vehicle.driver as any).fullName = vehicle.driver.user.fullName;
    }

    return vehicle;
  }

  async update(
    id: string,
    updateVehicleDto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    const vehicle = await this.findOne(id);

    if (
      updateVehicleDto.plateNumber &&
      updateVehicleDto.plateNumber !== vehicle.plateNumber
    ) {
      const existing = await this.vehicleRepository.findOne({
        where: { plateNumber: updateVehicleDto.plateNumber },
      });
      if (existing) {
        throw new ConflictException(
          'Vehicle with this plate number already exists',
        );
      }
    }

    // Handle driver assignment explicitly to avoid relation conflicts
    if (updateVehicleDto.driverId !== undefined) {
      // 1. Check if vehicle is currently delivering
      if (vehicle.status === VehicleStatus.DELIVERING) {
        throw new BadRequestException(
          'Cannot change driver while vehicle is delivering',
        );
      }

      // 2. If assigning a new driver, check their status
      if (updateVehicleDto.driverId) {
        const newDriver = await this.driverRepository.findOne({
          where: { id: updateVehicleDto.driverId },
        });
        if (!newDriver) {
          throw new NotFoundException('Driver not found');
        }
        if (newDriver.status === DriverStatus.ON_TRIP) {
          throw new ConflictException('Driver is already on another trip');
        }
      }

      vehicle.driverId = updateVehicleDto.driverId;
      vehicle.driver = null; // Clear the loaded relation to ensure driverId is used
      delete updateVehicleDto.driverId;
    }

    Object.assign(vehicle, updateVehicleDto);
    return await this.vehicleRepository.save(vehicle);
  }

  async updateImage(id: string, file: Express.Multer.File): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    const imageUrl = await this.uploadService.uploadFile(file, 'vehicles');
    vehicle.imageUrl = imageUrl;
    return await this.vehicleRepository.save(vehicle);
  }

  async remove(id: string): Promise<void> {
    const vehicle = await this.findOne(id);
    if (vehicle.status === VehicleStatus.DELIVERING) {
      throw new BadRequestException(
        'Cannot delete vehicle while it is delivering',
      );
    }
    // We use soft remove or delete depending on requirements. Here we'll do a real remove as per plan soft delete note
    await this.vehicleRepository.remove(vehicle);
  }

  async findAvailable(capacity?: number): Promise<Vehicle[]> {
    const query = this.vehicleRepository
      .createQueryBuilder('vehicle')
      .where('vehicle.status = :status', { status: VehicleStatus.AVAILABLE });

    if (capacity) {
      query.andWhere('vehicle.maxCapacityKg >= :capacity', { capacity });
    }

    return await query.getMany();
  }
}
