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
    orderBy: jest.fn().mockReturnThis(),
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
      find: jest.fn(),
    };
    mockAlertRepo = {
      createQueryBuilder: jest.fn(),
    };
    mockVehicleRepo = {
      count: jest.fn(),
      find: jest.fn(),
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
    };

    mockTripRepo.createQueryBuilder.mockReturnValue(
      createMockQueryBuilder(mockStats),
    );
    // For trends and distributions
    mockTripRepo.createQueryBuilder.mockReturnValueOnce(createMockQueryBuilder(mockStats))
      .mockReturnValueOnce(createMockQueryBuilder([])) // tripsByVehicle
      .mockReturnValueOnce(createMockQueryBuilder([])) // statusDistribution
      .mockReturnValueOnce(createMockQueryBuilder([])); // trendData

    const result = await reportsService.getFleetPerformance(
      new Date(),
      new Date(),
    );

    expect(result.totalTrips).toBe(1);
    expect(result.totalDistance).toBe(100);
    expect(result.totalFuelCost).toBe(200000);
    expect(result.completionRate).toBe(100);
  });

  it('should calculate utilization rate correctly', async () => {
    mockVehicleRepo.count.mockResolvedValue(10);
    mockVehicleRepo.find.mockResolvedValue([
      { id: 'v1', plateNumber: '29A-1', status: VehicleStatus.DELIVERING },
      { id: 'v2', plateNumber: '29A-2', status: VehicleStatus.IDLE },
    ]);
    mockTripRepo.find.mockResolvedValue([
      {
        vehicleId: 'v1',
        startedAt: new Date('2024-01-01T08:00:00Z'),
        completedAt: new Date('2024-01-01T12:00:00Z'),
        status: TripStatus.COMPLETED,
      },
    ]);

    const result = await reportsService.getVehicleUtilization(
      new Date('2024-01-01T00:00:00Z'),
      new Date('2024-01-02T00:00:00Z'), // 24 hours
    );

    expect(result.totalVehicles).toBe(10);
    expect(result.busyVehicles).toBe(1); // From allVehicles.filter
    expect(result.averageUtilization).toBeGreaterThanOrEqual(0);
    expect(result.vehicleStats).toHaveLength(2);
    // v1 utilization: 4 hours / 24 hours = 16.66% -> 17%
    expect(result.vehicleStats.find(v => v.plateNumber === '29A-1').utilization).toBe(17);
  });

  it('should calculate fuel cost report correctly', async () => {
    const mockStats = [
      { vehiclePlate: '29A-12345', type: 'small', distance: '100', trips: '1' },
    ];

    mockTripRepo.createQueryBuilder.mockReturnValue(
      createMockQueryBuilder(mockStats),
    );

    const result = await reportsService.getFuelCostReport(
      new Date(),
      new Date(),
    );

    expect(result.totalCost).toBe(200000);
    expect(result.vehicleFuelStats[0].distance).toBe(100);
    expect(result.vehicleFuelStats[0].vehiclePlate).toBe('29A-12345');
  });

  it('should get trip summary with dynamic calculations', async () => {
    const mockTrips = [
      {
        id: 't1',
        createdAt: new Date(),
        status: TripStatus.IN_PROGRESS,
        startedAt: new Date(Date.now() - 3600000), // 1 hour ago
        vehicle: { plateNumber: '29A-1' },
        driver: { fullName: 'John Doe' },
        tripOrders: [
          { sequence: 1, order: { pickupAddress: 'A' } },
          { sequence: 2, order: { deliveryAddress: 'B' } },
        ],
      },
    ];

    mockTripRepo.find.mockResolvedValue(mockTrips);
    mockAlertRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });

    const result = await reportsService.getTripSummary(new Date(), new Date());

    expect(result.totalTrips).toBe(1);
    expect(result.activeTrips).toBe(1);
    expect(result.trips[0].duration).toContain('1h 0m (active)');
    expect(result.trips[0].startLocation).toBe('A');
    expect(result.trips[0].endLocation).toBe('B');
  });
});
