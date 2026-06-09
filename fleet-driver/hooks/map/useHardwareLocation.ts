import { useState, useEffect } from 'react';
import { Trip } from '../../store/useTripStore';
import { socketService } from '../../lib/socket';

export const useHardwareLocation = (activeTrip: Trip | null, isSocketConnected: boolean) => {
  const [hardwareLocation, setHardwareLocation] = useState<{
    latitude: number;
    longitude: number;
    heading: number;
    speed: number;
  } | null>(() => {
    if (activeTrip?.vehicle?.lastKnownLocation) {
      return {
        latitude: activeTrip.vehicle.lastKnownLocation.latitude,
        longitude: activeTrip.vehicle.lastKnownLocation.longitude,
        heading: 0,
        speed: 0,
      };
    }
    return null;
  });

  useEffect(() => {
    if (!activeTrip || !isSocketConnected) {
      setHardwareLocation(null);
      return;
    }

    console.log(`[Socket] Subscribing to trip room: trip:${activeTrip.id}`);
    socketService.emit('subscribe:trip', { tripId: activeTrip.id });

    const onTripLocation = (data: any) => {
      console.log('[Socket] Received hardware trip location:', data);
      if (data && data.latitude !== undefined && data.longitude !== undefined) {
        setHardwareLocation({
          latitude: data.latitude,
          longitude: data.longitude,
          heading: data.heading || 0,
          speed: data.speed || 0,
        });
      }
    };

    socketService.on('trip:location', onTripLocation);

    return () => {
      socketService.off('trip:location', onTripLocation);
    };
  }, [activeTrip?.id, isSocketConnected]);

  return hardwareLocation;
};
