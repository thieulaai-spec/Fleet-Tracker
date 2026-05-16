import { useState } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { calculateDistance } from '@/utils/geo';

const GEOFENCE_RADIUS = 200; // meters

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export const useGeofencing = () => {
  const [isLoading, setIsLoading] = useState(false);

  const checkProximity = async (
    targetLocation: LocationCoords,
    pointName: string = 'point'
  ): Promise<LocationCoords | null> => {
    setIsLoading(true);
    try {
      // 1. Request permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to verify your delivery progress.'
        );
        return null;
      }

      // 2. Get current position with high accuracy for geofencing
      const location = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.High 
      });
      const { latitude, longitude } = location.coords;

      // 3. Calculate distance
      const distance = calculateDistance(
        latitude,
        longitude,
        targetLocation.latitude,
        targetLocation.longitude
      );

      // 4. Geofencing check
      if (distance > GEOFENCE_RADIUS) {
        Alert.alert(
          'Too Far Away',
          `You are currently ${Math.round(distance)}m away from the ${pointName}.\n\nYou must be within ${GEOFENCE_RADIUS}m to perform this action.`
        );
        return null;
      }

      return { latitude, longitude };
    } catch (error) {
      console.error('Geofencing error:', error);
      Alert.alert(
        'Location Error',
        'Could not verify your current location. Please check your GPS signal and try again.'
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = async (): Promise<LocationCoords | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;

      const location = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.Balanced 
      });
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  };

  return {
    checkProximity,
    getCurrentLocation,
    isLoading,
    GEOFENCE_RADIUS
  };
};
