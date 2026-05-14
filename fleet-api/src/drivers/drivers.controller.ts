import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { DriverQueryDto } from './dto/driver-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { GetUser } from '../auth/decorators/current-user.decorator';
import { UpdateStatusDto } from './dto/update-status.dto';

@ApiTags('Drivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new driver (Admin only)' })
  create(@Body() createDriverDto: CreateDriverDto) {
    return this.driversService.create(createDriverDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all drivers with pagination and filters (Admin only)',
  })
  findAll(@Query() queryDto: DriverQueryDto) {
    return this.driversService.findAll(queryDto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get driver details by ID (Admin only)' })
  findOne(@Param('id') id: string) {
    return this.driversService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update driver details (Admin only)' })
  update(@Param('id') id: string, @Body() updateDriverDto: UpdateDriverDto) {
    return this.driversService.update(id, updateDriverDto);
  }

  @Get(':id/kpi')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get driver KPI (Admin only)' })
  getKpi(@Param('id') id: string) {
    return this.driversService.getKpi(id);
  }

  @Get(':id/trips')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get driver trips history (Admin only)' })
  getTrips(@Param('id') id: string) {
    return this.driversService.getTrips(id);
  }

  @Get(':id/violations')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get driver violations history (Admin only)' })
  getViolations(@Param('id') id: string) {
    return this.driversService.getViolations(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete a driver and their user account (Admin only)',
  })
  remove(@Param('id') id: string) {
    return this.driversService.remove(id);
  }

  @Patch('status/me')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Update my own status (Driver only)' })
  updateMyStatus(@GetUser('id') userId: string, @Body() updateStatusDto: UpdateStatusDto) {
    return this.driversService.updateStatusByUserId(userId, updateStatusDto.status);
  }
}
