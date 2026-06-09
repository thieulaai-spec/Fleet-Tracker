import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TripsService } from './trips.service';
import {
  ReportIncidentDto,
  UpdateTripStatusDto,
  FindTripsQueryDto,
} from './dto/trip.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@ApiTags('trips')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Roles(UserRole.DRIVER, UserRole.ADMIN)
  @ApiOperation({ summary: 'List trips for current driver' })
  @Get('my')
  findMyTrips(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.tripsService.findMyTrips(
      req.user.id,
      req.user.role,
      startDate,
      endDate,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'List all trips (Admin only)' })
  @Get()
  findAll(@Query() query: FindTripsQueryDto) {
    return this.tripsService.findAll(query);
  }

  @ApiOperation({ summary: 'Get trip details' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tripsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update trip status (Driver/Admin)' })
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateTripStatusDto: UpdateTripStatusDto,
    @Request() req,
  ) {
    return this.tripsService.updateStatus(
      id,
      updateTripStatusDto.status,
      req.user.id,
      req.user.role,
    );
  }

  @ApiOperation({ summary: 'Report an incident for a trip' })
  @Post(':id/incident')
  reportIncident(
    @Param('id') id: string,
    @Body() reportIncidentDto: ReportIncidentDto,
    @Request() req,
  ) {
    return this.tripsService.reportIncident(
      id,
      reportIncidentDto,
      req.user.id,
      req.user.role,
    );
  }
}
