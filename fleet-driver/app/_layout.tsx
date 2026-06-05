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

  console.log("[RootLayout] loaded:", loaded, "error:", error);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch((err) => {
        console.warn("Failed to hide splash screen:", err);
      });
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

import { NetworkBanner } from '../components/ui/NetworkBanner';
import { socketService } from '../lib/socket';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../components/ui/ExpandableToast';

const MyLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#10b981',
    background: '#ffffff',
    card: '#ffffff',
    text: '#0f172a',
    border: '#e2e8f0',
    notification: '#10b981',
  },
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const activeTrip = useTripStore((state) => state.activeTrip);
  const fetchTrips = useTripStore((state) => state.fetchTrips);
  
  const activeTripRef = useRef(activeTrip);
  const segments = useSegments();
  const router = useRouter();

  console.log("[RootLayoutNav] rendering! isAuthenticated:", isAuthenticated, "segments:", segments);

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

      const handleEnrollRequired = (data: any) => {
        // Only show fingerprint enroll prompt to driver users
        if (user?.role !== 'driver') return;
        
        // Safety check: ensure the event is targeted for this specific driver
        if (data.driverId && user?.driver?.id !== data.driverId) return;

        Toast.show({
          type: 'info',
          text1: 'Đăng Ký Vân Tay 👤',
          text2: data.message || 'Hãy đặt ngón tay lên cảm biến trên xe để đăng ký vân tay.',
          visibilityTime: 12000,
        });
      };

      const handleEnrollResult = (data: any) => {
        // Safety check: ensure the event is targeted for this specific driver if user is driver
        if (user?.role === 'driver' && data.driverId && user?.driver?.id !== data.driverId) return;

        Toast.show({
          type: data.success ? 'success' : 'error',
          text1: data.success ? 'Đăng Ký Thành Công! 🎉' : 'Đăng Ký Thất Bại ❌',
          text2: data.message || (data.success ? 'Vân tay đã liên kết thành công.' : 'Vui lòng thử lại.'),
          visibilityTime: 8000,
        });
      };

      const handleFingerprintDeleted = (data: any) => {
        // Safety check: ensure the event is targeted for this specific driver if user is driver
        if (user?.role === 'driver' && data.driverId && user?.driver?.id !== data.driverId) return;

        Toast.show({
          type: data.success ? 'success' : 'error',
          text1: data.success ? 'Xóa Vân Tay Phần Cứng! 🛡️' : 'Xóa Vân Tay Thất Bại ❌',
          text2: data.message || (data.success ? 'Bộ nhớ vân tay đã được giải phóng trên xe.' : 'Không thể xóa mẫu vân tay khỏi cảm biến.'),
          visibilityTime: 8000,
        });
      };

      const handleFingerprintAllCleared = (data: any) => {
        // Safety check: only show to admin users who requested the global clear
        if (user?.role !== 'admin') return;

        Toast.show({
          type: data.success ? 'success' : 'error',
          text1: data.success ? 'Xóa Sạch Vân Tay! 🧹' : 'Xóa Sạch Vân Tay Thất Bại ❌',
          text2: data.message || (data.success ? `Đã xóa sạch bộ nhớ vân tay trên xe (Mã xe: ${data.deviceId}).` : 'Có lỗi xảy ra khi xóa sạch bộ nhớ vân tay.'),
          visibilityTime: 10000,
        });
      };

      socketService.on('trip:assigned', handleTripAssigned);
      socketService.on('trip:cancelled', handleTripCancelled);
      socketService.on('enroll:required', handleEnrollRequired);
      socketService.on('enroll:result', handleEnrollResult);
      socketService.on('fingerprint:deleted', handleFingerprintDeleted);
      socketService.on('fingerprint:all_cleared', handleFingerprintAllCleared);

      return () => {
        socketService.off('trip:assigned', handleTripAssigned);
        socketService.off('trip:cancelled', handleTripCancelled);
        socketService.off('enroll:required', handleEnrollRequired);
        socketService.off('enroll:result', handleEnrollResult);
        socketService.off('fingerprint:deleted', handleFingerprintDeleted);
        socketService.off('fingerprint:all_cleared', handleFingerprintAllCleared);
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



  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <ThemeProvider value={MyLightTheme}>
        <NetworkBanner />
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
        <Toast config={toastConfig} topOffset={56} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
