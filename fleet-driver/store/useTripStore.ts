import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authFetch } from '@/lib/authFetch';

export { Trip, TripStatus, OrderStatus } from '@/types/trip';
import { Trip, TripStatus, OrderStatus } from '@/types/trip';
import { parsePoint, parseLineString } from '@/utils/geo';
import { formatError, getFetchErrorMessage } from '@/utils/error';

const transformTripData = (t: any): Trip | null => {
  if (!t) return null;
  
  return {
    ...t,
    plannedRoute: t.plannedRoute ? parseLineString(t.plannedRoute) : undefined,
    startedAt: t.startedAt,
    completedAt: t.completedAt,
    vehicle: t.vehicle ? {
      ...t.vehicle,
      lastKnownLocation: parsePoint(t.vehicle.lastKnownLocation),
    } : undefined,
    driver: t.driver ? {
      id: t.driver.id,
      fingerprintId: t.driver.fingerprintId,
    } : undefined,
    orders: (t.tripOrders || []).map((to: any) => {
      if (!to || !to.order) return null;
      
      return {
        id: to.order.id,
        customerName: to.order.recipientName || to.order.customerName || 'Unknown Customer',
        address: to.order.deliveryAddress || to.order.address || 'No address',
        pickupAddress: to.order.pickupAddress || 'Origin Hub',
        status: to.order.status || 'pending',
        pickupLocation: parsePoint(to.order.pickupLocation),
        deliveryLocation: parsePoint(to.order.deliveryLocation),
        customerPhone: to.order.recipientPhone || to.order.customerPhone,
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
  updateOrderStatus: (id: string, status: OrderStatus, options?: { photoUrl?: string, signatureUrl?: string, actionLat?: number, actionLng?: number }) => Promise<void>;
  submitOrderVerification: (orderId: string, data: { step: string; fingerprintStatus: boolean; facePhotoUrl?: string; cargoPhotoUrl?: string; latitude?: number; longitude?: number }) => Promise<void>;
  updateCargoPhoto: (orderId: string, step: string, cargoPhotoUrl: string) => Promise<void>;
  fetchTripDetails: (id: string) => Promise<{ trip: Trip; verifications: any[] }>;
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
          if (!response.ok) {
            const errorMsg = await getFetchErrorMessage(response, 'Failed to fetch trips');
            throw new Error(errorMsg);
          }
          
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
          set({ error: formatError(error, 'Failed to fetch trips'), isLoading: false });
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
            const errorMsg = await getFetchErrorMessage(response, 'Failed to update status');
            throw new Error(errorMsg);
          }
          
          await get().fetchTrips();
        } catch (error: any) {
          const message = formatError(error, 'Failed to update status');
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      updateOrderStatus: async (id: string, status: OrderStatus, options?: { photoUrl?: string, signatureUrl?: string, actionLat?: number, actionLng?: number }) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authFetch(`/orders/${id}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              status, 
              photoUrl: options?.photoUrl, 
              signatureUrl: options?.signatureUrl,
              actionLat: options?.actionLat,
              actionLng: options?.actionLng
            }),
          });

          if (!response.ok) {
            const errorMsg = await getFetchErrorMessage(response, 'Failed to update order status');
            throw new Error(errorMsg);
          }
          
          await get().fetchTrips();
        } catch (error: any) {
          const message = formatError(error, 'Failed to update order status');
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      submitOrderVerification: async (orderId: string, verificationData: any) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authFetch(`/orders/${orderId}/verifications`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(verificationData),
          });

          if (!response.ok) {
            const errorMsg = await getFetchErrorMessage(response, 'Failed to submit verification');
            throw new Error(errorMsg);
          }
          
          await get().fetchTrips();
        } catch (error: any) {
          const message = formatError(error, 'Failed to submit verification');
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },
      updateCargoPhoto: async (orderId: string, step: string, cargoPhotoUrl: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authFetch(`/orders/${orderId}/verifications/${step}/cargo-photo`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cargoPhotoUrl }),
          });

          if (!response.ok) {
            const errorMsg = await getFetchErrorMessage(response, 'Failed to update cargo photo');
            throw new Error(errorMsg);
          }
          
          await get().fetchTrips();
        } catch (error: any) {
          const message = formatError(error, 'Failed to update cargo photo');
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },
      fetchTripDetails: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const tripRes = await authFetch(`/trips/${id}`);
          if (!tripRes.ok) {
            const errorMsg = await getFetchErrorMessage(tripRes, 'Failed to fetch trip details');
            throw new Error(errorMsg);
          }
          const tripResult = await tripRes.json();
          const rawTrip = tripResult?.data ?? tripResult;
          const transformedTrip = transformTripData(rawTrip);

          if (!transformedTrip) {
            throw new Error('Trip data could not be parsed');
          }

          let verifications: any[] = [];
          try {
            const verRes = await authFetch(`/trips/${id}/verifications`);
            if (verRes.ok) {
              const verResult = await verRes.json();
              verifications = verResult?.data ?? verResult;
            }
          } catch (verErr) {
            console.warn('Failed to fetch trip verifications:', verErr);
          }

          set({ isLoading: false });
          return { trip: transformedTrip, verifications };
        } catch (error: any) {
          const message = formatError(error, 'Failed to fetch trip details');
          set({ error: message, isLoading: false });
          throw new Error(message);
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

