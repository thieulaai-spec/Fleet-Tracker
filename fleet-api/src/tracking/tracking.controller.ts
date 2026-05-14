import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('tracking')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get('live')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  async getAllLiveLocations() {
    // This should return the last known location of all active vehicles
    // For now, we can implement a simple version in TrackingService
    return this.trackingService.getAllLiveLocations();
  }

  @Get('vehicle/:id/history')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  async getVehicleHistory(
    @Param('id') vehicleId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.trackingService.getVehicleHistory(
      vehicleId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }
}
