import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { OptimizationService } from './optimization.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
  @ApiProperty({ example: 10.762622 })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  lat: number;

  @ApiProperty({ example: 106.660172 })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  lng: number;
}

@ApiTags('Optimization')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('optimization')
export class OptimizationController {
  constructor(private readonly optimizationService: OptimizationService) {}

  @Get('trip/:id/eta')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
  @ApiOperation({ summary: 'Estimate ETA for a trip based on current location' })
  async getTripETA(
    @Param('id') id: string,
    @Query() location: LocationDto,
  ) {
    return this.optimizationService.estimateETA(id, {
      lat: location.lat,
      lng: location.lng,
    });
  }

  @Post('trip/:id/optimize')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Manually trigger route optimization for a trip' })
  async optimizeTrip(@Param('id') id: string) {
    return this.optimizationService.optimizeTripRoute(id);
  }
}
