import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './useAuthStore';
import { formatError } from '../utils/error';

export enum DriverStatus {
  AVAILABLE = 'available',
  ON_TRIP = 'on_trip',
  OFF_DUTY = 'off_duty',
}

export enum VehicleType {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
}

export enum VehicleStatus {
  AVAILABLE = 'available',
  DELIVERING = 'delivering',
  MAINTENANCE = 'maintenance',
}

export interface Driver {
  id: string;
  userId: string;
  user: {
    fullName: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
  };
  avatarUrl?: string;
  licenseClass?: string;
  licenseExpiry?: string;
  status: DriverStatus;
  fingerprintId?: string | null;
  createdAt: string;
  updatedAt: string;
  kpi?: {
    id?: string;
    totalTrips: number;
    completedTrips: number;
    completionRate: number;
    totalViolations: number;
    speedViolations?: number;
    routeViolations?: number;
    kpiScore: number;
  } | null;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  type: VehicleType;
  maxCapacityKg: number;
  currentLoadKg: number;
  driverId: string | null;
  driver?: Driver | null;
  status: VehicleStatus;
  deviceId: string | null;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  kmThisMonth?: number;
  condition?: string;
}

export interface DispatchSuggestion {
  vehicle: Vehicle;
  driver: Driver;
  distanceKm: number;
  freeCapacityKg: number;
  kpiScore: number;
}

interface FleetState {
  drivers: Driver[];
  vehicles: Vehicle[];
  suggestions: DispatchSuggestion[];
  loading: boolean;
  error: string | null;
  fetchDrivers: () => Promise<void>;
  fetchVehicles: () => Promise<void>;
  fetchSuggestions: (orderId: string) => Promise<void>;
  createDriver: (data: any) => Promise<void>;
  createVehicle: (data: any) => Promise<void>;
  updateDriver: (id: string, data: any) => Promise<void>;
  updateVehicle: (id: string, data: any) => Promise<void>;
  deleteDriver: (id: string) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  clearFingerprint: (id: string) => Promise<void>;
  clearAllFingerprints: () => Promise<void>;
  assignDriverToVehicle: (driverId: string, vehicleId: string) => Promise<void>;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const useFleetStore = create<FleetState>((set, get) => ({
  drivers: [],
  vehicles: [],
  suggestions: [],
  loading: false,
  error: null,

  fetchDrivers: async () => {
    set({ loading: true, error: null });
    try {
      const { token } = useAuthStore.getState();
      const response = await axios.get(`${API_URL}/drivers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ drivers: response.data.data || response.data, loading: false });
    } catch (error: any) {
      set({ error: formatError(error, 'Failed to fetch drivers'), loading: false });
    }
  },

  fetchVehicles: async () => {
    set({ loading: true, error: null });
    try {
      const { token } = useAuthStore.getState();
      const response = await axios.get(`${API_URL}/vehicles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ vehicles: response.data.data || response.data, loading: false });
    } catch (error: any) {
      set({ error: formatError(error, 'Failed to fetch vehicles'), loading: false });
    }
  },

  fetchSuggestions: async (orderId: string) => {
    set({ loading: true, error: null });
    try {
      const { token } = useAuthStore.getState();
      const response = await axios.get(`${API_URL}/dispatch/suggest/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ suggestions: response.data.data || response.data, loading: false });
    } catch (error: any) {
      set({ error: formatError(error, 'Failed to fetch dispatch suggestions'), loading: false });
    }
  },

  createDriver: async (data) => {
    set({ loading: true, error: null });
    try {
      const { token } = useAuthStore.getState();
      const response = await axios.post(`${API_URL}/drivers`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set(state => ({ 
        drivers: [response.data.data || response.data, ...state.drivers], 
        loading: false 
      }));
    } catch (error: any) {
      const message = formatError(error, 'Failed to create driver');
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  createVehicle: async (data) => {
    set({ loading: true, error: null });
    try {
      const { token } = useAuthStore.getState();
      const response = await axios.post(`${API_URL}/vehicles`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set(state => ({ 
        vehicles: [response.data.data || response.data, ...state.vehicles], 
        loading: false 
      }));
    } catch (error: any) {
      const message = formatError(error, 'Failed to create vehicle');
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  updateDriver: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const { token } = useAuthStore.getState();
      const response = await axios.patch(`${API_URL}/drivers/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updated = response.data.data || response.data;
      set(state => ({
        drivers: state.drivers.map(d => d.id === id ? updated : d),
        loading: false
      }));
    } catch (error: any) {
      const message = formatError(error, 'Failed to update driver');
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  updateVehicle: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const { token } = useAuthStore.getState();
      const response = await axios.patch(`${API_URL}/vehicles/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updated = response.data.data || response.data;
      set(state => ({
        vehicles: state.vehicles.map(v => v.id === id ? updated : v),
        loading: false
      }));
    } catch (error: any) {
      const message = formatError(error, 'Failed to update vehicle');
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  deleteDriver: async (id) => {
    set({ loading: true, error: null });
    try {
      const { token } = useAuthStore.getState();
      await axios.delete(`${API_URL}/drivers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set(state => ({
        drivers: state.drivers.filter(d => d.id !== id),
        loading: false
      }));
    } catch (error: any) {
      const message = formatError(error, 'Failed to delete driver');
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  deleteVehicle: async (id) => {
    set({ loading: true, error: null });
    try {
      const { token } = useAuthStore.getState();
      await axios.delete(`${API_URL}/vehicles/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set(state => ({
        vehicles: state.vehicles.filter(v => v.id !== id),
        loading: false
      }));
    } catch (error: any) {
      const message = formatError(error, 'Failed to delete vehicle');
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  clearFingerprint: async (id) => {
    set({ loading: true, error: null });
    try {
      const { token } = useAuthStore.getState();
      await axios.delete(`${API_URL}/drivers/${id}/fingerprint`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set(state => ({
        drivers: state.drivers.map(d => d.id === id ? { ...d, fingerprintId: null } : d),
        loading: false
      }));
    } catch (error: any) {
      const message = formatError(error, 'Failed to clear fingerprint');
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  clearAllFingerprints: async () => {
    set({ loading: true, error: null });
    try {
      const { token } = useAuthStore.getState();
      await axios.delete(`${API_URL}/drivers/fingerprints/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set(state => ({
        drivers: state.drivers.map(d => ({ ...d, fingerprintId: null })),
        loading: false
      }));
    } catch (error: any) {
      const message = formatError(error, 'Failed to clear all fingerprints');
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  assignDriverToVehicle: async (driverId, vehicleId) => {
    set({ loading: true, error: null });
    try {
      const { token } = useAuthStore.getState();
      await axios.post(`${API_URL}/vehicles/${vehicleId}/assign/${driverId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Refresh both
      const store = get();
      await store.fetchDrivers();
      await store.fetchVehicles();
      set({ loading: false });
    } catch (error: any) {
      const message = formatError(error, 'Failed to assign driver to vehicle');
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },
}));
