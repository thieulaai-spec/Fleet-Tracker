import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class RouteService {
  private readonly logger = new Logger(RouteService.name);
  private readonly mapboxToken: string;

  constructor(private configService: ConfigService) {
    this.mapboxToken =
      this.configService.get<string>('MAPBOX_ACCESS_TOKEN') || '';
  }

  /**
   * Get optimized route for multiple waypoints using Mapbox Directions API
   * @param waypoints Array of { lat, lng }
   */
  async getOptimalRoute(waypoints: { lat: number; lng: number }[]) {
    if (!this.mapboxToken) {
      throw new Error('MAPBOX_ACCESS_TOKEN is not configured in .env');
    }
    if (waypoints.length < 2) {
      throw new Error('At least 2 waypoints are required for routing');
    }

    const coordinates = waypoints.map((wp) => `${wp.lng},${wp.lat}`).join(';');

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}`;

    try {
      const response = await axios.get(url, {
        params: {
          access_token: this.mapboxToken,
          geometries: 'geojson',
          overview: 'full',
          steps: true,
        },
        timeout: 5000, // 5 seconds timeout
      });

      if (response.data.code !== 'Ok') {
        throw new Error(`Mapbox API error: ${response.data.message}`);
      }

      const route = response.data.routes[0];
      return {
        geometry: route.geometry, // GeoJSON LineString
        distance: route.distance, // meters
        duration: route.duration, // seconds
        waypoints: response.data.waypoints,
      };
    } catch (error) {
      this.logger.error(`Failed to get route from Mapbox: ${error.message}`);
      throw error;
    }
  }

  /**
   * Re-calculate route from current location to destination
   */
  async reRoute(
    currentLocation: { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ) {
    return this.getOptimalRoute([currentLocation, destination]);
  }
}
