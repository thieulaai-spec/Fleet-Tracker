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
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { DeviceGpsUpdateDto } from './dto/device-gps-update.dto';
import { GpsAidHintDto } from './dto/gps-aid-hint.dto';
import { PhoneLocationDto } from './dto/phone-location.dto';
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

  @Post('active-order')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  async setActiveOrder(@Request() req, @Body('orderId') orderId: string) {
    if (!orderId) {
      throw new BadRequestException('orderId is required');
    }
    return this.trackingService.setActiveOrderForDriver(req.user.id, orderId);
  }

  @Post('gps-aid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  async submitGpsAid(@Request() req, @Body() body: GpsAidHintDto) {
    return this.trackingService.submitDriverGpsAid(req.user, body);
  }

  @Get('amm/state')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  async getAmmState(@Request() req) {
    return this.trackingService.getAmmStateForDriver(req.user);
  }

  @Post('phone-location')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  async submitPhoneLocation(
    @Request() req,
    @Body() body: PhoneLocationDto,
  ) {
    const result = await this.trackingService.processPhoneFallbackLocation(
      req.user,
      body,
    );

    if ((result as any).broadcast) {
      const payload = (result as any).broadcast;
      this.trackingGateway.server.to('admin').emit('gps:update', payload);
      if (payload.tripId) {
        this.trackingGateway.server
          .to(`trip:${payload.tripId}`)
          .emit('trip:location', payload);
      }
    }

    return result;
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

    // Check if there is a pending remote clear_all request for this device
    const pendingClearAll = this.trackingService.getPendingClearAll(
      data.deviceId,
    );
    if (pendingClearAll) {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        action: 'clear_all',
      };
    }

    // Check if there is a pending remote deletion request for this device
    const pendingDelete = this.trackingService.getPendingDeletion(
      data.deviceId,
    );
    if (pendingDelete) {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        action: 'delete',
        deleteId: pendingDelete,
      };
    }

    // Check if there is a pending remote enrollment request for this device
    const pendingEnroll = this.trackingService.getPendingEnrollment(
      data.deviceId,
    );
    if (pendingEnroll) {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        action: 'enroll',
        enrollId: pendingEnroll,
      };
    }

    const pendingGpsAid = this.trackingService.getPendingGpsAid(data.deviceId);
    if (pendingGpsAid) {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        action: 'gps_aid',
        unix: pendingGpsAid.unix,
        lat: pendingGpsAid.latitude,
        lng: pendingGpsAid.longitude,
        accuracyM: pendingGpsAid.accuracyM,
        ageMs: pendingGpsAid.ageMs,
        speed: pendingGpsAid.speed ?? 0,
        heading: pendingGpsAid.heading ?? 0,
        altitudeM: pendingGpsAid.altitudeM ?? 0,
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
    return this.trackingService.saveEnrollmentResult(
      body.deviceId,
      body.fingerprintId,
      body.success,
    );
  }

  @Post('device/delete-result')
  async handleRemoteDeleteResult(
    @Body() body: { deviceId: string; fingerprintId: number; success: boolean },
    @Headers('x-device-api-key') headerApiKey?: string,
  ) {
    const configuredApiKey = this.configService.get<string>('DEVICE_API_KEY');
    if (!configuredApiKey || headerApiKey !== configuredApiKey) {
      throw new UnauthorizedException('Invalid or missing Device API Key');
    }
    return this.trackingService.saveDeletionResult(
      body.deviceId,
      body.fingerprintId,
      body.success,
    );
  }

  @Post('device/clear-all-result')
  async handleRemoteClearAllResult(
    @Body() body: { deviceId: string; success: boolean },
    @Headers('x-device-api-key') headerApiKey?: string,
  ) {
    const configuredApiKey = this.configService.get<string>('DEVICE_API_KEY');
    if (!configuredApiKey || headerApiKey !== configuredApiKey) {
      throw new UnauthorizedException('Invalid or missing Device API Key');
    }
    return this.trackingService.saveClearAllResult(body.deviceId, body.success);
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
