import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrderVerificationsService } from './order-verifications.service';
import { CreateVerificationDto } from './dto/create-verification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@ApiTags('OrderVerifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class OrderVerificationsController {
  constructor(
    private readonly verificationsService: OrderVerificationsService,
  ) {}

  @Post('orders/:orderId/verifications')
  @Roles(UserRole.DRIVER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Submit order verification proof (Fingerprint/ESP32 Cam/Phone Cargo)' })
  create(
    @Param('orderId') orderId: string,
    @Body() dto: CreateVerificationDto,
  ) {
    return this.verificationsService.create(orderId, dto);
  }

  @Get('orders/:orderId/verifications')
  @Roles(UserRole.ADMIN, UserRole.DRIVER, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Get all verifications/milestones for a specific order' })
  findByOrder(@Param('orderId') orderId: string) {
    return this.verificationsService.findByOrder(orderId);
  }

  @Get('trips/:tripId/verifications')
  @Roles(UserRole.ADMIN, UserRole.DRIVER, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Get all verifications/milestones for all orders in a trip' })
  findByTrip(@Param('tripId') tripId: string) {
    return this.verificationsService.findByTrip(tripId);
  }

  @Get('drivers/:driverId/verifications')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Get historical verification journey for a driver (Admin only)' })
  findByDriver(@Param('driverId') driverId: string) {
    return this.verificationsService.findByDriver(driverId);
  }
}
