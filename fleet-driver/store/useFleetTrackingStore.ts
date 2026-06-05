import { create } from 'zustand';
import { authFetch } from '@/lib/authFetch';
import { socketService } from '@/lib/socket';
import { parsePoint } from '@/utils/geo';
import { formatError, getFetchErrorMessage } from '@/utils/error';

export interface TrackedVehicle {
  id: string;
  vehicleId: string;
  licensePlate: string;
  driverName: string;
  driverId?: string;
  driverPhone?: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  status: 'available' | 'on_trip' | 'maintenance' | 'offline';
  lastUpdate: string;
  tripId?: string;
  imageUrl?: string;
}

interface FleetTrackingState {
  vehicles: Record<string, TrackedVehicle>;
  isLoading: boolean;
  error: string | null;
  
  fetchLiveLocations: () => Promise<void>;
  updateVehicleLocation: (data: any) => void;
  startTracking: () => void;
  stopTracking: () => void;
}

export const useFleetTrackingStore = create<FleetTrackingState>((set, get) => ({
  vehicles: {},
  isLoading: false,
  error: null,

  fetchLiveLocations: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await authFetch('/tracking/live');
      if (!response.ok) {
        const errorMsg = await getFetchErrorMessage(response, 'Failed to fetch fleet locations');
        throw new Error(errorMsg);
      }
      
      const result = await response.json();
      const rawVehicles = Array.isArray(result) ? result : (result?.data || []);
      
      const initialVehicles: Record<string, TrackedVehicle> = {};
      rawVehicles.forEach((v: any) => {
        const location = parsePoint(v.lastKnownLocation);
        initialVehicles[v.id] = {
          id: v.id,
          vehicleId: v.id,
          licensePlate: v.plateNumber,
          driverName: v.driver?.user?.fullName || 'Unknown',
          driverId: v.driver?.id || undefined,
          driverPhone: v.driver?.user?.phone || undefined,
          latitude: location?.latitude || 0,
          longitude: location?.longitude || 0,
          speed: 0,
          heading: 0,
          status: v.status || 'available',
          lastUpdate: new Date().toISOString(),
          tripId: v.tripId,
          imageUrl: v.imageUrl,
        };
      });
      
      set({ vehicles: initialVehicles, isLoading: false });
    } catch (error: any) {
      set({ error: formatError(error, 'Failed to fetch fleet locations'), isLoading: false });
    }
  },

  updateVehicleLocation: (data: any) => {
    const { vehicleId, latitude, longitude, speed, heading, status, licensePlate, driverName, driverId, driverPhone, tripId, imageUrl } = data;
    
    set((state) => ({
      vehicles: {
        ...state.vehicles,
        [vehicleId]: {
          ...(state.vehicles[vehicleId] || {}),
          id: vehicleId,
          vehicleId,
          latitude,
          longitude,
          speed: speed || 0,
          heading: heading || 0,
          status: status || state.vehicles[vehicleId]?.status || 'available',
          licensePlate: licensePlate || state.vehicles[vehicleId]?.licensePlate || 'Unknown',
          driverName: driverName || state.vehicles[vehicleId]?.driverName || 'Unknown',
          driverId: driverId || state.vehicles[vehicleId]?.driverId,
          driverPhone: driverPhone || state.vehicles[vehicleId]?.driverPhone,
          lastUpdate: new Date().toISOString(),
          tripId,
          imageUrl: imageUrl || state.vehicles[vehicleId]?.imageUrl,
        }
      }
    }));
  },

  startTracking: () => {
    console.log('[FleetTrackingStore] Starting live tracking...');
    // Use stable reference to the function for proper removal later
    const updateFn = get().updateVehicleLocation;
    socketService.on('gps:update', updateFn);
  },

  stopTracking: () => {
    console.log('[FleetTrackingStore] Stopping live tracking...');
    const updateFn = get().updateVehicleLocation;
    socketService.off('gps:update', updateFn);
  }
}));
