import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { DriverStatus } from '../../entities/driver.entity';

export class CreateDriverDto {
  @ApiProperty({ example: 'driver@fleet.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '0912345678' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(03|05|07|08|09)+([0-9]{8})$/, {
    message:
      'Invalid Vietnam phone number format (10 digits starting with 03, 05, 07, 08, 09)',
  })
  phone: string;

  @ApiProperty({ example: 'B2', required: false })
  @IsString()
  @IsOptional()
  licenseClass?: string;

  @ApiProperty({ example: '2025-12-31', required: false })
  @IsString()
  @IsOptional()
  licenseExpiry?: string;

  @ApiProperty({ enum: DriverStatus, default: DriverStatus.OFF_DUTY })
  @IsEnum(DriverStatus)
  @IsOptional()
  status?: DriverStatus;
}
