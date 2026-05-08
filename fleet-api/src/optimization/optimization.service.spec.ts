import { OptimizationService } from './optimization.service';

describe('OptimizationService Logic', () => {
  let optimizationService: OptimizationService;
  let mockRouteService: any;
  let mockTripRepo: any;
  let mockOrderRepo: any;
  let mockDataSource: any;

  beforeEach(() => {
    mockRouteService = { reRoute: jest.fn(), getOptimalRoute: jest.fn() };
    mockTripRepo = { findOne: jest.fn(), save: jest.fn(), query: jest.fn() };
    optimizationService = new OptimizationService(
      mockTripRepo,
      mockRouteService,
    );
  });

  it('should calculate actual distance using PostGIS query mock', async () => {
    mockTripRepo.query.mockResolvedValue([{ total_distance_km: 15.5 }]);

    const distance = await optimizationService.calculateTripDistance('t1');

    expect(distance).toBe(15.5);
    expect(mockTripRepo.query).toHaveBeenCalled();
  });

  it('should estimate ETA correctly by calling route service', async () => {
    mockTripRepo.findOne.mockResolvedValue({
      id: 't1',
      tripOrders: [
        {
          order: {
            status: 'pending',
            deliveryLocation: { coordinates: [106, 10] },
          },
        },
      ],
    });
    mockRouteService.reRoute.mockResolvedValue({
      duration: 3600, // 1 hour in seconds
      distance: 20000, // 20km
    });

    const result = await optimizationService.estimateETA('t1', {
      lat: 10.1,
      lng: 106.1,
    });

    expect(result.estimatedArrival).toBeInstanceOf(Date);
    expect(result.remainingDistanceKm).toBe(20);
    expect(result.remainingDurationMin).toBe(60);
  });
});
