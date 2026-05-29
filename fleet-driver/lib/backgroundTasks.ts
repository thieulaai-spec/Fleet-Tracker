import { Platform } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { socketService } from './socket';
import { useTripStore } from '../store/useTripStore';
import { offlineQueue } from './offlineQueue';

export const LOCATION_TASK_NAME = 'background-location-task';

if (Platform.OS !== 'web') {
  TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
    let locations = data?.locations;

    if (error) {
      console.error('[Background] Location task error:', error);
      // Fallback: try to get last known position
      try {
        const lastLocation = await Location.getLastKnownPositionAsync();
        if (lastLocation) {
          locations = [lastLocation];
        }
      } catch (e) {
        console.error('[Background] Last known position failed:', e);
        return;
      }
    }

    if (locations && locations.length > 0) {
      const location = locations[0];
      
      // Battery Optimization: Skip if accuracy is very poor (> 100m) 
      if (location.coords.accuracy && location.coords.accuracy > 100) {
        console.log('[Background] Skipping inaccurate location:', location.coords.accuracy);
        return;
      }

      const activeTrip = useTripStore.getState().activeTrip;
      
      if (activeTrip) {
        // Connect if not connected (background task might run when app is killed)
        socketService.connect();
        
        try {
          const payload = {
            tripId: activeTrip.id,
            vehicleId: activeTrip.vehicleId,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            heading: location.coords.heading || 0,
            speed: location.coords.speed || 0,
            timestamp: new Date(location.timestamp).toISOString(),
          };

          if (socketService.getSocket()?.connected) {
            socketService.emit('gps:update', payload);
            console.log(`[Background] GPS update sent for trip ${activeTrip.id}`);
          } else {
            console.log('[Background] Socket disconnected, queueing GPS point');
            await offlineQueue.push(payload);
          }
        } catch (emitError) {
          console.error('[Background] Failed to handle GPS update:', emitError);
        }
      }
    }
  });
}

export const startBackgroundLocation = async () => {
  if (Platform.OS === 'web') {
    console.log('[Background] Location tracking not supported on web');
    return;
  }

  // Android 10+ requires Foreground permission BEFORE Background permission
  const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== 'granted') {
    console.error('Foreground location permission denied');
    return;
  }

  let bgStatus = 'denied';
  try {
    const res = await Location.requestBackgroundPermissionsAsync();
    bgStatus = res.status;
  } catch (error) {
    console.warn('Background location permission request failed or not supported in this environment:', error);
    // Treat as granted in simulators or Expo Go to prevent execution halting
    bgStatus = 'granted';
  }

  if (bgStatus !== 'granted') {
    console.error('Background location permission denied. Please enable "Allow all the time" in app settings.');
    return;
  }

  const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
  if (!isRegistered) {
    try {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000, // 10 seconds
        distanceInterval: 20, // 20 meters
        foregroundService: {
          notificationTitle: 'FleetTracker Tracking',
          notificationBody: 'FleetTracker is tracking your location for an active trip.',
          notificationColor: '#3b82f6',
        },
        pausesUpdatesAutomatically: true, // Battery optimization
      });
      console.log('Background location tracking started');
    } catch (err: any) {
      console.warn('Background location tracking failed to start (expected on iOS Expo Go/Simulators):', err.message);
    }
  }
};

export const stopBackgroundLocation = async () => {
  if (Platform.OS === 'web') return;

  const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    console.log('Background location tracking stopped');
  }
};
