// ===== WebSocket Client =====

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(`${SOCKET_URL}/tracking`, {
      autoConnect: false,
      transports: ['websocket'],
      withCredentials: true, // Send cookies with handshake
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
}

// === Typed Events ===
export const SOCKET_EVENTS = {
  // GPS
  GPS_UPDATE: 'gps:update',
  GPS_SUBSCRIBE: 'gps:subscribe',
  GPS_UNSUBSCRIBE: 'gps:unsubscribe',

  // Alerts
  ALERT_NEW: 'alert:new',
  ALERT_RESOLVED: 'alert:resolved',

  // Orders
  ORDER_STATUS_CHANGED: 'order:status-changed',

  // Trips
  TRIP_STATUS_CHANGED: 'trip:status-changed',

  // Driver
  DRIVER_STATUS_CHANGED: 'driver:status-changed',
  DRIVER_SOS: 'driver:sos',
} as const;
