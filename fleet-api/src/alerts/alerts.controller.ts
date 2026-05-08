import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AlertType, AlertSeverity } from '../entities/alert.entity';
import { UserRole } from '../entities/user.entity';
import { ReportIncidentDto } from './dto/report-incident.dto';

@Controller('alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get('active')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  async getActiveAlerts() {
    return this.alertsService.getActiveAlerts();
  }

  @Put(':id/resolve')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  async resolveAlert(@Param('id') id: string) {
    return this.alertsService.resolveAlert(id);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  async getAlertStats() {
    return this.alertsService.getAlertStats();
  }

  @Post('report-incident')
  @Roles(UserRole.DRIVER)
  async reportIncident(@Body() data: ReportIncidentDto) {
    return this.alertsService.createAlert({
      ...data,
      type: AlertType.INCIDENT,
      severity: AlertSeverity.HIGH,
    });
  }
}
