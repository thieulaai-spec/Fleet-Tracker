import {
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PhoneLocationDto {
  @ApiProperty({ example: 10.835255 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 106.733483 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ example: 25, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(50000)
  accuracyM?: number;

  @ApiProperty({ example: 12, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  speed?: number;

  @ApiProperty({ example: 180, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(360)
  heading?: number;

  @ApiProperty({ example: 1781670000000, required: false })
  @IsNumber()
  @IsOptional()
  @Min(1704067200000)
  timestampMs?: number;
}
