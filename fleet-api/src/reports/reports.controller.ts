import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { GetUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportsService } from './reports.service';
import { KpiService } from './kpi.service';
import { ExportService } from './export.service';
import { Res } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';
import { DateRangeDto } from './dto/date-range.dto';
import {
  ExportReportDto,
  ExportType,
  ReportName,
} from './dto/export-report.dto';

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
  async getFleetPerformance(@Query() query: DateRangeDto) {
    const from = new Date(query.from);
    const to = new Date(query.to);

    if (from > to) {
      throw new BadRequestException(
        'From date must be before or equal to To date',
      );
    }

    return this.reportsService.getFleetPerformance(from, to);
  }

  @Get('driver-kpi/:driverId')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
  @ApiOperation({ summary: 'Get KPI details for a specific driver' })
  async getDriverKpi(@Param('driverId') driverId: string, @GetUser() user: any) {
    if (user.role === UserRole.DRIVER && user.driver?.id !== driverId) {
      throw new ForbiddenException('You can only view your own KPI');
    }
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
  async getFuelCost(@Query() query: DateRangeDto) {
    const from = new Date(query.from);
    const to = new Date(query.to);

    if (from > to) {
      throw new BadRequestException(
        'From date must be before or equal to To date',
      );
    }

    return this.reportsService.getFuelCostReport(from, to);
  }

  @Get('vehicle-utilization')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Get vehicle utilization statistics' })
  async getVehicleUtilization(@Query() query: DateRangeDto) {
    const from = new Date(query.from);
    const to = new Date(query.to);

    if (from > to) {
      throw new BadRequestException(
        'From date must be before or equal to To date',
      );
    }

    return this.reportsService.getVehicleUtilization(from, to);
  }

  @Get('trip-summary')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Get trip summary report' })
  async getTripSummary(@Query() query: DateRangeDto) {
    const from = new Date(query.from);
    const to = new Date(query.to);

    if (from > to) {
      throw new BadRequestException(
        'From date must be before or equal to To date',
      );
    }

    return this.reportsService.getTripSummary(from, to);
  }

  @Get('export')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Export report to PDF or Excel' })
  async exportReport(@Query() query: ExportReportDto, @Res() res: any) {
    let data: any;
    const from = query.from ? new Date(query.from) : new Date();
    const to = query.to ? new Date(query.to) : new Date();

    if (from > to) {
      throw new BadRequestException(
        'From date must be before or equal to To date',
      );
    }

    if (query.report_name === ReportName.FLEET_PERFORMANCE) {
      data = await this.reportsService.getFleetPerformance(from, to);
    } else if (query.report_name === ReportName.FUEL_COST) {
      data = await this.reportsService.getFuelCostReport(from, to);
    } else if (query.report_name === ReportName.KPI_LEADERBOARD) {
      data = await this.kpiService.getKpiLeaderboard();
    } else if (query.report_name === ReportName.TRIP_SUMMARY) {
      data = await this.reportsService.getTripSummary(from, to);
    } else if (query.report_name === ReportName.VEHICLE_UTILIZATION) {
      data = await this.reportsService.getVehicleUtilization(from, to);
    } else {
      throw new BadRequestException(
        `Unknown report name: ${query.report_name}`,
      );
    }

    if (!data) {
      throw new BadRequestException('No data found for the selected report');
    }

    if (query.type === ExportType.EXCEL) {
      const buffer = await this.exportService.exportExcel(
        data,
        query.report_name,
      );
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${query.report_name}.xlsx`,
      );
      return res.send(buffer);
    } else {
      const buffer = await this.exportService.exportPdf(
        data,
        query.report_name,
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${query.report_name}.pdf`,
      );
      return res.send(buffer);
    }
  }
}
