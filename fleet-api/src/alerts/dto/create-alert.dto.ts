import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsObject,
} from 'class-validator';
import { AlertType, AlertSeverity } from '../../entities/alert.entity';

export class CreateAlertDto {
  @IsUUID()
  @IsOptional()
  tripId?: string;

  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;

  @IsEnum(AlertType)
  @IsNotEmpty()
  type: AlertType;

  @IsEnum(AlertSeverity)
  @IsNotEmpty()
  severity: AlertSeverity;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsObject()
  @IsOptional()
  location?: {
    type: 'Point';
    coordinates: number[];
  };
}
