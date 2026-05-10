import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from './useAuthStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

export enum TripStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum OrderStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  DELIVERING = 'delivering',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

interface Order {
  id: string;
  customerName: string;
  address: string;
  status: string;
  photoUrl?: string;
  pickupLocation?: { latitude: number; longitude: number };
  deliveryLocation?: { latitude: number; longitude: number };
}

interface Trip {
  id: string;
  vehicleId: string;
  driverId: string;
  status: TripStatus;
  totalDistanceKm: number;
  orders: Order[];
  plannedRoute?: { latitude: number; longitude: number }[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface TripState {
  activeTrip: Trip | null;
  pendingTrips: Trip[];
  tripHistory: Trip[];
  isLoading: boolean;
  error: string | null;
  isSocketConnected: boolean;
  
  setActiveTrip: (trip: Trip | null) => void;
  setSocketConnected: (connected: boolean) => void;
  fetchTrips: () => Promise<void>;
  acceptTrip: (id: string) => Promise<void>;
  rejectTrip: (id: string) => Promise<void>;
  updateTripStatus: (id: string, status: TripStatus) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus, photoUrl?: string, signatureUrl?: string) => Promise<void>;
}

export const useTripStore = create<TripState>()(
  persist(
    (set, get) => ({
      activeTrip: null,
      pendingTrips: [],
      tripHistory: [],
      isLoading: false,
      error: null,
      isSocketConnected: false,

      setActiveTrip: (trip) => set({ activeTrip: trip }),
      setSocketConnected: (connected) => set({ isSocketConnected: connected }),

      fetchTrips: async () => {
        set({ isLoading: true, error: null });
        try {
          const { token } = useAuthStore.getState();
          const response = await fetch(`${API_URL}/trips/my`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (!response.ok) throw new Error('Failed to fetch trips');
          
          const trips = await response.json();
          
          // Helper to parse GeoJSON from PostGIS
          const parsePoint = (geo: any) => {
            if (!geo || !geo.coordinates) return undefined;
            return { latitude: geo.coordinates[1], longitude: geo.coordinates[0] };
          };

          const parseLineString = (geo: any) => {
            if (!geo || !geo.coordinates) return undefined;
            return geo.coordinates.map((coord: any) => ({
              latitude: coord[1],
              longitude: coord[0],
            }));
          };

          // Transform backend response
          const transformedTrips = trips.map((t: any) => ({
            ...t,
            plannedRoute: parseLineString(t.plannedRoute),
            startedAt: t.startedAt,
            completedAt: t.completedAt,
            orders: t.tripOrders?.map((to: any) => ({
              id: to.order.id,
              customerName: to.order.customerName,
              address: to.order.address,
              status: to.order.status,
              pickupLocation: parsePoint(to.order.pickupLocation),
              deliveryLocation: parsePoint(to.order.deliveryLocation),
              photoUrl: to.order.photoUrl,
              signatureUrl: to.order.signatureUrl,
            })) || []
          }));

          const active = transformedTrips.find((t: any) => 
            t.status === TripStatus.ACCEPTED || t.status === TripStatus.IN_PROGRESS
          );
          
          const pending = transformedTrips.filter((t: any) => t.status === TripStatus.PENDING);
          const history = transformedTrips.filter((t: any) => 
            t.status === TripStatus.COMPLETED || t.status === TripStatus.CANCELLED
          );

          set({ 
            activeTrip: active || null, 
            pendingTrips: pending, 
            tripHistory: history,
            isLoading: false 
          });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      acceptTrip: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const { token } = useAuthStore.getState();
          const response = await fetch(`${API_URL}/trips/${id}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: TripStatus.ACCEPTED }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to accept trip');
          }
          
          await get().fetchTrips();
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      rejectTrip: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const { token } = useAuthStore.getState();
          const response = await fetch(`${API_URL}/trips/${id}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: TripStatus.CANCELLED }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to reject trip');
          }
          
          await get().fetchTrips();
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      updateTripStatus: async (id: string, status: TripStatus) => {
        set({ isLoading: true, error: null });
        try {
          const { token } = useAuthStore.getState();
          const response = await fetch(`${API_URL}/trips/${id}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update status');
          }
          
          await get().fetchTrips();
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      updateOrderStatus: async (id: string, status: OrderStatus, photoUrl?: string, signatureUrl?: string) => {
        set({ isLoading: true, error: null });
        try {
          const token = useAuthStore.getState()?.token;
          if (!token) throw new Error('Authentication token not found');

          const response = await fetch(`${API_URL}/orders/${id}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status, photoUrl, signatureUrl }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update order status');
          }
          
          await get().fetchTrips();
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: 'trip-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

