import {
  IsNumber,
  IsString,
  IsISO8601,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GpsUpdateDto {
  @ApiProperty({ example: 'uuid-v4' })
  @IsUUID()
  vehicleId: string;

  @ApiProperty({ example: 'uuid-v4' })
  @IsUUID()
  tripId: string;

  @ApiProperty({ example: 10.762622 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 106.660172 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ example: 60 })
  @IsNumber()
  @Min(0)
  speed: number;

  @ApiProperty({ example: 180 })
  @IsNumber()
  @Min(0)
  @Max(360)
  heading: number;

  @ApiProperty({ example: '2026-05-05T12:00:00Z' })
  @IsISO8601()
  timestamp: string;
}
