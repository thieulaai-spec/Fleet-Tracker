export interface VehiclePosition {
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

export interface Alert {
  id: string;
  type: "sos" | "geofence" | "speeding" | "idle";
  vehicleId: string;
  driverName: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface TrackingStats {
  total: number;
  active: number;
  idle: number;
  offline: number;
  maintenance: number;
  alerts: number;
}
