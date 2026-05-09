import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ReportsController } from '../src/reports/reports.controller';
import { ReportsService } from '../src/reports/reports.service';
import { KpiService } from '../src/reports/kpi.service';
import { ExportService } from '../src/reports/export.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { UserRole } from '../src/entities/user.entity';

describe('ReportsController (e2e)', () => {
  let app: INestApplication;
  const mockUser = { id: 'admin-id', role: UserRole.ADMIN };

  const mockReportsService = {
    getFleetPerformance: jest.fn().mockResolvedValue({ totalTrips: 50, completedTrips: 45 }),
    getFuelCostReport: jest.fn().mockResolvedValue({ totalCost: 5000000 }),
    getVehicleUtilization: jest.fn().mockResolvedValue([]),
  };

  const mockKpiService = {
    getDriverKpiSummary: jest.fn().mockResolvedValue({ score: 92 }),
    getKpiLeaderboard: jest.fn().mockResolvedValue([{ driverId: 'd1', score: 95 }]),
  };

  const mockExportService = {
    exportExcel: jest.fn().mockResolvedValue(Buffer.from('excel-data')),
    exportPdf: jest.fn().mockResolvedValue(Buffer.from('pdf-data')),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        { provide: ReportsService, useValue: mockReportsService },
        { provide: KpiService, useValue: mockKpiService },
        { provide: ExportService, useValue: mockExportService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: (ctx: any) => { ctx.switchToHttp().getRequest().user = mockUser; return true; } })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterEach(async () => { await app.close(); });

  it('GET /reports/fleet-performance - should return metrics', async () => {
    const res = await request(app.getHttpServer())
      .get('/reports/fleet-performance?from=2026-01-01&to=2026-01-31')
      .expect(200);
    expect(res.body.totalTrips).toBe(50);
  });

  it('GET /reports/fleet-performance - should reject invalid date range', async () => {
    await request(app.getHttpServer())
      .get('/reports/fleet-performance?from=2026-02-01&to=2026-01-01')
      .expect(400);
  });

  it('GET /reports/driver-kpi/:driverId - should return KPI', async () => {
    const res = await request(app.getHttpServer())
      .get('/reports/driver-kpi/driver-1')
      .expect(200);
    expect(res.body.score).toBe(92);
  });

  it('GET /reports/kpi-leaderboard - should return leaderboard', async () => {
    const res = await request(app.getHttpServer())
      .get('/reports/kpi-leaderboard')
      .expect(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  it('GET /reports/fuel-cost - should return fuel cost', async () => {
    const res = await request(app.getHttpServer())
      .get('/reports/fuel-cost?from=2026-01-01&to=2026-01-31')
      .expect(200);
    expect(res.body.totalCost).toBe(5000000);
  });

  it('GET /reports/vehicle-utilization - should return stats', async () => {
    await request(app.getHttpServer())
      .get('/reports/vehicle-utilization')
      .expect(200);
  });

  it('GET /reports/export - should export as Excel', async () => {
    const res = await request(app.getHttpServer())
      .get('/reports/export?report_name=fleet-performance&type=excel&from=2026-01-01&to=2026-01-31')
      .expect(200);
    expect(res.headers['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  });

  it('GET /reports/export - should export as PDF', async () => {
    const res = await request(app.getHttpServer())
      .get('/reports/export?report_name=kpi-leaderboard&type=pdf')
      .expect(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });
});
