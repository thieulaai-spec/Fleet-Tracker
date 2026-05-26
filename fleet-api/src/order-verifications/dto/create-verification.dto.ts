import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsString } from 'class-validator';
import { VerificationStep } from '../../entities/order-verification.entity';

export class CreateVerificationDto {
  @ApiProperty({ enum: VerificationStep })
  @IsEnum(VerificationStep)
  @IsNotEmpty()
  step: VerificationStep;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  fingerprintStatus: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  facePhotoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cargoPhotoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}
