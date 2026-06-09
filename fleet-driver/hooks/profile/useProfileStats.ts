import { useMemo } from 'react';

export const useProfileStats = (tripHistory: any[]) => {
  return useMemo(() => {
    const completedTrips = Array.isArray(tripHistory) ? tripHistory.filter(t => t && t.status === 'completed') : [];
    const totalDistance = Array.isArray(tripHistory) 
      ? tripHistory.reduce((acc, trip) => acc + (Number(trip.totalDistanceKm) || 0), 0) 
      : 0;
    
    const calculateAvgSpeed = () => {
      if (completedTrips.length === 0) return 0;
      
      let totalHours = 0;
      let distanceWithTime = 0;
      
      completedTrips.forEach(trip => {
        if (trip.startedAt && trip.completedAt) {
          const start = new Date(trip.startedAt).getTime();
          const end = new Date(trip.completedAt).getTime();
          const durationHours = (end - start) / (1000 * 60 * 60);
          
          if (durationHours > 0) {
            totalHours += durationHours;
            distanceWithTime += (Number(trip.totalDistanceKm) || 0);
          }
        }
      });
      
      if (totalHours === 0) return 0;
      return (distanceWithTime / totalHours).toFixed(1);
    };

    const avgSpeed = calculateAvgSpeed();

    return {
      completedCount: completedTrips.length,
      totalDistance: (totalDistance || 0).toFixed(1),
      avgSpeed: `${avgSpeed}`,
    };
  }, [tripHistory]);
};
