import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip } from '../entities/trip.entity';
import { RouteService } from './route.service';
import { Order } from '../entities/order.entity';

@Injectable()
export class OptimizationService {
  private readonly logger = new Logger(OptimizationService.name);

  constructor(
    @InjectRepository(Trip)
    private tripRepository: Repository<Trip>,
    private routeService: RouteService,
  ) {}

  /**
   * Estimate ETA for a trip based on current status and destination
   */
  async estimateETA(tripId: string, currentLocation: { lat: number; lng: number }) {
    const trip = await this.tripRepository.findOne({
      where: { id: tripId },
      relations: ['tripOrders', 'tripOrders.order'],
    });

    if (!trip) throw new Error('Trip not found');

    // Find the next destination (first undelivered order)
    const nextOrder = trip.tripOrders
      .map((to) => to.order)
      .find((o) => o.status !== 'delivered');

    if (!nextOrder) return null;

    const dest = {
      lat: nextOrder.deliveryLocation.coordinates[1],
      lng: nextOrder.deliveryLocation.coordinates[0],
    };

    const routeInfo = await this.routeService.reRoute(currentLocation, dest);
    
    return {
      estimatedArrival: new Date(Date.now() + routeInfo.duration * 1000),
      remainingDistanceKm: routeInfo.distance / 1000,
      remainingDurationMin: Math.round(routeInfo.duration / 60),
    };
  }

  /**
   * Calculate total distance traveled using PostGIS from GPS history
   */
  async calculateTripDistance(tripId: string): Promise<number> {
    const result = await this.tripRepository.query(
      `
      SELECT SUM(ST_Distance(
        lag(location::geography) OVER (ORDER BY recorded_at),
        location::geography
      )) / 1000 as total_distance_km
      FROM gps_locations
      WHERE trip_id = $1
      `,
      [tripId],
    );

    return parseFloat(result[0]?.total_distance_km || 0);
  }

  /**
   * Optimize trip route based on assigned orders
   */
  async optimizeTripRoute(tripId: string) {
    const trip = await this.tripRepository.findOne({
      where: { id: tripId },
      relations: ['tripOrders', 'tripOrders.order'],
    });

    if (!trip || trip.tripOrders.length === 0) return;

    // Collect waypoints: Start (pickup of first order) -> ... -> End (delivery of last order)
    // Simple version: sequential pickup and delivery
    const waypoints: { lat: number; lng: number }[] = [];
    
    // Add pickups
    for (const to of trip.tripOrders) {
      waypoints.push({
        lat: to.order.pickupLocation.coordinates[1],
        lng: to.order.pickupLocation.coordinates[0],
      });
    }

    // Add deliveries
    for (const to of trip.tripOrders) {
      waypoints.push({
        lat: to.order.deliveryLocation.coordinates[1],
        lng: to.order.deliveryLocation.coordinates[0],
      });
    }

    const routeInfo = await this.routeService.getOptimalRoute(waypoints);

    // Update trip with planned route
    trip.plannedRoute = routeInfo.geometry;
    trip.totalDistanceKm = routeInfo.distance / 1000;
    
    await this.tripRepository.save(trip);

    return routeInfo;
  }
}
