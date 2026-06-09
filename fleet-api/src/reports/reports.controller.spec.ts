import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { KpiService } from './kpi.service';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BadRequestException } from '@nestjs/common';
import { ReportName, ExportType } from './dto/export-report.dto';

describe('ReportsController', () => {
  let controller: ReportsController;
  let reportsService: ReportsService;
  let kpiService: KpiService;
  let exportService: ExportService;

  const mockReportsService = {
    getFleetPerformance: jest.fn().mockResolvedValue({ totalTrips: 100 }),
    getFuelCostReport: jest.fn().mockResolvedValue({ totalCost: 500 }),
    getVehicleUtilization: jest.fn().mockResolvedValue([]),
  };

  const mockKpiService = {
    getDriverKpiSummary: jest.fn().mockResolvedValue({ rating: 4.5 }),
    getKpiLeaderboard: jest.fn().mockResolvedValue([]),
  };

  const mockExportService = {
    exportExcel: jest.fn().mockResolvedValue(Buffer.from('excel')),
    exportPdf: jest.fn().mockResolvedValue(Buffer.from('pdf')),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        { provide: ReportsService, useValue: mockReportsService },
        { provide: KpiService, useValue: mockKpiService },
        { provide: ExportService, useValue: mockExportService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ReportsController>(ReportsController);
    reportsService = module.get<ReportsService>(ReportsService);
    kpiService = module.get<KpiService>(KpiService);
    exportService = module.get<ExportService>(ExportService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFleetPerformance', () => {
    it('should return fleet performance', async () => {
      const query = { from: '2023-01-01', to: '2023-01-31' };
      expect(await controller.getFleetPerformance(query as any)).toEqual({
        totalTrips: 100,
      });
    });

    it('should throw BadRequestException if from > to', async () => {
      const query = { from: '2023-01-31', to: '2023-01-01' };
      await expect(
        controller.getFleetPerformance(query as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getDriverKpi', () => {
    it('should return driver kpi', async () => {
      expect(await controller.getDriverKpi('d1', { role: 'admin' })).toEqual({
        rating: 4.5,
      });
    });
  });

  describe('exportReport', () => {
    const res = {
      setHeader: jest.fn(),
      send: jest.fn().mockReturnThis(),
    };

    it('should export fleet performance to PDF', async () => {
      const query = {
        report_name: ReportName.FLEET_PERFORMANCE,
        type: ExportType.PDF,
        from: '2023-01-01',
        to: '2023-01-31',
      };
      await controller.exportReport(query, res as any);
      expect(exportService.exportPdf).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(expect.any(Buffer));
    });

    it('should export fuel cost to Excel', async () => {
      const query = {
        report_name: ReportName.FUEL_COST,
        type: ExportType.EXCEL,
        from: '2023-01-01',
        to: '2023-01-31',
      };
      await controller.exportReport(query, res as any);
      expect(exportService.exportExcel).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(expect.any(Buffer));
    });

    it('should throw BadRequestException for unknown report', async () => {
      const query = {
        report_name: 'UNKNOWN',
        type: ExportType.PDF,
      };
      await expect(
        controller.exportReport(query as any, res as any),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
