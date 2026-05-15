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
