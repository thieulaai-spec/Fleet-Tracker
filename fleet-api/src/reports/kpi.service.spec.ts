import { KpiService, KPI_PENALTIES } from './kpi.service';
import { TripStatus } from '../entities/trip.entity';

describe('KpiService Logic', () => {
  let kpiService: KpiService;
  let mockKpiRepository: any;
  let mockTripRepository: any;

  beforeEach(() => {
    mockKpiRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      increment: jest.fn(),
    };
    mockTripRepository = {
      findOne: jest.fn(),
      count: jest.fn(),
    };
    kpiService = new KpiService(mockKpiRepository, mockTripRepository);
  });

  it('should calculate penalty correctly for speed violation', async () => {
    mockKpiRepository.findOne.mockResolvedValue({ driverId: 'd1' });

    await kpiService.handleViolation({
      driverId: 'd1',
      type: 'speed_violation',
    });

    expect(mockKpiRepository.update).toHaveBeenCalledWith(
      { driverId: 'd1' },
      expect.objectContaining({
        totalViolations: expect.any(Function),
        kpiScore: expect.any(Function),
        speedViolations: expect.any(Function),
      }),
    );
  });

  it('should not let score go below 0', async () => {
    mockKpiRepository.findOne.mockResolvedValue({ driverId: 'd1' });

    await kpiService.handleViolation({ driverId: 'd1', type: 'incident' });

    expect(mockKpiRepository.update).toHaveBeenCalledWith(
      { driverId: 'd1' },
      expect.objectContaining({
        kpiScore: expect.any(Function),
      }),
    );
    
    // Verify the score reduction logic
    const updateObj = mockKpiRepository.update.mock.calls[0][1];
    expect(updateObj.kpiScore()).toContain('GREATEST(0, kpi_score - 10)');
  });

  it('should increment completedTrips on COMPLETED status', async () => {
    const mockDriver = { id: 'driver-1' };
    const mockTrip = { id: 'trip-1', driver: mockDriver, driverId: 'driver-1' };
    const mockKpi = {
      driverId: 'driver-1',
      totalTrips: 1,
      completedTrips: 0,
      completionRate: 0,
    };

    mockTripRepository.findOne.mockResolvedValue(mockTrip);
    mockKpiRepository.findOne.mockResolvedValue(mockKpi);

    await kpiService.handleTripStatusChange({
      id: 'trip-1',
      status: TripStatus.COMPLETED,
    });

    expect(mockKpiRepository.increment).toHaveBeenCalledWith(
      { driverId: 'driver-1' },
      'completedTrips',
      1,
    );
  });

  it('should increment totalTrips on ACCEPTED status', async () => {
    const mockDriver = { id: 'driver-1' };
    const mockTrip = { id: 'trip-1', driver: mockDriver, driverId: 'driver-1' };
    const mockKpi = {
      driverId: 'driver-1',
      totalTrips: 0,
      completedTrips: 0,
      completionRate: 0,
    };

    mockTripRepository.findOne.mockResolvedValue(mockTrip);
    mockKpiRepository.findOne.mockResolvedValue(mockKpi);

    await kpiService.handleTripStatusChange({
      id: 'trip-1',
      status: TripStatus.ACCEPTED,
    });

    expect(mockKpiRepository.increment).toHaveBeenCalledWith(
      { driverId: 'driver-1' },
      'totalTrips',
      1,
    );
  });

  it('should return leaderboard sorted by kpiScore DESC', async () => {
    const mockLeaderboard = [
      { driverId: 'd1', kpiScore: 100 },
      { driverId: 'd2', kpiScore: 90 },
    ];
    mockKpiRepository.find.mockResolvedValue(mockLeaderboard);

    const result = await kpiService.getKpiLeaderboard();

    expect(mockKpiRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        order: { kpiScore: 'DESC' },
        take: 10,
      }),
    );
    expect(result).toEqual(mockLeaderboard);
  });
});
