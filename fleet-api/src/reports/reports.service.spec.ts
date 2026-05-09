import {
  ReportsService,
  FUEL_RATES,
  DEFAULT_FUEL_PRICE,
} from './reports.service';
import { TripStatus } from '../entities/trip.entity';
import { VehicleStatus } from '../entities/vehicle.entity';

describe('ReportsService Logic', () => {
  let reportsService: ReportsService;
  let mockTripRepo: any;
  let mockAlertRepo: any;
  let mockVehicleRepo: any;

  const createMockQueryBuilder = (result: any) => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(Array.isArray(result) ? result : []),
    getRawOne: jest
      .fn()
      .mockResolvedValue(!Array.isArray(result) ? result : {}),
    getRawMany: jest
      .fn()
      .mockResolvedValue(Array.isArray(result) ? result : []),
  });

  beforeEach(() => {
    mockTripRepo = {
      createQueryBuilder: jest.fn(),
      query: jest.fn(),
    };
    mockAlertRepo = {
      createQueryBuilder: jest.fn(),
    };
    mockVehicleRepo = {
      count: jest.fn(),
    };
    reportsService = new ReportsService(
      mockTripRepo,
      mockAlertRepo,
      mockVehicleRepo,
    );
  });

  it('should calculate fleet performance correctly', async () => {
    const mockStats = {
      total: '1',
      completed: '1',
      failed: '0',
      totalDistance: '100',
      estimatedFuelCost: '200000',
      avgDurationMinutes: '120',
    };

    mockTripRepo.createQueryBuilder.mockReturnValue(
      createMockQueryBuilder(mockStats),
    );
    mockAlertRepo.createQueryBuilder.mockReturnValue(
      createMockQueryBuilder([]),
    );

    const result = await reportsService.getFleetPerformance(
      new Date(),
      new Date(),
    );

    expect(result.totalTrips).toBe(1);
    expect(result.completedTrips).toBe(1);
    expect(result.totalDistanceKm).toBe(100);
    expect(result.estimatedFuelCost).toBe(200000); // (100/100) * 8 * 25000
    expect(result.averageTripDuration).toBe(120);
  });

  it('should calculate utilization rate correctly', async () => {
    mockVehicleRepo.count.mockImplementation((query) => {
      if (query?.where?.status === VehicleStatus.DELIVERING)
        return Promise.resolve(5);
      return Promise.resolve(10);
    });

    const result = await reportsService.getVehicleUtilization();
    expect(result.totalVehicles).toBe(10);
    expect(result.busyVehicles).toBe(5);
    expect(result.utilizationRate).toBe(50);
  });

  it('should calculate fuel cost report correctly', async () => {
    const mockStats = [
      { plate: '29A-12345', type: 'small', totalDistance: 100 },
    ];

    mockTripRepo.createQueryBuilder.mockReturnValue(
      createMockQueryBuilder(mockStats),
    );

    const result = await reportsService.getFuelCostReport(
      new Date(),
      new Date(),
    );

    expect(result['29A-12345'].cost).toBe(200000);
    expect(result['29A-12345'].distance).toBe(100);
  });
});
