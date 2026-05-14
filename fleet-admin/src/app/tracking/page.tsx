"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { connectSocket, disconnectSocket, SOCKET_EVENTS } from "@/lib/socket";
import { api } from "@/lib/api";
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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Dynamic import to avoid SSR issues with Mapbox
const LiveTrackingMap = dynamic(
  () => import("@/components/tracking/LiveTrackingMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-surface text-text-dim">
        <div className="w-8 h-8 border-3 border-border border-t-primary rounded-full animate-spin" />
        <span>Đang tải bản đồ...</span>
      </div>
    ),
  },
);

interface VehiclePosition {
  vehicleId: string;
  driverId: string;
  licensePlate: string;
  driverName: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  status: "active" | "idle" | "offline" | "maintenance";
  lastUpdate: string;
  currentTripId?: string;
  ordersCount?: number;
}

interface Alert {
  id: string;
  type: "sos" | "geofence" | "speeding" | "idle";
  vehicleId: string;
  driverName: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

const statusMap: Record<string, "active" | "idle" | "offline" | "maintenance"> =
  {
    available: "idle",
    delivering: "active",
    transporting: "active",
    on_trip: "active",
    maintenance: "maintenance",
    active: "active",
    idle: "idle",
    offline: "offline",
    off_duty: "offline",
    completed: "idle",
  };

export default function LiveTrackingPage() {
  const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedVehicle, setSelectedVehicle] =
    useState<VehiclePosition | null>(null);
  const [filter, setFilter] = useState<
    "all" | "active" | "idle" | "offline" | "maintenance"
  >("all");
  const socketRef = useRef<any>(null);

  const initSocket = useCallback(async () => {
    const socket = await connectSocket();
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit(SOCKET_EVENTS.GPS_SUBSCRIBE, { all: true });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on(SOCKET_EVENTS.GPS_UPDATE, (data: any) => {
      setVehicles((prev) => {
        const existing = prev.find((v) => v.vehicleId === data.vehicleId);

        const update: VehiclePosition = {
          vehicleId: data.vehicleId,
          driverId: data.driverId || existing?.driverId || "",
          licensePlate:
            data.licensePlate ||
            data.license_plate ||
            data.plateNumber ||
            existing?.licensePlate ||
            `VH-${data.vehicleId.slice(0, 6)}`,
          driverName:
            data.driverName || existing?.driverName || "Unknown Driver",
          latitude: data.latitude,
          longitude: data.longitude,
          speed: data.speed || 0,
          heading: data.heading || 0,
          status: statusMap[data.status] || existing?.status || "active",
          lastUpdate: new Date().toISOString(),
          currentTripId: data.currentTripId || existing?.currentTripId,
          ordersCount:
            data.ordersCount !== undefined
              ? data.ordersCount
              : existing?.ordersCount,
        };

        if (existing) {
          return prev.map((v) =>
            v.vehicleId === update.vehicleId ? update : v,
          );
        }
        return [...prev, update];
      });
    });

    socket.on(SOCKET_EVENTS.ALERT_NEW, (data: any) => {
      const alert: Alert = {
        id: data.id || `alert-${Date.now()}`,
        type: data.type === "SOS" ? "sos" : "idle",
        vehicleId: data.vehicleId || "N/A",
        driverName: data.driver?.fullName || data.driverId || "Unknown",
        message: data.message || `🚨 Có cảnh báo mới từ ${data.vehicleId}`,
        timestamp: data.createdAt || new Date().toISOString(),
        resolved: data.isResolved || false,
      };
      setAlerts((prev) => [alert, ...prev.slice(0, 19)]);
    });

    socket.on(SOCKET_EVENTS.DRIVER_STATUS_CHANGED, (data: any) => {
      setVehicles((prev) =>
        prev.map((v) =>
          v.driverId === data.driverId
            ? { ...v, status: statusMap[data.status] || v.status }
            : v,
        ),
      );
    });

    return socket;
  }, []);

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const [vehiclesDataResponse, driversDataResponse] = await Promise.all([
          api.get<any>("/vehicles"),
          api.get<any>("/drivers"),
        ]);

        const vehiclesData = Array.isArray(vehiclesDataResponse)
          ? vehiclesDataResponse
          : (vehiclesDataResponse as any).data || [];
        const driversData = Array.isArray(driversDataResponse)
          ? driversDataResponse
          : (driversDataResponse as any).data || [];

        const initial: VehiclePosition[] = vehiclesData.map((v: any) => {
          const driver = driversData.find((d: any) => d.id === v.driverId);
          return {
            vehicleId: v.id,
            driverId: v.driverId || "",
            licensePlate: v.plateNumber || v.licensePlate,
            driverName: driver ? driver.fullName : "Chưa phân công",
            latitude:
              v.lastKnownLocation?.coordinates?.[1] ||
              10.762622 + (Math.random() - 0.5) * 0.05,
            longitude:
              v.lastKnownLocation?.coordinates?.[0] ||
              106.660172 + (Math.random() - 0.5) * 0.05,
            speed: 0,
            heading: 0,
            status: statusMap[v.status] || "offline",
            lastUpdate: v.updatedAt || new Date().toISOString(),
          };
        });
        setVehicles(initial);
      } catch (err) {
        console.error("Failed to load vehicles:", err);
      }
    };

    loadVehicles();
    initSocket();

    return () => {
      disconnectSocket();
    };
  }, [initSocket]);

  const filteredVehicles = vehicles.filter((v) =>
    filter === "all" ? true : v.status === filter,
  );

  const stats = {
    total: vehicles.length,
    active: vehicles.filter((v) => v.status === "active").length,
    idle: vehicles.filter((v) => v.status === "idle").length,
    offline: vehicles.filter((v) => v.status === "offline").length,
    maintenance: vehicles.filter((v) => v.status === "maintenance").length,
    alerts: alerts.filter((a) => !a.resolved).length,
  };

  const resolveAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, resolved: true } : a)),
    );
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4 lg:p-5 bg-background min-h-0 overflow-y-auto lg:overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 text-text">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <Navigation size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold m-0 tracking-tight">
              Giám sát hành trình
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isConnected ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-success animate-pulse" : "bg-danger"}`}
                />
                {isConnected ? "Live" : "Offline"}
              </div>
              <span className="text-text-dim text-xs">•</span>
              <span className="text-text-dim text-xs">
                {stats.total} phương tiện
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 bg-surface-low p-1 rounded-xl border border-border">
          {(["all", "active", "idle", "offline"] as const).map((f) => (
            <button
              key={f}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg cursor-pointer text-xs sm:text-sm font-medium transition-all ${filter === f ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-text-dim hover:text-text hover:bg-surface-high"}`}
              onClick={() => setFilter(f)}
            >
              <span className="truncate">
                {f === "all"
                  ? "Tất cả"
                  : f === "active"
                    ? "Đang chạy"
                    : f === "idle"
                      ? "Sẵn sàng"
                      : "Ngoại tuyến"}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${filter === f ? "bg-white/20" : "bg-surface-highest"}`}
              >
                {f === "all" ? stats.total : stats[f]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 shrink-0">
        <div className="flex flex-col gap-1 p-4 bg-surface rounded-2xl border border-border relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Truck size={48} className="text-info" />
          </div>
          <span className="text-text-dim text-xs font-medium uppercase tracking-wider">
            Tổng đội xe
          </span>
          <div className="text-3xl font-bold text-text tabular-nums">
            {stats.total}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-info mt-1">
            <CheckCircle size={10} /> 100% khả dụng
          </div>
        </div>
        <div className="flex flex-col gap-1 p-4 bg-surface rounded-2xl border border-border border-l-4 border-l-success relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={48} className="text-success" />
          </div>
          <span className="text-text-dim text-xs font-medium uppercase tracking-wider">
            Đang vận hành
          </span>
          <div className="text-3xl font-bold tabular-nums text-success">
            {stats.active}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-success mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />{" "}
            Real-time active
          </div>
        </div>
        <div className="flex flex-col gap-1 p-4 bg-surface rounded-2xl border border-border border-l-4 border-l-warning relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock size={48} className="text-warning" />
          </div>
          <span className="text-text-dim text-xs font-medium uppercase tracking-wider">
            Đang chờ việc
          </span>
          <div className="text-3xl font-bold tabular-nums text-warning">
            {stats.idle}
          </div>
          <div className="text-[10px] text-text-dim mt-1">
            Sẵn sàng điều động
          </div>
        </div>
        <div className="flex flex-col gap-1 p-4 bg-surface rounded-2xl border border-border border-l-4 border-l-danger relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle size={48} className="text-danger" />
          </div>
          <span className="text-text-dim text-xs font-medium uppercase tracking-wider">
            Cảnh báo hệ thống
          </span>
          <div className="text-3xl font-bold tabular-nums text-danger">
            {stats.alerts}
          </div>
          <div className="text-[10px] text-danger/80 mt-1">
            Yêu cầu xử lý ngay
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_360px] gap-4 flex-1 lg:max-h-[75vh]">
        {/* Map Container */}
        <div className="card overflow-hidden relative shadow-lg h-[400px] sm:h-[500px] lg:h-full">
          <LiveTrackingMap
            vehicles={filteredVehicles}
            selectedVehicle={selectedVehicle}
            onVehicleSelect={setSelectedVehicle}
          />

          {/* Floating Selected Vehicle Detail */}
          {selectedVehicle && (
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-[320px] bg-surface/90 backdrop-blur-xl rounded-2xl border border-white/10 p-5 border-t-4 border-t-primary shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-5 duration-300 z-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-bold text-text-dim m-0 uppercase tracking-[0.2em]">
                  Chi tiết phương tiện
                </h3>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-text-dim transition-colors"
                >
                  <RefreshCw size={14} className="rotate-45" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
                      selectedVehicle.status === "active"
                        ? "bg-success/20 text-success"
                        : selectedVehicle.status === "idle"
                          ? "bg-warning/20 text-warning"
                          : "bg-text-dim/20 text-text-dim"
                    }`}
                  >
                    <Truck size={24} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-lg font-black text-text leading-tight tracking-tight truncate">
                      {selectedVehicle.licensePlate}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          selectedVehicle.status === "active"
                            ? "bg-success animate-pulse"
                            : selectedVehicle.status === "idle"
                              ? "bg-warning"
                              : "bg-text-dim"
                        }`}
                      />
                      <span className="text-[10px] font-bold text-text-dim uppercase">
                        {selectedVehicle.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  <DetailItem
                    label="Tài xế"
                    value={selectedVehicle.driverName}
                    icon={<Activity size={14} />}
                  />
                    <DetailItem
                      label="Tốc độ"
                      value={`${selectedVehicle.speed.toFixed(0)} km/h`}
                      icon={<Navigation size={14} />}
                    />
                    <DetailItem
                      label="Cập nhật"
                      value={formatDistanceToNow(
                        new Date(selectedVehicle.lastUpdate),
                        { addSuffix: false },
                      )}
                      icon={<Clock size={14} />}
                    />
                </div>

                <div className="flex gap-2 mt-1">
                  <button className="flex-1 bg-primary text-white text-[11px] font-bold py-2.5 rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20">
                    Liên hệ
                  </button>
                  <button className="px-3 bg-surface-high text-text text-[11px] font-bold py-2.5 rounded-xl border border-border hover:border-primary transition-all">
                    Lịch sử
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4 overflow-hidden lg:h-[75vh]">
          {/* Active Alerts Glass Panel */}
          {alerts.filter((a) => !a.resolved).length > 0 && (
            <div className="glass rounded-2xl p-4 border-l-4 border-l-danger shadow-xl animate-in slide-in-from-right duration-300">
              <h3 className="flex items-center justify-between text-sm font-bold text-text mb-4 mt-0">
                <span className="flex items-center gap-2">
                  <AlertTriangle
                    size={18}
                    className="text-danger animate-pulse"
                  />
                  SỰ CỐ KHẨN CẤP
                </span>
                <span className="bg-danger text-white text-[10px] px-2 py-0.5 rounded-full">
                  NEW
                </span>
              </h3>
              <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                {alerts
                  .filter((a) => !a.resolved)
                  .map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start gap-3 p-3 bg-surface-highest/40 backdrop-blur-md rounded-xl border border-white/5 group"
                    >
                      <div className="flex-1 flex flex-col gap-1">
                        <span className="text-text text-xs leading-relaxed font-medium">
                          {alert.message}
                        </span>
                        <span className="text-text-dim text-[10px] flex items-center gap-1">
                          <Clock size={10} />
                          {formatDistanceToNow(new Date(alert.timestamp), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <button
                        className="bg-success/20 text-success hover:bg-success hover:text-white transition-all p-1.5 rounded-lg opacity-0 group-hover:opacity-100"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        <CheckCircle size={14} />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Vehicle List Panel */}
          <div className="bg-surface rounded-2xl border border-border flex flex-col min-h-0 shadow-md flex-1">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-text m-0">
                <Truck size={18} className="text-primary" />
                Đội xe trực tuyến
              </h3>
              <span className="text-[11px] font-bold text-text-dim px-2 py-0.5 bg-surface-low rounded-full">
                {filteredVehicles.length} phương tiện
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 custom-scrollbar">
              {filteredVehicles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
                  <div className="w-12 h-12 bg-surface-low rounded-full flex items-center justify-center mb-3 text-text-dim">
                    <Truck size={24} />
                  </div>
                  <div className="text-sm font-medium text-text">
                    Không tìm thấy xe
                  </div>
                  <div className="text-xs text-text-dim mt-1">
                    Thay đổi bộ lọc để xem thêm
                  </div>
                </div>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <div
                    key={vehicle.vehicleId}
                    className={`group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 cursor-pointer ${
                      selectedVehicle?.vehicleId === vehicle.vehicleId
                        ? "bg-primary/10 border-primary/40 shadow-[0_20px_40px_rgba(59,130,246,0.15)] translate-x-1 ring-1 ring-primary/20"
                        : "bg-surface-low/30 border-white/5 hover:bg-surface-high/60 hover:border-border/50 hover:-translate-y-1 shadow-sm"
                    }`}
                    onClick={() =>
                      setSelectedVehicle(
                        selectedVehicle?.vehicleId === vehicle.vehicleId
                          ? null
                          : vehicle,
                      )
                    }
                  >
                    {/* Status accent strip */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-500 ${
                        vehicle.status === "active"
                          ? "bg-success shadow-[2px_0_10px_rgba(34,197,94,0.5)]"
                          : vehicle.status === "idle"
                            ? "bg-warning"
                            : "bg-text-dim/30"
                      } ${selectedVehicle?.vehicleId === vehicle.vehicleId ? "w-1.5" : "group-hover:w-1.5"}`}
                    />

                    <div className="relative shrink-0">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center relative z-10 transition-all duration-700 group-hover:rotate-3 group-hover:scale-105 shadow-2xl ${
                          vehicle.status === "active"
                            ? "bg-linear-to-br from-success to-success-dark text-white"
                            : vehicle.status === "idle"
                              ? "bg-warning/20 text-warning border border-warning/20"
                              : "bg-surface-highest/50 text-text-dim border border-white/5"
                        }`}
                      >
                        <Truck size={28} strokeWidth={2.5} />
                      </div>

                      {/* Live pulse for active */}
                      {vehicle.status === "active" && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-background rounded-full p-0.5 z-20">
                          <div className="w-full h-full bg-success rounded-full flex items-center justify-center">
                            <Activity
                              size={10}
                              className="text-white animate-pulse"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="text-[17px] font-black text-text truncate tracking-tight group-hover:text-primary-light transition-colors">
                          {vehicle.licensePlate}
                        </div>
                        {vehicle.speed > 0 ? (
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-success bg-success/10 px-2.5 py-1 rounded-full border border-success/20">
                            <div className="w-1 h-1 bg-success rounded-full animate-ping" />
                            {vehicle.speed.toFixed(0)} KM/H
                          </div>
                        ) : (
                          <div className="text-[10px] font-bold text-text-dim bg-surface-highest/40 px-2 py-0.5 rounded-md border border-white/5 uppercase tracking-tighter">
                            Static
                          </div>
                        )}
                      </div>

                      <div className="text-[11px] font-bold text-text-dim/80 truncate uppercase tracking-widest flex items-center gap-2">
                        <span>{vehicle.driverName}</span>
                        <span className="w-1 h-1 bg-white/10 rounded-full" />
                        <span
                          className={`capitalize ${
                            vehicle.status === "active"
                              ? "text-success"
                              : vehicle.status === "idle"
                                ? "text-warning"
                                : "text-text-dim"
                          }`}
                        >
                          {vehicle.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-2.5">
                        <div className="flex items-center gap-1.5 text-[10px] text-text-dim/60 font-medium">
                          <MapPin size={12} className="text-primary/50" />
                          <span className="truncate">HCMC Zone 1</span>
                        </div>
                        {vehicle.ordersCount !== undefined && (
                          <div className="text-[10px] text-primary-light font-black flex items-center gap-1">
                            <div className="w-1 h-1 bg-primary-light rounded-full" />
                            {vehicle.ordersCount} ORDERS
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className={`transition-all duration-500 ease-out ${
                        selectedVehicle?.vehicleId === vehicle.vehicleId
                          ? "opacity-100 translate-x-0 scale-100"
                          : "opacity-0 translate-x-4 scale-75 group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-2xl bg-primary text-white shadow-xl shadow-primary/40 flex items-center justify-center">
                        <Eye size={18} strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-surface-low rounded-xl border border-white/5 transition-colors hover:bg-surface-high">
      <div className="flex items-center gap-2 text-text-dim">
        <span className="text-primary-light/50">{icon}</span>
        <span className="text-[11px] font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span
        className={`text-xs font-bold tabular-nums ${highlight ? "text-primary" : "text-text"}`}
      >
        {value}
      </span>
    </div>
  );
}
