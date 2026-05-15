import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Alert, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import Toast from 'react-native-toast-message';
import { useTripStore, TripStatus, OrderStatus } from '../../store/useTripStore';
import { socketService } from '../../lib/socket';
import { useLocationTracking } from '../useLocationTracking';

export const useMapFlow = () => {
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  
  const activeTrip = useTripStore(state => state.activeTrip);
  const updateTripStatus = useTripStore(state => state.updateTripStatus);
  const updateOrderStatus = useTripStore(state => state.updateOrderStatus);
  const fetchTrips = useTripStore(state => state.fetchTrips);
  
  const { location, errorMsg } = useLocationTracking(activeTrip);
  
  const mapRef = useRef<any>(null);
  const fitTimeoutRef = useRef<any>(null);

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
      title = 'Start Delivery';
      message = 'Confirm that you have picked up all items and are starting the delivery route.';
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
        },
      ]
    );
  }, [activeTrip, updateTripStatus]);
  
  const handleOrderStatusUpdate = useCallback((orderId: string, newStatus: OrderStatus) => {
    let title = 'Update Order';
    let message = `Change order status to ${newStatus.replace('_', ' ')}?`;

    if (newStatus === OrderStatus.PICKED_UP) {
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
            try {
              await updateOrderStatus(orderId, newStatus);
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
        },
      ]
    );
  }, [updateOrderStatus]);

  const centerOnLocation = useCallback(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [location]);

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

  const currentOrder = useMemo(() => activeTrip?.orders.find(o => o.status !== OrderStatus.DELIVERED), [activeTrip]);
  
  const openNavigation = useCallback(() => {
    if (!currentOrder) return;
    const isPickingUp = currentOrder.status === OrderStatus.ASSIGNED || currentOrder.status === OrderStatus.PENDING;
    const targetLocation = isPickingUp ? currentOrder.pickupLocation : currentOrder.deliveryLocation;
    
    if (!targetLocation) return;
    const { latitude, longitude } = targetLocation;
    
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}`,
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open map application');
      });
    }
  }, [currentOrder]);

  return {
    activeTrip,
    location,
    mapType,
    mapRef,
    errorMsg,
    currentOrder,
    handleStatusUpdate,
    handleOrderStatusUpdate,
    centerOnLocation,
    toggleMapType,
    openNavigation,
    fetchTrips,
  };
};
