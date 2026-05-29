import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Alert, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { useTripStore, TripStatus, OrderStatus } from '../../store/useTripStore';
import { socketService } from '../../lib/socket';
import { useLocationTracking } from '../useLocationTracking';
import { getRoute, calculateDistance } from '../../utils/geo';

export const useMapFlow = () => {
  const router = useRouter();
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const [routeData, setRouteData] = useState<{
    coordinates: { latitude: number; longitude: number }[];
    distance: number;
    duration: number;
  } | null>(null);
  const [isFollowing, setIsFollowing] = useState(true);
  const [isNavMode, setIsNavMode] = useState(false);
  
  const activeTrip = useTripStore(state => state.activeTrip);
  const updateTripStatus = useTripStore(state => state.updateTripStatus);
  const updateOrderStatus = useTripStore(state => state.updateOrderStatus);
  const submitOrderVerification = useTripStore(state => state.submitOrderVerification);
  const fetchTrips = useTripStore(state => state.fetchTrips);
  
  const [isVerificationVisible, setIsVerificationVisible] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'accept' | 'pickup' | 'checkpoint' | 'delivery'>('accept');
  
  const { location: phoneLocation, errorMsg } = useLocationTracking(activeTrip);
  const [hardwareLocation, setHardwareLocation] = useState<{
    latitude: number;
    longitude: number;
    heading: number;
    speed: number;
  } | null>(null);

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
    return phoneLocation;
  }, [phoneLocation, hardwareLocation]);

  useEffect(() => {
    if (!activeTrip) {
      setHardwareLocation(null);
      return;
    }

    // Subscribe to trip room to receive backend prioritized GPS coordinates
    socketService.emit('subscribe:trip', { tripId: activeTrip.id });

    const onTripLocation = (data: any) => {
      if (data && data.latitude !== undefined && data.longitude !== undefined) {
        setHardwareLocation({
          latitude: data.latitude,
          longitude: data.longitude,
          heading: data.heading || 0,
          speed: data.speed || 0,
        });
      }
    };

    socketService.on('trip:location', onTripLocation);

    return () => {
      socketService.off('trip:location', onTripLocation);
    };
  }, [activeTrip?.id]);
  
  const mapRef = useRef<any>(null);
  const fitTimeoutRef = useRef<any>(null);

  const currentOrder = useMemo(() => activeTrip?.orders.find(o => o.status !== OrderStatus.DELIVERED), [activeTrip]);

  const destination = useMemo(() => {
    if (!currentOrder) return null;
    // Only go to delivery location if order is ALREADY picked up or currently delivering
    const isHeadingToDelivery = currentOrder.status === OrderStatus.PICKED_UP || currentOrder.status === OrderStatus.DELIVERING;
    return isHeadingToDelivery ? currentOrder.deliveryLocation : currentOrder.pickupLocation;
  }, [currentOrder]);

  // Fetch route when location or destination changes
  useEffect(() => {
    if (!location || !destination) {
      setRouteData(null);
      return;
    }

    const fetchLiveRoute = async () => {
      const origin = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      
      const data = await getRoute(origin, destination as any);
      if (data) {
        setRouteData(data);
      }
    };

    // Throttle routing requests to every 10 seconds or when destination changes
    const timer = setTimeout(fetchLiveRoute, 1000);
    return () => clearTimeout(timer);
  }, [location?.coords.latitude, location?.coords.longitude, destination?.latitude, destination?.longitude]);

  // Auto-center/rotate when location updates
  useEffect(() => {
    if (!location || !mapRef.current) return;

    if (isNavMode) {
      mapRef.current.animateCamera({
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        heading: location.coords.heading || 0,
        pitch: 0,
        zoom: 18,
      }, { duration: 600 });
    } else if (isFollowing) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 600);
    }
  }, [location?.coords.latitude, location?.coords.longitude, location?.coords.heading, isFollowing, isNavMode]);

  useEffect(() => {
    if (activeTrip?.plannedRoute && activeTrip.plannedRoute.length > 0) {
      if (fitTimeoutRef.current) clearTimeout(fitTimeoutRef.current);
      
      fitTimeoutRef.current = setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.fitToCoordinates(activeTrip.plannedRoute as any, {
            edgePadding: { top: 150, right: 60, bottom: 420, left: 60 },
            animated: true,
          });
        }
      }, 1000);
    }

    return () => {
      if (fitTimeoutRef.current) clearTimeout(fitTimeoutRef.current);
    };
  }, [activeTrip?.id, activeTrip?.status]);

  const handleStatusUpdate = useCallback((newStatus: TripStatus) => {
    if (!activeTrip) return;

    let title = 'Update Status';
    let message = `Are you sure you want to change status to ${newStatus}?`;

    if (newStatus === TripStatus.IN_PROGRESS) {
      title = 'Deploy Mission';
      message = 'Start your journey to the pickup point? This will activate real-time tracking.';
    } else if (newStatus === TripStatus.COMPLETED) {
      title = 'Complete Trip';
      message = 'Confirm that all orders have been delivered successfully.';
    }

    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            if (newStatus === TripStatus.IN_PROGRESS) {
              setVerificationStep('accept');
              setIsVerificationVisible(true);
            } else {
              try {
                await updateTripStatus(activeTrip.id, newStatus);
                socketService.emit('trip:status_change', {
                  tripId: activeTrip.id,
                  status: newStatus
                });
                Toast.show({
                  type: 'success',
                  text1: 'Status Updated',
                  text2: `Trip is now ${newStatus}`
                });
              } catch (err: any) {
                Toast.show({
                  type: 'error',
                  text1: 'Update Failed',
                  text2: err.message
                });
              }
            }
          }
        },
      ]
    );
  }, [activeTrip, updateTripStatus]);
  
  const handleOrderStatusUpdate = useCallback((orderId: string, newStatus: OrderStatus) => {
    let title = 'Update Order';
    let message = `Change order status to ${newStatus.replace('_', ' ')}?`;

    if (newStatus === OrderStatus.PICKED_UP) {
      if (!location) {
        Alert.alert('Proximity Warning', 'Missing current location data. Please check your GPS.');
        return;
      }

      const order = activeTrip?.orders.find(o => o.id === orderId);
      if (!order) {
        Alert.alert('Error', 'Order not found in active trip.');
        return;
      }

      if (!order.pickupLocation) {
        Alert.alert('Error', 'Pickup location not specified for this order.');
        return;
      }

      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        order.pickupLocation.latitude,
        order.pickupLocation.longitude
      );

      // Geofencing: Must be within 200m
      if (distance > 200) {
        Alert.alert(
          'Proximity Warning',
          `You are still ${Math.round(distance)}m away from the pickup point. Please arrive within 200m to confirm pickup.`
        );
        return;
      }

      title = 'Confirm Pickup';
      message = 'Have you successfully picked up the items for this order?';
    } else if (newStatus === OrderStatus.DELIVERING) {
      title = 'Start Delivery';
      message = 'Are you starting the delivery for this order?';
    }

    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            if (newStatus === OrderStatus.PICKED_UP) {
              setVerificationStep('pickup');
              setIsVerificationVisible(true);
            } else {
              try {
                await updateOrderStatus(orderId, newStatus, {
                  actionLat: location?.coords.latitude,
                  actionLng: location?.coords.longitude,
                });
                socketService.emit('order:status_change', {
                  orderId,
                  status: newStatus
                });
                Toast.show({
                  type: 'success',
                  text1: 'Order Updated',
                  text2: `Status is now ${newStatus.replace('_', ' ')}`
                });
              } catch (err: any) {
                Toast.show({
                  type: 'error',
                  text1: 'Update Failed',
                  text2: err.message
                });
              }
            }
          }
        },
      ]
    );
  }, [updateOrderStatus, location, activeTrip]);

  const centerOnLocation = useCallback(() => {
    if (location && mapRef.current) {
      if (isFollowing && !isNavMode) {
        setIsNavMode(true);
      } else {
        setIsFollowing(true);
        setIsNavMode(false);
      }
      
      const camera = {
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        heading: isNavMode ? (location.coords.heading || 0) : 0,
        pitch: 0,
        zoom: isNavMode ? 18 : 15,
      };
      mapRef.current.animateCamera(camera, { duration: 600 });
    }
  }, [location, isFollowing, isNavMode]);

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
    
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}`,
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open map application');
      });
    }
  }, [destination]);

  const zoomToDestination = useCallback(() => {
    if (destination && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: destination.latitude,
        longitude: destination.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
  }, [destination]);

  const handleProofOfDelivery = useCallback(() => {
    if (!currentOrder || !location) {
      Alert.alert('Error', 'Missing mission or location data');
      return;
    }

    if (!currentOrder.deliveryLocation) {
      Alert.alert('Error', 'Delivery location not specified for this order');
      return;
    }

    const distance = calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      currentOrder.deliveryLocation.latitude,
      currentOrder.deliveryLocation.longitude
    );

    // Geofencing: Must be within 200m
    if (distance > 200) {
      Alert.alert(
        'Proximity Warning',
        `You are still ${Math.round(distance)}m away from the delivery point. Please arrive within 200m to submit proof.`
      );
      return;
    }

    // Open Verification Modal for delivery
    setVerificationStep('delivery');
    setIsVerificationVisible(true);
  }, [currentOrder, location]);

  const handleCheckpoint = useCallback(() => {
    if (!currentOrder) return;
    setVerificationStep('checkpoint');
    setIsVerificationVisible(true);
  }, [currentOrder]);

  const handleVerificationSubmit = useCallback(async (verificationData: {
    step: string;
    fingerprintStatus: boolean;
    facePhotoUrl: string;
    cargoPhotoUrl?: string;
    latitude?: number;
    longitude?: number;
  }) => {
    if (!activeTrip) return;
    const orderId = currentOrder?.id || activeTrip.orders[0]?.id;
    if (!orderId) return;

    try {
      await submitOrderVerification(orderId, verificationData);

      if (verificationData.step === 'accept') {
        await updateTripStatus(activeTrip.id, TripStatus.IN_PROGRESS);
        socketService.emit('trip:status_change', {
          tripId: activeTrip.id,
          status: TripStatus.IN_PROGRESS,
        });
        Toast.show({
          type: 'success',
          text1: 'Hành trình bắt đầu',
          text2: 'Chuyến đi đã chuyển sang trạng thái Đang thực hiện',
        });
      } else if (verificationData.step === 'pickup') {
        // 1. Transition order from PICKED_UP to DELIVERING immediately
        await updateOrderStatus(orderId, OrderStatus.DELIVERING, {
          actionLat: verificationData.latitude,
          actionLng: verificationData.longitude,
        });
        socketService.emit('order:status_change', {
          orderId,
          status: OrderStatus.DELIVERING,
        });

        // 2. Transition trip from ACCEPTED to IN_PROGRESS immediately
        await updateTripStatus(activeTrip.id, TripStatus.IN_PROGRESS);
        socketService.emit('trip:status_change', {
          tripId: activeTrip.id,
          status: TripStatus.IN_PROGRESS,
        });

        Toast.show({
          type: 'success',
          text1: 'Đã lấy hàng & Bắt đầu giao',
          text2: 'Chuyến đi hiện đã chuyển sang trạng thái Đang giao hàng',
        });
      } else if (verificationData.step === 'checkpoint') {
        socketService.emit('order:status_change', {
          orderId,
          status: OrderStatus.DELIVERING,
        });
        Toast.show({
          type: 'success',
          text1: 'Ghi nhận chặng',
          text2: 'Lưu minh chứng chặng thành công',
        });
      } else if (verificationData.step === 'delivery') {
        socketService.emit('order:status_change', {
          orderId,
          status: OrderStatus.DELIVERED,
        });

        // Auto finalize trip if all other orders are delivered
        const otherUndelivered = activeTrip.orders.filter(
          (o) => o.id !== orderId && o.status !== OrderStatus.DELIVERED
        );

        if (otherUndelivered.length === 0) {
          // Auto finalize trip to completed
          await updateTripStatus(activeTrip.id, TripStatus.COMPLETED);
          socketService.emit('trip:status_change', {
            tripId: activeTrip.id,
            status: TripStatus.COMPLETED,
          });
          Toast.show({
            type: 'success',
            text1: 'Giao hàng thành công',
            text2: 'Đã hoàn thành toàn bộ chuyến đi!',
          });
        } else {
          Toast.show({
            type: 'success',
            text1: 'Đã bàn giao hàng',
            text2: 'Tiếp tục hành trình giao các đơn tiếp theo',
          });
        }
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Xác thực thất bại',
        text2: err.message || 'Vui lòng thử lại',
      });
      throw err;
    }
  }, [activeTrip, currentOrder, submitOrderVerification, updateTripStatus, updateOrderStatus]);

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
    handleVerificationSubmit,
  };
};
