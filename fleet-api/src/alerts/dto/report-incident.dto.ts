import { IsNotEmpty, IsOptional, IsString, IsUUID, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReportIncidentDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'The trip ID related to the incident' })
  @IsUUID()
  @IsNotEmpty()
  tripId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'The vehicle ID related to the incident' })
  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;

  @ApiProperty({ example: 'Engine breakdown on highway', description: 'Description of the incident' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    example: { type: 'Point', coordinates: [106.660172, 10.762622] },
    description: 'Current location of the incident',
    required: false
  })
  @IsObject()
  @IsOptional()
  location?: {
    type: 'Point';
    coordinates: number[];
  };
}
