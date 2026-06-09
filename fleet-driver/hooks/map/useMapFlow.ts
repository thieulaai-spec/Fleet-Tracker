import { useState, useCallback, useMemo } from 'react';
import Toast from 'react-native-toast-message';
import { useTripStore, TripStatus, OrderStatus } from '../../store/useTripStore';
import { useLocationTracking } from '../useLocationTracking';
import { useHardwareLocation } from './useHardwareLocation';
import { useMapRoute } from './useMapRoute';
import { useMapCamera } from './useMapCamera';
import { useTripActions } from './useTripActions';

export const useMapFlow = () => {
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const activeTrip = useTripStore(state => state.activeTrip);
  const updateTripStatus = useTripStore(state => state.updateTripStatus);
  const updateOrderStatus = useTripStore(state => state.updateOrderStatus);
  const submitOrderVerification = useTripStore(state => state.submitOrderVerification);
  const fetchTrips = useTripStore(state => state.fetchTrips);
  const isSocketConnected = useTripStore(state => state.isSocketConnected);

  // 1. Location Tracking
  const { errorMsg } = useLocationTracking(activeTrip);
  const hardwareLocation = useHardwareLocation(activeTrip, isSocketConnected);

  const location = useMemo(() => {
    if (hardwareLocation) {
      return {
        coords: {
          latitude: hardwareLocation.latitude,
          longitude: hardwareLocation.longitude,
          heading: hardwareLocation.heading,
          speed: hardwareLocation.speed,
        },
      } as any;
    }
    return null;
  }, [hardwareLocation]);

  // 2. Active Order and Destination selection
  const currentOrder = useMemo(() => {
    if (!activeTrip) return null;
    if (selectedOrderId) {
      const found = activeTrip.orders.find(o => o.id === selectedOrderId);
      if (found && found.status !== OrderStatus.DELIVERED) {
        return found;
      }
    }
    return activeTrip.orders.find(o => o.status !== OrderStatus.DELIVERED);
  }, [activeTrip, selectedOrderId]);

  const destination = useMemo<{ latitude: number; longitude: number } | null>(() => {
    if (!currentOrder) return null;
    const isHeadingToDelivery = currentOrder.status === OrderStatus.PICKED_UP || currentOrder.status === OrderStatus.DELIVERING;
    return (isHeadingToDelivery ? currentOrder.deliveryLocation : currentOrder.pickupLocation) || null;
  }, [currentOrder]);

  // 3. Sub-hooks for Camera, Route and Trip Actions
  const { routeData } = useMapRoute(location, destination);
  
  const {
    mapRef,
    isFollowing,
    setIsFollowing,
    isNavMode,
    setIsNavMode,
    centerOnLocation,
    zoomToDestination,
  } = useMapCamera(location, destination, activeTrip);

  const {
    isVerificationVisible,
    setIsVerificationVisible,
    verificationStep,
    setVerificationStep,
    verificationOrderId,
    setVerificationOrderId,
    handleStatusUpdate,
    handleOrderStatusUpdate,
    handleProofOfDelivery,
    handleCheckpoint,
    handleVerificationSubmit,
  } = useTripActions(
    activeTrip,
    location,
    currentOrder,
    updateTripStatus,
    updateOrderStatus,
    submitOrderVerification
  );

  // 4. Map settings and actions
  const toggleMapType = useCallback(() => {
    const types: ('standard' | 'satellite' | 'hybrid')[] = ['standard', 'satellite', 'hybrid'];
    const currentIndex = types.indexOf(mapType);
    const nextIndex = (currentIndex + 1) % types.length;
    const nextType = types[nextIndex];
    setMapType(nextType);
    
    Toast.show({
      type: 'info',
      text1: 'Map View Updated',
      text2: `Switched to ${nextType.toUpperCase()} mode`,
      position: 'bottom',
      bottomOffset: 120
    });
  }, [mapType]);

  const openNavigation = useCallback(() => {
    if (!destination) return;
    const { latitude, longitude } = destination;
    const url = `geo:0,0?q=${latitude},${longitude}`;
    
    import('react-native').then(({ Linking, Alert, Platform }) => {
      const targetUrl = Platform.select({
        ios: `maps:0,0?q=${latitude},${longitude}`,
        android: url,
      });

      if (targetUrl) {
        Linking.openURL(targetUrl).catch(() => {
          Alert.alert('Error', 'Could not open map application');
        });
      }
    });
  }, [destination]);

  return {
    activeTrip,
    location,
    mapType,
    mapRef,
    errorMsg,
    currentOrder,
    routeData,
    handleStatusUpdate,
    handleOrderStatusUpdate,
    handleProofOfDelivery,
    handleCheckpoint,
    centerOnLocation,
    toggleMapType,
    openNavigation,
    zoomToDestination,
    fetchTrips,
    isFollowing,
    setIsFollowing,
    isNavMode,
    setIsNavMode,
    isVerificationVisible,
    setIsVerificationVisible,
    verificationStep,
    setVerificationStep,
    verificationOrderId,
    setVerificationOrderId,
    handleVerificationSubmit,
    selectedOrderId,
    setSelectedOrderId,
  };
};
