import { KpiService, KPI_PENALTIES } from './kpi.service';
import { TripStatus } from '../entities/trip.entity';
import { AlertType } from '../entities/alert.entity';

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
      type: AlertType.SPEED_VIOLATION,
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

    await kpiService.handleViolation({ driverId: 'd1', type: AlertType.INCIDENT });

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

  describe('getOrCreateKpi', () => {
    it('should return existing KPI if found', async () => {
      const mockKpi = { driverId: 'd1', kpiScore: 100 };
      mockKpiRepository.findOne.mockResolvedValue(mockKpi);

      const result = await kpiService.getOrCreateKpi('d1');
      expect(result).toEqual(mockKpi);
    });

    it('should create and save new KPI if not found', async () => {
      mockKpiRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ driverId: 'd1' });
      mockKpiRepository.create.mockReturnValue({ driverId: 'd1' });

      await kpiService.getOrCreateKpi('d1');
      expect(mockKpiRepository.create).toHaveBeenCalled();
      expect(mockKpiRepository.save).toHaveBeenCalled();
    });

    it('should handle race condition during creation', async () => {
      mockKpiRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ driverId: 'd1' });
      mockKpiRepository.create.mockReturnValue({ driverId: 'd1' });
      mockKpiRepository.save.mockRejectedValue(new Error('Conflict'));

      const result = await kpiService.getOrCreateKpi('d1');
      expect(result).toEqual({ driverId: 'd1' });
    });
  });

  describe('syncTotalTrips', () => {
    it('should sync totals and completion rate', async () => {
      mockTripRepository.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8);
      mockKpiRepository.findOne.mockResolvedValue({ driverId: 'd1' });

      await kpiService.syncTotalTrips('d1');

      expect(mockKpiRepository.update).toHaveBeenCalledWith(
        { driverId: 'd1' },
        { totalTrips: 10, completedTrips: 8 },
      );
      expect(mockKpiRepository.update).toHaveBeenCalledWith(
        { driverId: 'd1' },
        expect.objectContaining({ completionRate: expect.any(Function) }),
      );
    });
  });

  describe('event edge cases', () => {
    it('should return early in handleTripStatusChange if trip or driverId is missing', async () => {
      mockTripRepository.findOne.mockResolvedValue(null);
      await kpiService.handleTripStatusChange({
        id: 'invalid',
        status: TripStatus.ACCEPTED,
      });
      expect(mockKpiRepository.increment).not.toHaveBeenCalled();

      mockTripRepository.findOne.mockResolvedValue({
        id: 't1',
        driverId: null,
      });
      await kpiService.handleTripStatusChange({
        id: 't1',
        status: TripStatus.ACCEPTED,
      });
      expect(mockKpiRepository.increment).not.toHaveBeenCalled();
    });

    it('should return early in handleViolation if driverId is missing', async () => {
      await kpiService.handleViolation({ type: AlertType.SPEED_VIOLATION });
      expect(mockKpiRepository.update).not.toHaveBeenCalled();
    });

    it('should use 0 penalty for unknown violation type', async () => {
      mockKpiRepository.findOne.mockResolvedValue({ driverId: 'd1' });
      await kpiService.handleViolation({ driverId: 'd1', type: 'unknown' });

      const updateObj = mockKpiRepository.update.mock.calls[0][1];
      expect(updateObj.kpiScore()).toContain('GREATEST(0, kpi_score - 0)');
    });
  });
});
