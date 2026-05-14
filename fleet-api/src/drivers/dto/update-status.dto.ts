import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { DriverStatus } from '../../entities/driver.entity';

export class UpdateStatusDto {
  @ApiProperty({ enum: [DriverStatus.AVAILABLE, DriverStatus.OFF_DUTY] })
  @IsEnum(DriverStatus)
  @IsNotEmpty()
  status: DriverStatus;
}
