import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class GpsAidHintDto {
  @ApiProperty({ example: 10.8574 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 106.7673 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ example: 25 })
  @IsNumber()
  @Min(0)
  @Max(50000)
  accuracyM: number;

  @ApiProperty({ example: 1781670000 })
  @IsNumber()
  @Min(1704067200)
  unix: number;

  @ApiProperty({ example: 3000, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(120000)
  ageMs?: number;

  @ApiProperty({ example: 0, required: false })
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

  @ApiProperty({ example: 5, required: false })
  @IsNumber()
  @IsOptional()
  @Min(-500)
  @Max(9000)
  altitudeM?: number;
}
