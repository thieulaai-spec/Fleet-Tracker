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
});
