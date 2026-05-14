import { IsNumber, IsString, IsNotEmpty, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeviceGpsUpdateDto {
  @ApiProperty({ example: 'CHIP-123456' })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

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

  @ApiProperty({ example: 60, required: false })
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

}
