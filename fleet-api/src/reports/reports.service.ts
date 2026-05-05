import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Trip } from '../entities/trip.entity';
import { Alert } from '../entities/alert.entity';
import { Vehicle, VehicleStatus } from '../entities/vehicle.entity';
import { TripStatus } from '../entities/trip.entity';

export const FUEL_RATES = {
  small: 8,  // L/100km
  medium: 12,
  large: 16,
};

export const DEFAULT_FUEL_PRICE = 25000; // VND/L

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Trip)
    private tripRepository: Repository<Trip>,
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  async getFleetPerformance(from: Date, to: Date) {
    const trips = await this.tripRepository.find({
      where: {
        createdAt: Between(from, to),
      },
      relations: ['vehicle'],
    });

    const totalTrips = trips.length;
    const completedTrips = trips.filter((t) => t.status === TripStatus.COMPLETED).length;
    const failedTrips = trips.filter((t) => t.status === TripStatus.CANCELLED).length; // or failed if we have that status
    const completionRate = totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0;

    let totalDistanceKm = 0;
    let estimatedFuelCost = 0;
    let totalDurationMinutes = 0;

    trips.forEach((trip) => {
      totalDistanceKm += Number(trip.totalDistanceKm || 0);
      
      // Fuel cost calculation
      const fuelRate = FUEL_RATES[trip.vehicle?.type] || FUEL_RATES.medium;
      const tripFuel = (Number(trip.totalDistanceKm || 0) / 100) * fuelRate;
      estimatedFuelCost += tripFuel * DEFAULT_FUEL_PRICE;

      if (trip.startedAt && trip.completedAt) {
        const duration = (trip.completedAt.getTime() - trip.startedAt.getTime()) / (1000 * 60);
        totalDurationMinutes += duration;
      }
    });

    const averageTripDuration = completedTrips > 0 ? totalDurationMinutes / completedTrips : 0;

    const alerts = await this.alertRepository.find({
      where: {
        createdAt: Between(from, to),
      },
    });

    const alertsByType = {
      speed: alerts.filter((a) => a.type === 'speed_violation').length,
      route: alerts.filter((a) => a.type === 'route_deviation').length,
      stop: alerts.filter((a) => a.type === 'abnormal_stop').length,
      incident: alerts.filter((a) => a.type === 'incident').length,
    };

    return {
      totalTrips,
      completedTrips,
      failedTrips,
      completionRate,
      totalDistanceKm,
      estimatedFuelCost,
      averageTripDuration,
      totalAlerts: alerts.length,
      alertsByType,
    };
  }

  async getFuelCostReport(from: Date, to: Date) {
    // Breakdown by vehicle type or vehicle plate
    const trips = await this.tripRepository.find({
      where: { createdAt: Between(from, to) },
      relations: ['vehicle'],
    });

    const report = {};

    trips.forEach((trip) => {
      const plate = trip.vehicle?.plateNumber || 'Unknown';
      if (!report[plate]) {
        report[plate] = { distance: 0, fuel: 0, cost: 0 };
      }

      const distance = Number(trip.totalDistanceKm || 0);
      const fuelRate = FUEL_RATES[trip.vehicle?.type] || FUEL_RATES.medium;
      const fuel = (distance / 100) * fuelRate;
      const cost = fuel * DEFAULT_FUEL_PRICE;

      report[plate].distance += distance;
      report[plate].fuel += fuel;
      report[plate].cost += cost;
    });

    return report;
  }

  async getVehicleUtilization() {
    // Percentage of time vehicles are 'on_trip' or 'delivering'
    const totalVehicles = await this.vehicleRepository.count();
    const busyVehicles = await this.vehicleRepository.count({
      where: { status: VehicleStatus.DELIVERING },
    });

    return {
      totalVehicles,
      busyVehicles,
      utilizationRate: totalVehicles > 0 ? (busyVehicles / totalVehicles) * 100 : 0,
    };
  }
}
