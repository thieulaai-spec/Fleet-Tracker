import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  UnauthorizedException,
  Headers,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { DeviceGpsUpdateDto } from './dto/device-gps-update.dto';
import { VerifyHardwareDto } from './dto/verify-hardware.dto';
import { TrackingGateway } from './tracking.gateway';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('tracking')
export class TrackingController {
  constructor(
    private readonly trackingService: TrackingService,
    private readonly trackingGateway: TrackingGateway,
    private readonly configService: ConfigService,
  ) {}

  @Post('verify')
  @UseInterceptors(FileInterceptor('image'))
  async verifyFromHardware(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: VerifyHardwareDto,
    @Headers('x-device-api-key') headerApiKey?: string,
  ) {
    // Security check: Verify API Key
    const configuredApiKey = this.configService.get<string>('DEVICE_API_KEY');
    if (!configuredApiKey || headerApiKey !== configuredApiKey) {
      throw new UnauthorizedException('Invalid or missing Device API Key');
    }

    return this.trackingService.processHardwareVerification(file, body);
  }

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
      this.trackingGateway.server
        .to(`trip:${result.tripId}`)
        .emit('trip:location', result);
    }

    // Check if there is a pending remote enrollment request for this device
    const pendingEnroll = this.trackingService.getPendingEnrollment(data.deviceId);
    if (pendingEnroll) {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        action: 'enroll',
        enrollId: pendingEnroll,
      };
    }

    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Post('device/:deviceId/enroll')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async triggerRemoteEnroll(
    @Param('deviceId') deviceId: string,
    @Body('fingerprintId') fingerprintId: number,
  ) {
    this.trackingService.requestEnrollment(deviceId, fingerprintId);
    return { status: 'pending', deviceId, fingerprintId };
  }

  @Post('device/enroll-result')
  async handleRemoteEnrollResult(
    @Body() body: { deviceId: string; fingerprintId: number; success: boolean },
    @Headers('x-device-api-key') headerApiKey?: string,
  ) {
    const configuredApiKey = this.configService.get<string>('DEVICE_API_KEY');
    if (!configuredApiKey || headerApiKey !== configuredApiKey) {
      throw new UnauthorizedException('Invalid or missing Device API Key');
    }
    return this.trackingService.saveEnrollmentResult(body.deviceId, body.fingerprintId, body.success);
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
