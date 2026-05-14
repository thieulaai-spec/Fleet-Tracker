import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { TripStatus } from '../../entities/trip.entity';
import { AlertSeverity } from '../../entities/alert.entity';

export class UpdateTripStatusDto {
  @ApiProperty({ enum: TripStatus })
  @IsEnum(TripStatus)
  @IsNotEmpty()
  status: TripStatus;
}

export class ReportIncidentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ enum: AlertSeverity, default: AlertSeverity.HIGH })
  @IsEnum(AlertSeverity)
  @IsOptional()
  severity?: AlertSeverity;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  longitude?: number;
}

export class FindTripsQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  driverId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vehicleId?: string;

  @ApiPropertyOptional({ enum: TripStatus })
  @IsEnum(TripStatus)
  @IsOptional()
  status?: TripStatus;
}
