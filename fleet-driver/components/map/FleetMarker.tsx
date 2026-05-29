import React, { memo, useState, useEffect } from 'react';
import { View } from 'react-native';
import { MarkerComponent } from './MapComponents';
import { Truck } from 'lucide-react-native';
import { TrackedVehicle } from '@/store/useFleetTrackingStore';

interface FleetMarkerProps {
  vehicle: TrackedVehicle;
  onPress?: (vehicle: TrackedVehicle) => void;
}

export const FleetMarker = memo(({ vehicle, onPress }: FleetMarkerProps) => {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [vehicle.status, vehicle.heading]); // Exclude lat/lng from tracksViewChanges trigger to boost movement performance

  const getStatusColors = () => {
    switch (vehicle.status) {
      case 'available':
        return {
          bg: '#10b981',
        };
      case 'on_trip':
        return {
          bg: '#6366f1',
        };
      case 'maintenance':
        return {
          bg: '#f59e0b',
        };
      default:
        return {
          bg: '#64748b',
        };
    }
  };

  const statusColors = getStatusColors();

  return (
    <MarkerComponent
      coordinate={{
        latitude: vehicle.latitude,
        longitude: vehicle.longitude,
      }}
      tappable={true}
      onPress={() => onPress?.(vehicle)}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
    >
      <View
        pointerEvents="none"
        className="w-9 h-9 rounded-full border-[3px] border-white items-center justify-center shadow-lg shadow-black/30"
        style={[
          {
            backgroundColor: statusColors.bg,
            transform: [{ rotate: `${(vehicle.heading || 0) - 90}deg` }],
          }
        ]}
      >
        <Truck size={16} color="#fff" strokeWidth={3} />
      </View>
    </MarkerComponent>
  );
}, (prev, next) => {
  return (
    prev.vehicle.latitude === next.vehicle.latitude &&
    prev.vehicle.longitude === next.vehicle.longitude &&
    prev.vehicle.heading === next.vehicle.heading &&
    prev.vehicle.status === next.vehicle.status
  );
});
