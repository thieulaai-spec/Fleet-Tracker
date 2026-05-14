import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Trip } from '../entities/trip.entity';
import { Alert } from '../entities/alert.entity';
import { Vehicle, VehicleStatus } from '../entities/vehicle.entity';
import { TripStatus } from '../entities/trip.entity';

export const FUEL_RATES = {
  small: 8, // L/100km
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
    const stats = await this.tripRepository
      .createQueryBuilder('trip')
      .leftJoin('trip.vehicle', 'vehicle')
      .select('COUNT(*)', 'total')
      .addSelect(
        'COUNT(CASE WHEN trip.status = :completed THEN 1 END)',
        'completed',
      )
      .addSelect(
        'COUNT(CASE WHEN trip.status = :cancelled THEN 1 END)',
        'failed',
      )
      .addSelect('SUM(trip.totalDistanceKm)', 'totalDistance')
      .addSelect(
        `
        SUM(
          (trip.totalDistanceKm / 100) * 
          CASE 
            WHEN vehicle.type = 'small' THEN ${FUEL_RATES.small}
            WHEN vehicle.type = 'large' THEN ${FUEL_RATES.large}
            ELSE ${FUEL_RATES.medium}
          END * ${DEFAULT_FUEL_PRICE}
        )
      `,
        'estimatedFuelCost',
      )
      .where('trip.createdAt BETWEEN :from AND :to', { from, to })
      .setParameters({
        completed: TripStatus.COMPLETED,
        cancelled: TripStatus.CANCELLED,
      })
      .getRawOne();

    const tripsByVehicle = await this.tripRepository
      .createQueryBuilder('trip')
      .leftJoin('trip.vehicle', 'vehicle')
      .select('vehicle.plateNumber', 'vehiclePlate')
      .addSelect('COUNT(*)', 'count')
      .where('trip.createdAt BETWEEN :from AND :to', { from, to })
      .groupBy('vehicle.plateNumber')
      .getRawMany();

    const statusDistribution = await this.tripRepository
      .createQueryBuilder('trip')
      .select('trip.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('trip.createdAt BETWEEN :from AND :to', { from, to })
      .groupBy('trip.status')
      .getRawMany();

    // Real trend data: Group by day
    const trendData = await this.tripRepository
      .createQueryBuilder('trip')
      .select('DATE(trip.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(trip.totalDistanceKm)', 'distance')
      .where('trip.createdAt BETWEEN :from AND :to', { from, to })
      .groupBy('DATE(trip.createdAt)')
      .orderBy('DATE(trip.createdAt)', 'ASC')
      .getRawMany();

    const performanceTrend = trendData.map((t) => ({
      date: t.date,
      trips: parseInt(t.count),
      distance: parseFloat(t.distance || 0),
    }));

    return {
      totalTrips: parseInt(stats.total || 0),
      totalDistance: parseFloat(stats.totalDistance || 0),
      totalFuelCost: parseFloat(stats.estimatedFuelCost || 0),
      completionRate:
        stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
      tripsTrend: performanceTrend.map((t) => ({
        date: t.date,
        count: t.trips,
      })),
      statusDistribution,
      tripsByVehicle,
      performanceTrend,
    };
  }

  async getFuelCostReport(from: Date, to: Date) {
    const stats = await this.tripRepository
      .createQueryBuilder('trip')
      .leftJoin('trip.vehicle', 'vehicle')
      .select('vehicle.plateNumber', 'vehiclePlate')
      .addSelect('vehicle.type', 'type')
      .addSelect('SUM(trip.totalDistanceKm)', 'distance')
      .addSelect('COUNT(trip.id)', 'trips')
      .where('trip.createdAt BETWEEN :from AND :to', { from, to })
      .groupBy('vehicle.plateNumber')
      .addGroupBy('vehicle.type')
      .getRawMany();

    let totalCost = 0;
    let totalTrips = 0;
    const vehicleFuelStats = stats.map((row) => {
      const fuelRate = FUEL_RATES[row.type] || FUEL_RATES.medium;
      const cost =
        (parseFloat(row.distance) / 100) * fuelRate * DEFAULT_FUEL_PRICE;
      totalCost += cost;
      totalTrips += parseInt(row.trips);
      return {
        vehiclePlate: row.vehiclePlate,
        type: row.type,
        distance: parseFloat(row.distance),
        cost: cost,
        efficiency: fuelRate,
      };
    });

    // Group by type
    const costByVehicleType: { type: string; cost: number }[] = [];
    ['small', 'medium', 'large'].forEach((type) => {
      const cost = vehicleFuelStats
        .filter((s) => s.type === type)
        .reduce((sum, s) => sum + s.cost, 0);
      if (cost > 0) costByVehicleType.push({ type, cost });
    });

    return {
      totalCost,
      costByVehicleType,
      costTrend: [], // Placeholder
      averageCostPerTrip: totalCost / (totalTrips || 1),
      vehicleFuelStats,
    };
  }

  async getVehicleUtilization(from: Date, to: Date) {
    const totalVehicles = await this.vehicleRepository.count();
    const periodHours = Math.max(
      1,
      (to.getTime() - from.getTime()) / (1000 * 60 * 60),
    );

    // Get all completed trips in period to calculate duration
    const trips = await this.tripRepository.find({
      where: {
        createdAt: Between(from, to),
        status: TripStatus.COMPLETED,
      },
      relations: ['vehicle'],
    });

    const vehicleStatsMap = new Map();
    const allVehicles = await this.vehicleRepository.find();
    allVehicles.forEach((v) => {
      vehicleStatsMap.set(v.id, {
        plateNumber: v.plateNumber,
        activeMs: 0,
        status: v.status,
      });
    });

    trips.forEach((trip) => {
      if (
        trip.startedAt &&
        trip.completedAt &&
        vehicleStatsMap.has(trip.vehicleId)
      ) {
        const duration = trip.completedAt.getTime() - trip.startedAt.getTime();
        const stats = vehicleStatsMap.get(trip.vehicleId);
        stats.activeMs += duration;
      }
    });

    const vehicleStats = Array.from(vehicleStatsMap.values()).map((v) => {
      const activeHours = v.activeMs / (1000 * 60 * 60);
      return {
        plateNumber: v.plateNumber,
        utilization: Math.min(
          100,
          Math.round((activeHours / periodHours) * 100),
        ),
        status: v.status,
      };
    });

    const averageUtilization =
      vehicleStats.length > 0
        ? Math.round(
            vehicleStats.reduce((sum, v) => sum + v.utilization, 0) /
              vehicleStats.length,
          )
        : 0;

    return {
      totalVehicles,
      busyVehicles: allVehicles.filter(
        (v) => v.status === VehicleStatus.DELIVERING,
      ).length,
      activeCount: allVehicles.filter(
        (v) => v.status === VehicleStatus.DELIVERING,
      ).length,
      idleCount: allVehicles.filter(
        (v) => v.status !== VehicleStatus.DELIVERING,
      ).length,
      averageUtilization,
      vehicleStats,
    };
  }

  async getTripSummary(from: Date, to: Date) {
    const trips = await this.tripRepository.find({
      where: { createdAt: Between(from, to) },
      relations: ['vehicle', 'driver', 'driver.user', 'tripOrders', 'tripOrders.order'],
      order: { createdAt: 'DESC' },
    });

    const tripIds = trips.map((t) => t.id);
    const unresolvedAlerts = await this.alertRepository
      .createQueryBuilder('alert')
      .where('alert.tripId IN (:...tripIds)', { tripIds: tripIds.length ? tripIds : [null] })
      .andWhere('alert.isResolved = :isResolved', { isResolved: false })
      .getMany();

    const delayedTripIds = new Set(unresolvedAlerts.map((a) => a.tripId));

    return {
      totalTrips: trips.length,
      activeTrips: trips.filter((t) => t.status === TripStatus.IN_PROGRESS).length,
      delayedTrips: delayedTripIds.size,
      trips: trips.map((t) => {
        const sortedOrders = (t.tripOrders || []).sort(
          (a, b) => a.sequence - b.sequence,
        );
        const startOrder = sortedOrders[0]?.order;
        const endOrder = sortedOrders[sortedOrders.length - 1]?.order;

        let duration = 'N/A';
        if (t.startedAt && t.completedAt) {
          const diffMs = t.completedAt.getTime() - t.startedAt.getTime();
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          duration = `${hours}h ${minutes}m`;
        } else if (t.startedAt && t.status === TripStatus.IN_PROGRESS) {
          const diffMs = Date.now() - t.startedAt.getTime();
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          duration = `${hours}h ${minutes}m (active)`;
        }

        return {
          id: t.id,
          date: t.createdAt.toISOString().split('T')[0],
          vehiclePlate: t.vehicle?.plateNumber || 'N/A',
          driverName: t.driver?.user?.fullName || 'N/A',
          status: t.status,
          distance: parseFloat(t.totalDistanceKm as any || 0),
          duration,
          startLocation: startOrder?.pickupAddress || 'N/A',
          endLocation: endOrder?.deliveryAddress || 'N/A',
        };
      }),
    };
  }
}
