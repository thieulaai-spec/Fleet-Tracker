export const parsePoint = (geo: any) => {
  if (!geo || !geo.coordinates) return undefined;
  return { latitude: geo.coordinates[1], longitude: geo.coordinates[0] };
};

export const parseLineString = (geo: any) => {
  if (!geo || !Array.isArray(geo.coordinates)) return undefined;
  return geo.coordinates.map((coord: any) => ({
    latitude: coord[1],
    longitude: coord[0],
  }));
};

/**
 * Fetch route from OSRM (Open Source Routing Machine)
 */
export const getRoute = async (
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 'Ok') {
      throw new Error('Failed to fetch route');
    }

    const route = data.routes[0];
    return {
      coordinates: route.geometry.coordinates.map((coord: any) => ({
        latitude: coord[1],
        longitude: coord[0],
      })),
      distance: route.distance, // meters
      duration: route.duration, // seconds
    };
  } catch (error) {
    console.error('Routing error:', error);
    return null;
  }
};
/**
 * Calculate distance between two points in meters using Haversine formula
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
};
