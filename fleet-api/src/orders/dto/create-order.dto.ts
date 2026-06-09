import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  Matches,
  IsEnum,
} from 'class-validator';
import { OrderCategory, OrderPriority } from '../../entities/order.entity';

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

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiProperty({ example: '0987654321' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(0|84|\+84)\d{9}$/, {
    message:
      'Phone number must be a valid Vietnamese number starting with 0 or 84, followed by 9 digits',
  })
  recipientPhone: string;

  @ApiProperty({ example: 'other', enum: OrderCategory })
  @IsEnum(OrderCategory)
  @IsNotEmpty()
  category: OrderCategory;

  @ApiProperty({ example: 'medium', enum: OrderPriority })
  @IsEnum(OrderPriority)
  @IsNotEmpty()
  priority: OrderPriority;

  @ApiProperty({ example: '2026-06-06T15:00:00.000Z' })
  @IsString()
  @IsNotEmpty()
  deliveryDeadline: string;
}
