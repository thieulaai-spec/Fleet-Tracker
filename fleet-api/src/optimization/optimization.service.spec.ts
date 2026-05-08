import { NotFoundException } from '@nestjs/common';
import { OptimizationService } from './optimization.service';
import { OrderStatus } from '../entities/order.entity';

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

  it('should throw NotFoundException if trip not found in estimateETA', async () => {
    mockTripRepo.findOne.mockResolvedValue(null);
    await expect(
      optimizationService.estimateETA('invalid', { lat: 0, lng: 0 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should return null if no next order in estimateETA', async () => {
    mockTripRepo.findOne.mockResolvedValue({
      id: 't1',
      tripOrders: [
        {
          order: {
            status: OrderStatus.DELIVERED,
            deliveryLocation: { coordinates: [106, 10] },
          },
        },
      ],
    });

    const result = await optimizationService.estimateETA('t1', {
      lat: 0,
      lng: 0,
    });
    expect(result).toBeNull();
  });

  describe('optimizeTripRoute', () => {
    it('should optimize route and update trip', async () => {
      const mockTripData = {
        id: 't1',
        tripOrders: [
          {
            sequence: 1,
            order: {
              pickupLocation: { coordinates: [106, 10] },
              deliveryLocation: { coordinates: [106.1, 10.1] },
            },
          },
        ],
      };
      mockTripRepo.findOne.mockResolvedValue(mockTripData);
      mockRouteService.getOptimalRoute.mockResolvedValue({
        geometry: 'polyline-string',
        distance: 5000,
      });

      const result = await optimizationService.optimizeTripRoute('t1');

      expect(result.distance).toBe(5000);
      expect(mockTripRepo.save).toHaveBeenCalled();
      expect(mockTripData['plannedRoute']).toBe('polyline-string');
      expect(mockTripData['totalDistanceKm']).toBe(5);
    });

    it('should return early if trip not found or has no orders', async () => {
      mockTripRepo.findOne.mockResolvedValue(null);
      const result1 = await optimizationService.optimizeTripRoute('invalid');
      expect(result1).toBeUndefined();

      mockTripRepo.findOne.mockResolvedValue({ id: 't1', tripOrders: [] });
      const result2 = await optimizationService.optimizeTripRoute('t1');
      expect(result2).toBeUndefined();
    });
  });
});
