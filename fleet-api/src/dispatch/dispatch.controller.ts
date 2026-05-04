import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DispatchService } from './dispatch.service';
import { AssignOrderDto } from './dto/dispatch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@ApiTags('dispatch')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dispatch')
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Suggest vehicles for an order based on distance and capacity' })
  @Get('suggest/:orderId')
  suggestVehicles(@Param('orderId') orderId: string) {
    return this.dispatchService.suggestVehicles(orderId);
  }

  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Assign an order to a vehicle and create a trip' })
  @Post('assign')
  assignOrder(@Body() assignOrderDto: AssignOrderDto) {
    return this.dispatchService.assignOrder(
      assignOrderDto.orderId,
      assignOrderDto.vehicleId,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Cluster pending orders by proximity' })
  @Post('cluster')
  clusterOrders() {
    return this.dispatchService.clusterOrders();
  }
}
