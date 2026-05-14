import { Controller, Get, Post, Body, Param, UseGuards, Query, UnauthorizedException, Headers } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { DeviceGpsUpdateDto } from './dto/device-gps-update.dto';
import { TrackingGateway } from './tracking.gateway';

@Controller('tracking')
export class TrackingController {
  constructor(
    private readonly trackingService: TrackingService,
    private readonly trackingGateway: TrackingGateway,
    private readonly configService: ConfigService,
  ) {}

  @Post('device')
  async updateFromDevice(
    @Body() data: DeviceGpsUpdateDto,
    @Headers('x-device-api-key') headerApiKey?: string,
  ) {
    // Security check: Verify API Key
    const configuredApiKey = this.configService.get<string>('DEVICE_API_KEY');
    
    // API Key is mandatory and must match
    if (!configuredApiKey || headerApiKey !== configuredApiKey) {
      throw new UnauthorizedException('Invalid or missing Device API Key');
    }

    const result = await this.trackingService.processDeviceGpsUpdate(data);
    
    // Broadcast to Admin via Gateway
    this.trackingGateway.server.to('admin').emit('gps:update', result);
    if (result.tripId) {
      this.trackingGateway.server.to(`trip:${result.tripId}`).emit('trip:location', result);
    }

    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
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
