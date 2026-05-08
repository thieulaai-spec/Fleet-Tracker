import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: '123 Pickup St, City A' })
  @IsString()
  @IsNotEmpty()
  pickupAddress: string;

  @ApiProperty({ example: 10.762622 })
  @IsNumber()
  @IsNotEmpty()
  pickupLat: number;

  @ApiProperty({ example: 106.660172 })
  @IsNumber()
  @IsNotEmpty()
  pickupLng: number;

  @ApiProperty({ example: '456 Delivery Rd, City B' })
  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;

  @ApiProperty({ example: 10.823099 })
  @IsNumber()
  @IsNotEmpty()
  deliveryLat: number;

  @ApiProperty({ example: 106.629664 })
  @IsNumber()
  @IsNotEmpty()
  deliveryLng: number;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  weightKg: number;

  @ApiProperty({ example: 'Fragile items', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
