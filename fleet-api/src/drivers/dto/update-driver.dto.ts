import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateDriverDto } from './create-driver.dto';

// Drivers cannot change their email once created (linked to User entity)
export class UpdateDriverDto extends PartialType(
  OmitType(CreateDriverDto, ['email', 'password'] as const),
) {}
