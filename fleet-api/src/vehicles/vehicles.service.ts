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
import { Trip, TripStatus } from '../entities/trip.entity';
import { UserRole } from '../entities/user.entity';
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
    @InjectRepository(Trip)
    private tripRepository: Repository<Trip>,
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

    const { driverId, initialLat, initialLng, ...vehicleData } =
      createVehicleDto;

    let driverEntity: Driver | null = null;
    if (driverId) {
      const driver = await this.driverRepository.findOne({
        where: { id: driverId },
        relations: ['user'],
      });
      if (!driver || !driver.user || driver.user.role !== UserRole.DRIVER) {
        throw new NotFoundException('Driver not found');
      }
      if (driver.status === DriverStatus.ON_TRIP) {
        throw new ConflictException('Driver is already on another trip');
      }
      driverEntity = driver;
      if (driver.user) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (driverEntity as any).fullName = driver.user.fullName;
      }
    }

    const vehicle = this.vehicleRepository.create({
      ...vehicleData,
      driverId: driverId || null,
      driver: driverEntity,
      lastKnownLocation: {
        type: 'Point',
        coordinates: [initialLng ?? 106.6353, initialLat ?? 10.7838],
      },
    });
    return await this.vehicleRepository.save(vehicle);
  }

  private async populateVehicleStats(vehicle: Vehicle): Promise<Vehicle> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const tripDistance = await this.tripRepository
      .createQueryBuilder('trip')
      .select('SUM(trip.totalDistanceKm)', 'total')
      .where('trip.vehicleId = :vehicleId', { vehicleId: vehicle.id })
      .andWhere('trip.status = :status', { status: TripStatus.COMPLETED })
      .andWhere('trip.completedAt >= :startOfMonth', { startOfMonth })
      .getRawOne();

    const kmThisMonth = parseFloat(tripDistance?.total || '0');

    let condition = 'Good';
    if (vehicle.status === VehicleStatus.MAINTENANCE) {
      condition = 'Maintenance';
    } else if (kmThisMonth > 5000) {
      condition = 'Fair';
    } else if (kmThisMonth > 0) {
      condition = 'Good';
    } else {
      condition = 'Excellent';
    }

    vehicle.kmThisMonth = parseFloat(kmThisMonth.toFixed(1));
    vehicle.condition = condition;

    return vehicle;
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

    await Promise.all(data.map((vehicle) => this.populateVehicleStats(vehicle)));

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

    await this.populateVehicleStats(vehicle);

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
          relations: ['user'],
        });
        if (
          !newDriver ||
          !newDriver.user ||
          newDriver.user.role !== UserRole.DRIVER
        ) {
          throw new NotFoundException('Driver not found');
        }
        if (newDriver.status === DriverStatus.ON_TRIP) {
          throw new ConflictException('Driver is already on another trip');
        }

        vehicle.driver = newDriver;
        if (newDriver.user) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (vehicle.driver as any).fullName = newDriver.user.fullName;
        }
      } else {
        vehicle.driver = null;
      }

      vehicle.driverId = updateVehicleDto.driverId;
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
