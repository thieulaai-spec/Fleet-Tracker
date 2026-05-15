import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authFetch } from '@/lib/authFetch';

export { Trip, TripStatus, OrderStatus } from '@/types/trip';
import { Trip, TripStatus, OrderStatus } from '@/types/trip';
import { parsePoint, parseLineString } from '@/utils/geo';

const transformTripData = (t: any): Trip | null => {
  if (!t) return null;
  
  return {
    ...t,
    plannedRoute: t.plannedRoute ? parseLineString(t.plannedRoute) : undefined,
    startedAt: t.startedAt,
    completedAt: t.completedAt,
    orders: (t.tripOrders || []).map((to: any) => {
      if (!to || !to.order) return null;
      
      return {
        id: to.order.id,
        customerName: to.order.customerName || 'Unknown Customer',
        address: to.order.deliveryAddress || to.order.address || 'No address',
        pickupAddress: to.order.pickupAddress || 'Origin Hub',
        status: to.order.status || 'pending',
        pickupLocation: parsePoint(to.order.pickupLocation),
        deliveryLocation: parsePoint(to.order.deliveryLocation),
        customerPhone: to.order.customerPhone,
        photoUrl: to.order.photoUrl,
        signatureUrl: to.order.signatureUrl,
      };
    }).filter(Boolean) || []
  } as Trip;
};

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
          const response = await authFetch('/trips/my');
          if (!response.ok) throw new Error('Failed to fetch trips');
          
          const result = await response.json();
          const rawTrips = result?.data ?? result;
          
          const transformedTrips = (Array.isArray(rawTrips) ? rawTrips : [])
            .map(transformTripData)
            .filter((t): t is Trip => t !== null);

          const active = transformedTrips.find((t) => 
            t.status === TripStatus.ACCEPTED || t.status === TripStatus.IN_PROGRESS
          );
          
          const pending = transformedTrips.filter((t) => t.status === TripStatus.PENDING);
          const history = transformedTrips
            .filter((t) => t.status === TripStatus.COMPLETED || t.status === TripStatus.CANCELLED)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 20);

          set({ 
            activeTrip: active || null, 
            pendingTrips: pending, 
            tripHistory: history,
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      acceptTrip: async (id: string) => {
        await get().updateTripStatus(id, TripStatus.ACCEPTED);
      },

      rejectTrip: async (id: string) => {
        await get().updateTripStatus(id, TripStatus.CANCELLED);
      },

      updateTripStatus: async (id: string, status: TripStatus) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authFetch(`/trips/${id}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
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
          const response = await authFetch(`/orders/${id}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
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
      partialize: (state) => ({ 
        activeTrip: state.activeTrip 
      }),
    }
  )
);

