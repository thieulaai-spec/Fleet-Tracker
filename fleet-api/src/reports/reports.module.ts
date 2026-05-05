import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { KpiService } from './kpi.service';
import { ExportService } from './export.service';
import { DriverKpi } from '../entities/driver-kpi.entity';
import { Trip } from '../entities/trip.entity';
import { Alert } from '../entities/alert.entity';
import { Driver } from '../entities/driver.entity';
import { Vehicle } from '../entities/vehicle.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DriverKpi, Trip, Alert, Driver, Vehicle]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, KpiService, ExportService],
  exports: [ReportsService, KpiService],
})
export class ReportsModule {}
