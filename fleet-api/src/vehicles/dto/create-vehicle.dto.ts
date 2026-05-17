import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType, VehicleStatus } from '../../entities/vehicle.entity';

export class CreateVehicleDto {
  @ApiProperty({ example: '51A-123.45' })
  @IsString()
  @IsNotEmpty()
  plateNumber: string;

  @ApiProperty({ enum: VehicleType, example: VehicleType.MEDIUM })
  @IsEnum(VehicleType)
  @IsNotEmpty()
  type: VehicleType;

  @ApiProperty({ example: 2500 })
  @IsNumber()
  @IsPositive()
  maxCapacityKg: number;

  @ApiProperty({ example: 'Hino 500 Series' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({ example: 2022 })
  @IsNumber()
  @IsOptional()
  year?: number;

  @ApiProperty({ example: 'GPS-DEVICE-001', nullable: true })
  @IsString()
  @IsOptional()
  deviceId?: string | null;

  @ApiPropertyOptional({ enum: VehicleStatus, example: VehicleStatus.AVAILABLE })
  @IsEnum(VehicleStatus)
  @IsOptional()
  status?: VehicleStatus;

  @ApiPropertyOptional({ example: 'uuid-of-driver', nullable: true })
  @IsUUID()
  @IsOptional()
  driverId?: string | null;
}

