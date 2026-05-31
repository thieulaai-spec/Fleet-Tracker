import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';

interface DashboardStats {
  activeVehicles: number;
  pendingOrders: number;
  totalRevenue: number;
  alertCount: number;
}

interface DashboardState {
  stats: DashboardStats;
  orders: any[];
  alerts: any[];
  trips: any[];
  isLoading: boolean;
  error: string | null;
  fetchStats: () => Promise<void>;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: {
    activeVehicles: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    alertCount: 0,
  },
  orders: [],
  alerts: [],
  trips: [],
  isLoading: false,
  error: null,
  fetchStats: async () => {
    set({ isLoading: true, error: null });
    const { token } = useAuthStore.getState();

    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const [vehiclesRes, ordersRes, alertsRes, tripsRes] = await Promise.all([
        fetch(`${API_URL}/vehicles`, { headers }),
        fetch(`${API_URL}/orders`, { headers }),
        fetch(`${API_URL}/alerts`, { headers }),
        fetch(`${API_URL}/trips`, { headers }).catch(() => null), // Fail-safe fallback if /trips fails
      ]);

      if (!vehiclesRes.ok || !ordersRes.ok || !alertsRes.ok) {
        throw new Error('Failed to fetch real-time dashboard data');
      }

      const vehicles = await vehiclesRes.json();
      const orders = await ordersRes.json();
      const alerts = await alertsRes.json();
      const trips = tripsRes && tripsRes.ok ? await tripsRes.json() : [];

      // Unwrap NestJS ResponseInterceptor format if present
      const vehiclesData = Array.isArray(vehicles) ? vehicles : (vehicles.data || []);
      const ordersData = Array.isArray(orders) ? orders : (orders.data || []);
      const alertsData = Array.isArray(alerts) ? alerts : (alerts.data || []);
      const tripsData = Array.isArray(trips) ? trips : (trips.data || []);

      // Calculate real active vehicles (not in maintenance)
      const activeVehicles = vehiclesData.filter((v: any) => v.status !== 'maintenance').length;

      // Calculate real pending orders
      const pendingOrders = ordersData.filter((o: any) => o.status === 'pending').length;

      // Calculate real dynamic revenue (matching the web dashboard formula)
      const totalRevenue = ordersData
        .filter((o: any) => o.status === 'delivered')
        .reduce((sum: number, o: any) => {
          const orderRevenue = Math.round(Number(o.weightKg) * 850) + 200000;
          return sum + orderRevenue;
        }, 0);

      // Count active (unresolved) alerts
      const alertCount = alertsData.filter((a: any) => !a.isResolved).length;

      set({
        stats: {
          activeVehicles,
          pendingOrders,
          totalRevenue,
          alertCount,
        },
        orders: ordersData,
        alerts: alertsData,
        trips: tripsData,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      
      // Fallback for development if API fails
      set({
        stats: {
          activeVehicles: 0,
          pendingOrders: 0,
          totalRevenue: 0,
          alertCount: 0,
        },
        orders: [],
        alerts: [],
        trips: [],
        isLoading: false,
      });
    }
  },
}));
