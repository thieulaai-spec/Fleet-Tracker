import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class SuggestVehicleDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  orderId: string;
}

export class AssignOrderDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;
}

export class BulkAssignDto {
  @ApiProperty({ type: [String] })
  @IsUUID('all', { each: true })
  @IsNotEmpty()
  orderIds: string[];

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;
}
