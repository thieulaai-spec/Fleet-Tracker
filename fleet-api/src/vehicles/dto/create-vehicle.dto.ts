import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VehicleType } from '../../entities/vehicle.entity';

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
}
