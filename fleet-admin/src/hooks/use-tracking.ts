import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/components/providers/SocketProvider';
import { GpsUpdate, Alert } from '@/types';

export function useTracking() {
  const { socket, isConnected } = useSocket();
  const [vehicleLocations, setVehicleLocations] = useState<Record<string, GpsUpdate>>({});
  const [trails, setTrails] = useState<Record<string, { lat: number; lng: number }[]>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Handle vehicle location updates
  useEffect(() => {
    if (!socket) return;

    const handleLocationUpdate = (data: GpsUpdate) => {
      setVehicleLocations((prev) => ({
        ...prev,
        [data.vehicleId]: data,
      }));

      setTrails((prev) => {
        const currentTrail = prev[data.vehicleId] || [];
        // Keep last 100 points
        const newTrail = [...currentTrail, { lat: data.lat, lng: data.lng }].slice(-100);
        return {
          ...prev,
          [data.vehicleId]: newTrail,
        };
      });
    };

    const handleNewAlert = (data: Alert) => {
      setAlerts((prev) => [data, ...prev].slice(0, 50)); // Keep last 50 alerts
    };

    socket.on('vehicle:location', handleLocationUpdate);
    socket.on('alert:new', handleNewAlert);

    return () => {
      socket.off('vehicle:location', handleLocationUpdate);
      socket.off('alert:new', handleNewAlert);
    };
  }, [socket]);

  const subscribeToTrip = useCallback((tripId: string) => {
    if (socket && isConnected) {
      socket.emit('subscribe:trip', { tripId });
    }
  }, [socket, isConnected]);

  return {
    vehicleLocations,
    trails,
    alerts,
    isConnected,
    subscribeToTrip,
  };
}
