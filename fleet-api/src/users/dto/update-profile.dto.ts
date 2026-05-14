import { IsString, IsOptional, IsUrl, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ required: false })
  @IsPhoneNumber(undefined)
  @IsOptional()
  phone?: string;

  @ApiProperty({ required: false })
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @IsOptional()
  avatarUrl?: string;
}
