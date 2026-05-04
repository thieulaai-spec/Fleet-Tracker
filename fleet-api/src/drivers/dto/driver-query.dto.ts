import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { DriverStatus } from '../../entities/driver.entity';

export class DriverQueryDto extends PaginationDto {
  @ApiProperty({ enum: DriverStatus, required: false })
  @IsEnum(DriverStatus)
  @IsOptional()
  status?: DriverStatus;

  @ApiProperty({ required: false, description: 'Search by name or phone' })
  @IsString()
  @IsOptional()
  search?: string;
}
