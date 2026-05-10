import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@fleet_gps_queue';

export interface GpsPoint {
  tripId: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  timestamp: string;
}

export const offlineQueue = {
  async push(point: GpsPoint) {
    try {
      const existing = await this.getAll();
      existing.push(point);
      // Limit queue size to 1000 points to prevent storage issues (~3 hours of data at 10s intervals)
      const limited = existing.slice(-1000);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(limited));
    } catch (e) {
      console.error('Failed to push to offline queue', e);
    }
  },

  async getAll(): Promise<GpsPoint[]> {
    try {
      const data = await AsyncStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to read offline queue', e);
      return [];
    }
  },

  async clear() {
    try {
      await AsyncStorage.removeItem(QUEUE_KEY);
    } catch (e) {
      console.error('Failed to clear offline queue', e);
    }
  }
};
