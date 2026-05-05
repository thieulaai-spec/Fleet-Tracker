import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportsService } from './reports.service';
import { KpiService } from './kpi.service';
import { ExportService } from './export.service';
import type { Response } from 'express';
import { Res } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly kpiService: KpiService,
    private readonly exportService: ExportService,
  ) {}

  @Get('fleet-performance')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Get overall fleet performance metrics' })
  async getFleetPerformance(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.reportsService.getFleetPerformance(new Date(from), new Date(to));
  }

  @Get('driver-kpi/:driverId')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Get KPI details for a specific driver' })
  async getDriverKpi(@Param('driverId') driverId: string) {
    return this.kpiService.getDriverKpiSummary(driverId);
  }

  @Get('kpi-leaderboard')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Get driver KPI leaderboard' })
  async getKpiLeaderboard() {
    return this.kpiService.getKpiLeaderboard();
  }

  @Get('fuel-cost')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Get fuel cost report' })
  async getFuelCost(@Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.getFuelCostReport(new Date(from), new Date(to));
  }

  @Get('vehicle-utilization')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Get vehicle utilization statistics' })
  async getVehicleUtilization() {
    return this.reportsService.getVehicleUtilization();
  }

  @Get('export')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Export report to PDF or Excel' })
  async exportReport(
    @Query('type') type: 'pdf' | 'excel',
    @Query('report_name') reportName: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: Response,
  ) {
    let data: any;
    if (reportName === 'fleet-performance') {
      data = await this.reportsService.getFleetPerformance(new Date(from), new Date(to));
    } else if (reportName === 'fuel-cost') {
      data = await this.reportsService.getFuelCostReport(new Date(from), new Date(to));
    } else if (reportName === 'kpi-leaderboard') {
      data = await this.kpiService.getKpiLeaderboard();
    }

    if (type === 'excel') {
      const buffer = await this.exportService.exportExcel(data, reportName);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${reportName}.xlsx`);
      return res.send(buffer);
    } else {
      const buffer = await this.exportService.exportPdf(data, reportName);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${reportName}.pdf`);
      return res.send(buffer);
    }
  }
}
