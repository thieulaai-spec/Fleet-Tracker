"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { connectSocket, disconnectSocket, SOCKET_EVENTS } from "@/lib/socket";
import { api } from "@/lib/api";
import { VehiclePosition, Alert, TrackingStats } from "../types";
import { STATUS_MAP } from "../constants";

export function useTracking() {
  // Use Record for O(1) updates
  const [vehiclesMap, setVehiclesMap] = useState<Record<string, VehiclePosition>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const socketRef = useRef<any>(null);
  const pendingUpdatesRef = useRef<Record<string, Partial<VehiclePosition>>>({});
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized array for UI
  const vehicles = useMemo(() => Object.values(vehiclesMap), [vehiclesMap]);

  const stats = useMemo<TrackingStats>(() => ({
    total: vehicles.length,
    active: vehicles.filter((v) => v.status === "active").length,
    idle: vehicles.filter((v) => v.status === "idle").length,
    offline: vehicles.filter((v) => v.status === "offline").length,
    maintenance: vehicles.filter((v) => v.status === "maintenance").length,
    alerts: alerts.filter((a) => !a.resolved).length,
  }), [vehicles, alerts]);

  // Batching logic: 100ms interval for UI updates
  const startFlushTimer = useCallback(() => {
    if (flushTimerRef.current) return;
    
    flushTimerRef.current = setInterval(() => {
      const updates = pendingUpdatesRef.current;
      if (Object.keys(updates).length === 0) return;

      setVehiclesMap((prev) => {
        const next = { ...prev };
        Object.entries(updates).forEach(([id, data]) => {
          const existing = next[id];
          next[id] = {
            ...existing,
            ...data,
            vehicleId: id,
            lastUpdate: new Date().toISOString(),
          } as VehiclePosition;
        });
        return next;
      });
      
      pendingUpdatesRef.current = {};
    }, 100); // 10fps is perfect for smooth tracking without lag
  }, []);

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
      // Direct property mapping for speed
      pendingUpdatesRef.current[data.vehicleId] = {
        driverId: data.driverId,
        licensePlate: data.licensePlate || data.license_plate || data.plateNumber,
        driverName: data.driverName,
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed,
        heading: data.heading,
        status: STATUS_MAP[data.status],
        currentTripId: data.currentTripId,
        ordersCount: data.ordersCount,
      };
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
      pendingUpdatesRef.current[data.vehicleId || data.id] = {
        status: STATUS_MAP[data.status]
      };
    });

    socket.on(SOCKET_EVENTS.TRIP_STATUS_CHANGED, (data: any) => {
      if (data.vehicleId) {
        pendingUpdatesRef.current[data.vehicleId] = {
          status: STATUS_MAP[data.status],
          ordersCount: data.status === 'completed' ? 0 : undefined,
        };
      }
    });

    return socket;
  }, [startFlushTimer]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [vehiclesRes, driversRes] = await Promise.all([
          api.get<any>("/vehicles"),
          api.get<any>("/drivers"),
        ]);

        const vData = Array.isArray(vehiclesRes) ? vehiclesRes : vehiclesRes.data || [];
        const dData = Array.isArray(driversRes) ? driversRes : driversRes.data || [];

        const initial: Record<string, VehiclePosition> = {};
        vData.forEach((v: any) => {
          const driver = dData.find((d: any) => d.id === v.driverId);
          initial[v.id] = {
            vehicleId: v.id,
            driverId: v.driverId || "",
            licensePlate: v.plateNumber || v.licensePlate,
            driverName: driver ? driver.fullName : "Chưa phân công",
            latitude: v.lastKnownLocation?.coordinates?.[1] || 10.762622,
            longitude: v.lastKnownLocation?.coordinates?.[0] || 106.660172,
            speed: 0,
            heading: 0,
            status: STATUS_MAP[v.status] || "offline",
            lastUpdate: v.updatedAt || new Date().toISOString(),
          };
        });
        setVehiclesMap(initial);
      } catch (err) {
        console.error("Tracking initial load fail:", err);
      }
    };

    loadInitialData();
    initSocket();
    startFlushTimer();

    return () => {
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
      disconnectSocket();
    };
  }, [initSocket, startFlushTimer]);

  const resolveAlert = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, resolved: true } : a)),
    );
  }, []);

  return {
    vehicles,
    alerts,
    isConnected,
    stats,
    resolveAlert
  };
}

