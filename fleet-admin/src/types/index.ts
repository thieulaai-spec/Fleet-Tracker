// ===== FleetTracker Shared Types =====

// === User & Auth ===
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'driver';
  isActive: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// === Driver ===
export interface Driver {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  licenseClass: string;
  licenseExpiry: string;
  status: DriverStatus;
  avatarUrl?: string;
  fingerprintId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DriverStatus = 'available' | 'on_trip' | 'off_duty';

// === Vehicle ===
export interface Vehicle {
  id: string;
  plateNumber: string;
  type: VehicleType;
  maxCapacityKg: number;
  currentLoadKg: number;
  driverId?: string | null;
  driver?: Driver | null;
  deviceId?: string | null;
  status: VehicleStatus;
  imageUrl?: string;
  lastKnownLocation?: GeoPoint;
  initialLat?: number | null;
  initialLng?: number | null;
  createdAt: string;
  updatedAt: string;
  kmThisMonth?: number;
  condition?: string;
}

export type VehicleType = 'small' | 'medium' | 'large';
export type VehicleStatus = 'available' | 'delivering' | 'maintenance';

// === Order ===
export interface Order {
  id: string;
  pickupAddress: string;
  pickupLocation: GeoPoint;
  deliveryAddress: string;
  deliveryLocation: GeoPoint;
  weightKg: number;
  description?: string;
  recipientName?: string;
  recipientPhone?: string;
  category?: 'bulk' | 'fragile' | 'bulky' | 'dangerous' | 'other';
  priority?: 'low' | 'medium' | 'high';
  deliveryDeadline?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'assigned' | 'picked_up' | 'delivering' | 'delivered' | 'failed' | 'cancelled';

// === Trip ===
export interface Trip {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;
  driverId: string;
  driver?: Driver;
  orders?: Order[];
  status: TripStatus;
  startedAt?: string;
  completedAt?: string;
  totalDistanceKm?: number;
  estimatedFuelCost?: number;
  createdAt: string;
  updatedAt: string;
}

export type TripStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

// === Alert ===
export interface Alert {
  id: string;
  tripId?: string;
  vehicleId: string;
  vehicle?: Vehicle;
  driverId: string;
  driver?: Driver;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  location?: GeoPoint;
  isResolved: boolean;
  resolvedAt?: string;
  createdAt: string;
}

export type AlertType = 'speed_violation' | 'route_deviation' | 'abnormal_stop' | 'incident';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

// === KPI ===
export interface DriverKpi {
  id: string;
  driverId: string;
  totalTrips: number;
  completedTrips: number;
  completionRate: number;
  totalViolations: number;
  speedViolations: number;
  routeViolations: number;
  kpiScore: number;
  updatedAt: string;
}

// === GPS ===
export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface GpsUpdate {
  vehicleId: string;
  tripId?: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: string;
}

// === API Response ===
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// === Dispatch ===
export interface DispatchSuggestion {
  vehicle: Vehicle;
  driver: Driver;
  distanceKm: number;
  freeCapacityKg: number;
  kpiScore: number;
}
