export const parsePoint = (geo: any) => {
  if (!geo) return undefined;

  // 1. If it's already a GeoJSON object with coordinates
  if (geo.coordinates && Array.isArray(geo.coordinates)) {
    return { latitude: geo.coordinates[1], longitude: geo.coordinates[0] };
  }

  // 2. If it's an object with latitude/longitude direct keys
  if (typeof geo.latitude === 'number' && typeof geo.longitude === 'number') {
    return { latitude: geo.latitude, longitude: geo.longitude };
  }

  // 3. If it's a WKT Point string: e.g. "POINT(106.6353 10.7838)"
  if (typeof geo === 'string' && geo.toUpperCase().startsWith('POINT')) {
    try {
      const match = geo.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
      if (match) {
        return { latitude: parseFloat(match[2]), longitude: parseFloat(match[1]) };
      }
    } catch (e) {
      console.error('Error parsing WKT point:', e);
    }
  }

  // 4. If it's a WKB hex string (PostGIS standard output)
  if (typeof geo === 'string' && (geo.length === 50 || geo.length === 58 || geo.length === 42)) {
    try {
      const byteOrder = geo.substring(0, 2);
      const littleEndian = byteOrder === '01';

      const typeStr = geo.substring(2, 10);
      const isSRID = littleEndian
        ? (parseInt(typeStr.substring(6, 8), 16) & 0x20) !== 0
        : (parseInt(typeStr.substring(0, 2), 16) & 0x20) !== 0;

      const offset = isSRID ? 18 : 10;
      const xHex = geo.substring(offset, offset + 16);
      const yHex = geo.substring(offset + 16, offset + 32);

      const hexToDouble = (hex: string) => {
        const bytes = new Uint8Array(8);
        for (let i = 0; i < 8; i++) {
          const byteHex = littleEndian
            ? hex.substring((7 - i) * 2, (7 - i) * 2 + 2)
            : hex.substring(i * 2, i * 2 + 2);
          bytes[i] = parseInt(byteHex, 16);
        }
        const view = new DataView(bytes.buffer);
        return view.getFloat64(0, false);
      };

      const longitude = hexToDouble(xHex);
      const latitude = hexToDouble(yHex);

      if (!isNaN(latitude) && !isNaN(longitude)) {
        return { latitude, longitude };
      }
    } catch (e) {
      console.error('Error parsing WKB point:', e);
    }
  }

  return undefined;
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
