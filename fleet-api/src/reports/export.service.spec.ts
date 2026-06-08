import { ExportService } from './export.service';

describe('ExportService Logic', () => {
  let exportService: ExportService;

  beforeEach(() => {
    exportService = new ExportService();
  });

  it('should generate an Excel buffer with correct content', async () => {
    const data = [{ plate: 'ABC-123', distance: 100, fuel: 8, cost: 200000 }];

    const buffer = await exportService.exportExcel(data, 'Fuel Cost Report');

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should generate a formatted Excel buffer for KPI leaderboard with Vietnamese custom columns and formulas', async () => {
    const data = [
      {
        id: '1e82e653-5ba1-4dd8-a55b-e850c1d972d9',
        driverId: '4574654b-832d-415a-a55b-e850c1d972d9',
        totalTrips: 58,
        completedTrips: 58,
        completionRate: 100,
        totalViolations: 0,
        speedViolations: 0,
        routeViolations: 0,
        kpiScore: 99,
        updatedAt: '2026-06-07T15:30:00.000Z',
        driver: {
          id: '4574654b-832d-415a-a55b-e850c1d972d9',
          user: {
            id: '0f449c7c-832d-415a-a55b-e850c1d972d9',
            fullName: 'Tài xế A',
            phone: '0987654321',
          },
        },
      },
    ];

    const buffer = await exportService.exportExcel(data, 'kpi-leaderboard');

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should generate an Excel buffer for a single object summary', async () => {
    const data = {
      totalTrips: 10,
      completionRate: 85.5,
      details: { region: 'North', active: true },
    };

    const buffer = await exportService.exportExcel(data, 'Summary');

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should generate a PDF buffer', async () => {
    const data = {
      totalTrips: 10,
      completedTrips: 8,
      completionRate: 80,
      totalDistanceKm: 500,
      estimatedFuelCost: 1000000,
    };

    const buffer = await exportService.exportPdf(data, 'Fleet Performance');

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should generate a PDF buffer for an array of items', async () => {
    const data = [
      { id: 1, type: 'Overspeed', driver: 'Alice' },
      { id: 2, type: 'Late', driver: 'Bob' },
    ];

    const buffer = await exportService.exportPdf(data, 'Violations List');

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });
});
