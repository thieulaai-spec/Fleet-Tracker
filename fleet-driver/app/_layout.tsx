import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '../components/useColorScheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

import { useAuthStore } from '../store/useAuthStore';
import { useTripStore, TripStatus } from '../store/useTripStore';
import { useRouter, useSegments } from 'expo-router';
import { startBackgroundLocation, stopBackgroundLocation } from '../lib/backgroundTasks';
import { NetworkBanner } from '../components/ui/NetworkBanner';
import { socketService } from '../lib/socket';

import Toast from 'react-native-toast-message';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const activeTrip = useTripStore((state) => state.activeTrip);
  const fetchTrips = useTripStore((state) => state.fetchTrips);
  
  const activeTripRef = useRef(activeTrip);
  const segments = useSegments();
  const router = useRouter();

  // Keep ref in sync
  useEffect(() => {
    activeTripRef.current = activeTrip;
  }, [activeTrip]);

  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect();

      const handleTripAssigned = (data: any) => {
        Toast.show({
          type: 'success',
          text1: 'New Trip Assigned! 🚛',
          text2: `You have a new assignment: ${data.id.substring(0, 8)}`,
          visibilityTime: 6000,
        });
        fetchTrips();
      };

      const handleTripCancelled = (data: any) => {
        Toast.show({
          type: 'error',
          text1: 'Trip Cancelled ❌',
          text2: `Trip ${data.tripId.substring(0, 8)} has been cancelled by dispatcher`,
          visibilityTime: 6000,
        });
        fetchTrips();
        // Use ref to check the latest activeTrip
        if (activeTripRef.current?.id === data.tripId) {
          router.replace('/(tabs)');
        }
      };

      socketService.on('trip:assigned', handleTripAssigned);
      socketService.on('trip:cancelled', handleTripCancelled);

      return () => {
        socketService.off('trip:assigned', handleTripAssigned);
        socketService.off('trip:cancelled', handleTripCancelled);
      };
    } else {
      // Disconnect socket when not authenticated
      socketService.disconnect();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const rootSegment = segments[0];
    const inAuthGroup = rootSegment === '(tabs)';
    
    // Use a single stable check for redirection to avoid loops
    if (!isAuthenticated && inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && rootSegment === 'login') {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments[0]]); // Only depend on isAuthenticated and the first segment

  useEffect(() => {
    if (activeTrip && activeTrip.status === TripStatus.IN_PROGRESS) {
      startBackgroundLocation();
    } else {
      stopBackgroundLocation();
    }
  }, [activeTrip?.id, activeTrip?.status]);

  return (
    <ThemeProvider value={DarkTheme}>
      <NetworkBanner />
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <Toast />
    </ThemeProvider>
  );
}
