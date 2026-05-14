'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { connectSocket, disconnectSocket, SOCKET_EVENTS } from '@/lib/socket';
import { api } from '@/lib/api';
import {
  Activity,
  Truck,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Wifi,
  WifiOff,
  RefreshCw,
  Eye,
  Navigation,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Dynamic import to avoid SSR issues with Mapbox
const LiveTrackingMap = dynamic(() => import('@/components/tracking/LiveTrackingMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-surface text-text-dim">
      <div className="w-8 h-8 border-3 border-border border-t-primary rounded-full animate-spin" />
      <span>Đang tải bản đồ...</span>
    </div>
  ),
});

interface VehiclePosition {
  vehicleId: string;
  driverId: string;
  licensePlate: string;
  driverName: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  status: 'active' | 'idle' | 'offline';
  lastUpdate: string;
  currentTripId?: string;
  ordersCount?: number;
}

interface Alert {
  id: string;
  type: 'sos' | 'geofence' | 'speeding' | 'idle';
  vehicleId: string;
  driverName: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

export default function LiveTrackingPage() {
  const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehiclePosition | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'idle' | 'offline'>('all');
  const socketRef = useRef<any>(null); // Use any or Socket if imported

  const initSocket = useCallback(async () => {
    const socket = await connectSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Subscribe to all vehicles
      socket.emit(SOCKET_EVENTS.GPS_SUBSCRIBE, { all: true });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Real-time GPS updates from all drivers
    socket.on(SOCKET_EVENTS.GPS_UPDATE, (data: any) => {
      const update: VehiclePosition = {
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        licensePlate: data.licensePlate || `VH-${data.vehicleId.slice(0, 6)}`,
        driverName: data.driverName || 'Unknown Driver',
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed || 0,
        heading: data.heading || 0,
        status: data.status || 'active',
        lastUpdate: new Date().toISOString(),
        currentTripId: data.currentTripId,
        ordersCount: data.ordersCount,
      };

      setVehicles(prev => {
        const idx = prev.findIndex(v => v.vehicleId === update.vehicleId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = update;
          return next;
        }
        return [...prev, update];
      });
    });

    // Alerts from backend
    socket.on(SOCKET_EVENTS.ALERT_NEW, (data: any) => {
      const alert: Alert = {
        id: data.id || `alert-${Date.now()}`,
        type: data.type === 'SOS' ? 'sos' : 'idle', // Map to known types, fallback to idle or generic
        vehicleId: data.vehicleId || 'N/A',
        driverName: data.driver?.fullName || data.driverId || 'Unknown',
        message: data.message || `🚨 Có cảnh báo mới từ ${data.vehicleId}`,
        timestamp: data.createdAt || new Date().toISOString(),
        resolved: data.isResolved || false,
      };
      setAlerts(prev => [alert, ...prev.slice(0, 19)]);
    });

    // Driver status changes
    socket.on(SOCKET_EVENTS.DRIVER_STATUS_CHANGED, (data: any) => {
      setVehicles(prev =>
        prev.map(v =>
          v.driverId === data.driverId ? { ...v, status: data.status } : v
        )
      );
    });

    return socket;
  }, []);

  // Load initial vehicle list from REST API
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const [vehiclesDataResponse, driversDataResponse] = await Promise.all([
          api.get<any>('/vehicles'),
          api.get<any>('/drivers'),
        ]);

        const vehiclesData = Array.isArray(vehiclesDataResponse) ? vehiclesDataResponse : (vehiclesDataResponse as any).data || [];
        const driversData = Array.isArray(driversDataResponse) ? driversDataResponse : (driversDataResponse as any).data || [];

        // Build initial positions from DB data (no GPS yet)
        const initial: VehiclePosition[] = vehiclesData.map((v: any) => {
          const driver = driversData.find((d: any) => d.id === v.currentDriverId);
          return {
            vehicleId: v.id,
            driverId: v.currentDriverId || '',
            licensePlate: v.licensePlate,
            driverName: driver ? driver.fullName : 'Chưa phân công',
            latitude: 10.762622 + (Math.random() - 0.5) * 0.1, // placeholder
            longitude: 106.660172 + (Math.random() - 0.5) * 0.1,
            speed: 0,
            heading: 0,
            status: v.status === 'ACTIVE' ? 'idle' : 'offline',
            lastUpdate: new Date().toISOString(),
          };
        });
        setVehicles(initial);
      } catch (err) {
        console.error('Failed to load vehicles:', err);
      }
    };

    loadVehicles();
    initSocket();

    return () => {
      disconnectSocket();
    };
  }, [initSocket]);

  const filteredVehicles = vehicles.filter(v =>
    filter === 'all' ? true : v.status === filter
  );

  const stats = {
    total: vehicles.length,
    active: vehicles.filter(v => v.status === 'active').length,
    idle: vehicles.filter(v => v.status === 'idle').length,
    offline: vehicles.filter(v => v.status === 'offline').length,
    alerts: alerts.filter(a => !a.resolved).length,
  };

  const resolveAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
  };

  return (
    <div className="h-full flex flex-col gap-4 p-5 bg-background min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 text-text">
          <Navigation size={24} />
          <h1 className="text-2xl font-bold m-0">Theo dõi đội xe trực tiếp</h1>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isConnected ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
            {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
            {isConnected ? 'Đang kết nối' : 'Mất kết nối'}
          </div>
        </div>

        <div className="flex gap-2">
          {(['all', 'active', 'idle', 'offline'] as const).map(f => (
            <button
              key={f}
              className={`flex items-center gap-1.5 px-3.5 py-2 border border-border rounded-lg bg-surface text-text-muted cursor-pointer text-sm transition-all hover:not-[.active]:border-primary hover:not-[.active]:text-text ${filter === f ? 'bg-primary text-white border-primary active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Tất cả' : f === 'active' ? 'Đang chạy' : f === 'idle' ? 'Chờ' : 'Offline'}
              <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${filter === f ? 'bg-white/20 text-white' : 'bg-background text-text-dim'}`}>
                {f === 'all' ? stats.total : stats[f]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 shrink-0">
        <div className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-border">
          <Truck size={20} className="shrink-0 text-info" />
          <div>
            <div className="text-2xl font-bold text-text leading-none">{stats.total}</div>
            <div className="text-xs text-text-dim mt-0.5">Tổng xe</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-border">
          <Activity size={20} className="shrink-0 text-success" />
          <div>
            <div className="text-2xl font-bold text-text leading-none">{stats.active}</div>
            <div className="text-xs text-text-dim mt-0.5">Đang vận chuyển</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-border">
          <Clock size={20} className="shrink-0 text-warning" />
          <div>
            <div className="text-2xl font-bold text-text leading-none">{stats.idle}</div>
            <div className="text-xs text-text-dim mt-0.5">Chờ việc</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-border">
          <AlertTriangle size={20} className="shrink-0 text-danger" />
          <div>
            <div className="text-2xl font-bold text-text leading-none">{stats.alerts}</div>
            <div className="text-xs text-text-dim mt-0.5">Cảnh báo</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-4 flex-1 min-h-0">
        {/* Map */}
        <div className="rounded-2xl overflow-hidden border border-border relative min-h-[500px]">
          <LiveTrackingMap
            vehicles={filteredVehicles}
            selectedVehicle={selectedVehicle}
            onVehicleSelect={setSelectedVehicle}
          />
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-3 overflow-y-auto min-h-0">
          {/* Active Alerts */}
          {alerts.filter(a => !a.resolved).length > 0 && (
            <div className="bg-surface rounded-xl border border-border p-4 border-l-3 border-l-danger">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-text mb-3 mt-0">
                <AlertTriangle size={16} className="text-danger" />
                Cảnh báo ({alerts.filter(a => !a.resolved).length})
              </h3>
              {alerts.filter(a => !a.resolved).slice(0, 5).map(alert => (
                <div key={alert.id} className={`flex items-center gap-2.5 p-2.5 rounded-lg mb-2 text-sm ${alert.type === 'sos' ? 'bg-danger/10 border border-danger/20' : 'bg-surface-high border border-border'}`}>
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="text-text font-medium">{alert.message}</span>
                    <span className="text-text-dim text-[11px]">
                      {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  <button
                    className="bg-none border-none text-success cursor-pointer p-1 rounded-md transition-colors hover:bg-success/10"
                    onClick={() => resolveAlert(alert.id)}
                    title="Đánh dấu đã xử lý"
                  >
                    <CheckCircle size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Vehicle List */}
          <div className="bg-surface rounded-xl border border-border p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text mb-3 mt-0">
              <Truck size={16} />
              Danh sách xe ({filteredVehicles.length})
            </h3>
            <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto">
              {filteredVehicles.length === 0 ? (
                <div className="text-center text-text-dim text-sm p-5">Không có xe nào</div>
              ) : (
                filteredVehicles.map(vehicle => (
                  <div
                    key={vehicle.vehicleId}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border border-transparent cursor-pointer transition-all hover:bg-surface-low hover:border-border ${selectedVehicle?.vehicleId === vehicle.vehicleId ? 'bg-primary/10 border-primary' : ''}`}
                    onClick={() => setSelectedVehicle(
                      selectedVehicle?.vehicleId === vehicle.vehicleId ? null : vehicle
                    )}
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${vehicle.status === 'active' ? 'bg-success shadow-[0_0_0_2px_rgba(34,197,94,0.2)]' : vehicle.status === 'idle' ? 'bg-warning' : 'bg-gray-500'}`} />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-text">{vehicle.licensePlate}</div>
                      <div className="text-xs text-text-muted">{vehicle.driverName}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-text-dim mt-0.5">
                        <MapPin size={12} />
                        {vehicle.speed > 0 ? `${vehicle.speed.toFixed(0)} km/h` : 'Đang đứng'}
                        {vehicle.ordersCount !== undefined && (
                          <span className="bg-primary/15 text-primary-light px-1.5 py-0.5 rounded-full font-semibold">{vehicle.ordersCount} đơn</span>
                        )}
                      </div>
                    </div>
                    <button className="bg-none border-none text-text-dim cursor-pointer p-1 rounded-md transition-all hover:bg-primary hover:text-white" title="Xem trên bản đồ">
                      <Eye size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Selected Vehicle Detail */}
          {selectedVehicle && (
            <div className="bg-surface rounded-xl border border-border p-4 border-t-3 border-t-primary">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-text mb-3 mt-0">Chi tiết xe</h3>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-dim">Biển số</span>
                  <span className="text-text font-medium font-mono">{selectedVehicle.licensePlate}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-dim">Tài xế</span>
                  <span className="text-text font-medium font-mono">{selectedVehicle.driverName}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-dim">Tốc độ</span>
                  <span className="text-text font-medium font-mono">{selectedVehicle.speed.toFixed(1)} km/h</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-dim">Tọa độ</span>
                  <span className="text-text font-medium font-mono">
                    {selectedVehicle.latitude.toFixed(5)}, {selectedVehicle.longitude.toFixed(5)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-dim">Cập nhật</span>
                  <span className="text-text font-medium font-mono">
                    {formatDistanceToNow(new Date(selectedVehicle.lastUpdate), { addSuffix: true })}
                  </span>
                </div>
                {selectedVehicle.currentTripId && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-dim">Chuyến</span>
                    <span className="text-primary font-medium font-mono">
                      #{selectedVehicle.currentTripId.slice(0, 8)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
