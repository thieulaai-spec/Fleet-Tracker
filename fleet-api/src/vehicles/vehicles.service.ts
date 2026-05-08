import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Vehicle, VehicleStatus } from '../entities/vehicle.entity';
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

    const vehicle = this.vehicleRepository.create(createVehicleDto);
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
      relations: ['driver'],
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
      relations: ['driver'],
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
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
