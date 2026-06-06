import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './useAuthStore';

export enum OrderStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  DELIVERING = 'delivering',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface Order {
  id: string;
  pickupAddress: string;
  pickupLocation: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  deliveryAddress: string;
  deliveryLocation: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  weightKg: number;
  description?: string;
  recipientName?: string;
  recipientPhone?: string;
  category?: 'raw_material' | 'finished_goods' | 'component' | 'equipment' | 'other';
  priority?: 'low' | 'medium' | 'high';
  deliveryDeadline?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  photoUrl?: string | null;
  signatureUrl?: string | null;
  assignedTrip?: {
    id: string;
    status: string;
    driver?: {
      id: string;
      fullName: string | null;
      phone: string | null;
    } | null;
    vehicle?: {
      id: string;
      plateNumber: string | null;
    } | null;
  } | null;
}

interface OrderState {
  orders: Order[];
  loading: boolean;
  error: string | null;
  fetchOrders: (params?: any) => Promise<void>;
  createOrder: (orderData: Partial<Order>) => Promise<Order>;
  updateOrder: (id: string, orderData: Partial<Order>) => Promise<Order>;
  deleteOrder: (id: string) => Promise<void>;
  assignOrder: (orderId: string, vehicleId: string, driverId: string) => Promise<void>;
  getOrderById: (id: string) => Order | undefined;
  fetchOrderById: (id: string) => Promise<Order>;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  fetchOrders: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const { token } = useAuthStore.getState();
      const response = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      
      // Ensure we handle both wrapped { data, ... } and direct array
      const orders = response.data.data || response.data;
      set({ orders, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch orders', 
        loading: false 
      });
    }
  },

  createOrder: async (orderData) => {
    set({ loading: true, error: null });
    try {
      const { token } = useAuthStore.getState();
      
      // Transform client-side payload to match NestJS DTO (flat coordinates)
      const payload: any = {
        pickupAddress: orderData.pickupAddress,
        deliveryAddress: orderData.deliveryAddress,
        weightKg: orderData.weightKg,
        description: orderData.description,
        recipientName: orderData.recipientName,
        recipientPhone: orderData.recipientPhone,
        deliveryDeadline: orderData.deliveryDeadline,
        category: orderData.category,
        priority: orderData.priority,
      };

      if (orderData.pickupLocation?.coordinates) {
        payload.pickupLng = orderData.pickupLocation.coordinates[0];
        payload.pickupLat = orderData.pickupLocation.coordinates[1];
      }
      if (orderData.deliveryLocation?.coordinates) {
        payload.deliveryLng = orderData.deliveryLocation.coordinates[0];
        payload.deliveryLat = orderData.deliveryLocation.coordinates[1];
      }

      const response = await axios.post(`${API_URL}/orders`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const newOrder = response.data.data || response.data;
      set(state => ({ 
        orders: [newOrder, ...state.orders], 
        loading: false 
      }));
      return newOrder;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create order';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  updateOrder: async (id, orderData) => {
    set({ loading: true, error: null });
    try {
      const { token } = useAuthStore.getState();
      
      let response;
      // If updating status only, route to the dedicated status endpoint
      if (orderData.status && Object.keys(orderData).length === 1) {
        response = await axios.patch(`${API_URL}/orders/${id}/status`, { status: orderData.status }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        const payload: any = { ...orderData };
        
        // Remove fields that would fail DTO validation due to forbidNonWhitelisted
        delete payload.id;
        delete payload.createdAt;
        delete payload.updatedAt;
        delete payload.status;

        if (orderData.pickupLocation?.coordinates) {
          payload.pickupLng = orderData.pickupLocation.coordinates[0];
          payload.pickupLat = orderData.pickupLocation.coordinates[1];
          delete payload.pickupLocation;
        }
        if (orderData.deliveryLocation?.coordinates) {
          payload.deliveryLng = orderData.deliveryLocation.coordinates[0];
          payload.deliveryLat = orderData.deliveryLocation.coordinates[1];
          delete payload.deliveryLocation;
        }

        response = await axios.patch(`${API_URL}/orders/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      
      const updatedOrder = response.data.data || response.data;
      set(state => ({
        orders: state.orders.map(o => o.id === id ? updatedOrder : o),
        loading: false
      }));
      return updatedOrder;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update order';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  deleteOrder: async (id) => {
    set({ loading: true, error: null });
    try {
      const { token } = useAuthStore.getState();
      await axios.delete(`${API_URL}/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      set(state => ({
        orders: state.orders.filter(o => o.id !== id),
        loading: false
      }));
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete order';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  assignOrder: async (orderId, vehicleId, driverId) => {
    set({ loading: true, error: null });
    try {
      const { token } = useAuthStore.getState();
      // Backend DTO only expects orderId and vehicleId. 
      // Sending driverId causes "property driverId should not exist" error.
      await axios.post(`${API_URL}/dispatch/assign`, {
        orderId,
        vehicleId
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Update local state: change order status to ASSIGNED
      set(state => ({
        orders: state.orders.map(o => 
          o.id === orderId ? { ...o, status: OrderStatus.ASSIGNED } : o
        ),
        loading: false
      }));
    } catch (error: any) {
      let message = error.response?.data?.message || 'Failed to assign order';
      
      if (Array.isArray(message)) {
        message = message.join(', ');
      }
      
      // Provide a friendly error message for driver issues
      if (typeof message === 'string' && (message.includes('driverId should not exist') || message.includes('driverID should not exist'))) {
        message = 'Xe này chưa được gán tài xế. Vui lòng chọn xe đã có tài xế.';
      }

      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  getOrderById: (id) => {
    return get().orders.find(o => o.id === id);
  },

  fetchOrderById: async (id) => {
    set({ loading: true, error: null });
    try {
      const { token } = useAuthStore.getState();
      const response = await axios.get(`${API_URL}/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const order = response.data.data || response.data;
      
      set(state => {
        const index = state.orders.findIndex(o => o?.id === id);
        if (index > -1) {
          const newOrders = [...state.orders];
          newOrders[index] = order;
          return { orders: newOrders, loading: false };
        } else {
          return { orders: [...state.orders, order], loading: false };
        }
      });
      
      return order;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch order details';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },
}));
