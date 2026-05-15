import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { socketService } from '../lib/socket';
import { Trip, TripStatus } from '../types/trip';

export const useLocationTracking = (activeTrip: Trip | null) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const watchSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let isMounted = true;

    const startTracking = async () => {
      try {
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        if (foregroundStatus !== 'granted') {
          if (isMounted) setErrorMsg('Permission to access location was denied');
          return;
        }

        await Location.requestBackgroundPermissionsAsync();

        const currentLocation = await Location.getCurrentPositionAsync({});
        if (isMounted) setLocation(currentLocation);

        if (watchSubscriptionRef.current) {
          watchSubscriptionRef.current.remove();
          watchSubscriptionRef.current = null;
        }

        const trackingOptions = {
          accuracy: Location.Accuracy.High,
          timeInterval: activeTrip?.status === TripStatus.IN_PROGRESS ? 5000 : 30000,
          distanceInterval: activeTrip?.status === TripStatus.IN_PROGRESS ? 10 : 100,
        };

        const subscription = await Location.watchPositionAsync(
          trackingOptions,
          (newLocation) => {
            if (isMounted) {
              setLocation(newLocation);
              if (activeTrip && activeTrip.status === TripStatus.IN_PROGRESS) {
                socketService.emit('gps:update', {
                  tripId: activeTrip.id,
                  vehicleId: activeTrip.vehicleId,
                  latitude: newLocation.coords.latitude,
                  longitude: newLocation.coords.longitude,
                  heading: newLocation.coords.heading || 0,
                  speed: newLocation.coords.speed || 0,
                  timestamp: new Date(newLocation.timestamp).toISOString(),
                });
              }
            }
          }
        );

        if (isMounted) {
          watchSubscriptionRef.current = subscription;
        } else {
          subscription.remove();
        }
      } catch (err) {
        console.error('GPS Setup Error:', err);
        if (isMounted) setErrorMsg('Failed to initialize GPS tracking');
      }
    };

    startTracking();

    return () => {
      isMounted = false;
      if (watchSubscriptionRef.current) {
        watchSubscriptionRef.current.remove();
        watchSubscriptionRef.current = null;
      }
    };
  }, [activeTrip?.id, activeTrip?.status]);

  return { location, errorMsg };
};
