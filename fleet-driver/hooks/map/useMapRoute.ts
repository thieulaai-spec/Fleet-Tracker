import { useState, useEffect } from 'react';
import { getRoute } from '../../utils/geo';

export const useMapRoute = (
  location: any,
  destination: { latitude: number; longitude: number } | null
) => {
  const [routeData, setRouteData] = useState<{
    coordinates: { latitude: number; longitude: number }[];
    distance: number;
    duration: number;
  } | null>(null);

  useEffect(() => {
    if (!location || !destination) {
      setRouteData(null);
      return;
    }

    const fetchLiveRoute = async () => {
      const origin = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      
      const data = await getRoute(origin, destination as any);
      if (data) {
        setRouteData(data);
      }
    };

    // Throttle routing requests to every 10 seconds or when destination changes
    const timer = setTimeout(fetchLiveRoute, 1000);
    return () => clearTimeout(timer);
  }, [location?.coords.latitude, location?.coords.longitude, destination?.latitude, destination?.longitude]);

  return { routeData, setRouteData };
};
