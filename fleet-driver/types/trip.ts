export enum TripStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

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
  customerName: string;
  address: string;
  customerPhone?: string;
  status: OrderStatus;
  photoUrl?: string;
  signatureUrl?: string;
  pickupAddress: string;
  pickupLocation?: { latitude: number; longitude: number };
  deliveryLocation?: { latitude: number; longitude: number };
}

export interface Trip {
  id: string;
  vehicleId: string;
  vehicle?: {
    id: string;
    plateNumber: string;
    type: string;
    deviceId?: string | null;
    lastKnownLocation?: { latitude: number; longitude: number };
    imageUrl?: string;
  };
  driverId: string;
  driver?: {
    id: string;
    fingerprintId?: string;
  };
  status: TripStatus;
  totalDistanceKm: number;
  orders: Order[];
  plannedRoute?: { latitude: number; longitude: number }[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}
