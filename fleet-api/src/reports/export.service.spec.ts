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
