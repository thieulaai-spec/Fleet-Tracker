"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { connectSocket, disconnectSocket, SOCKET_EVENTS } from "@/lib/socket";
import { api } from "@/lib/api";
import { VehiclePosition, Alert, TrackingStats } from "../types";

import { STATUS_MAP } from "../constants";

export function useTracking() {
  const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
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
          status: STATUS_MAP[data.status] || existing?.status || "active",
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
            ? { ...v, status: STATUS_MAP[data.status] || v.status }
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
            status: STATUS_MAP[v.status] || "offline",
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

  const stats = useMemo<TrackingStats>(() => ({
    total: vehicles.length,
    active: vehicles.filter((v) => v.status === "active").length,
    idle: vehicles.filter((v) => v.status === "idle").length,
    offline: vehicles.filter((v) => v.status === "offline").length,
    maintenance: vehicles.filter((v) => v.status === "maintenance").length,
    alerts: alerts.filter((a) => !a.resolved).length,
  }), [vehicles, alerts]);

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
