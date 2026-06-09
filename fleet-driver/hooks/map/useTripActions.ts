import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { TripStatus, OrderStatus } from '../../store/useTripStore';
import { socketService } from '../../lib/socket';
import { calculateDistance } from '../../utils/geo';

export const useTripActions = (
  activeTrip: any,
  location: any,
  currentOrder: any,
  updateTripStatus: (tripId: string, status: TripStatus) => Promise<any>,
  updateOrderStatus: (orderId: string, status: OrderStatus, options?: any) => Promise<any>,
  submitOrderVerification: (orderId: string, verificationData: any) => Promise<any>
) => {
  const [isVerificationVisible, setIsVerificationVisible] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'accept' | 'pickup' | 'checkpoint' | 'delivery'>('accept');
  const [verificationOrderId, setVerificationOrderId] = useState<string | null>(null);

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
              setVerificationOrderId(activeTrip.orders[0]?.id || null);
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

      const order = activeTrip?.orders.find((o: any) => o.id === orderId);
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
              setVerificationOrderId(orderId);
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
    setVerificationOrderId(currentOrder.id);
    setIsVerificationVisible(true);
  }, [currentOrder, location]);

  const handleCheckpoint = useCallback(() => {
    if (!currentOrder) return;
    setVerificationStep('checkpoint');
    setVerificationOrderId(currentOrder.id);
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
    const orderId = verificationOrderId || currentOrder?.id || activeTrip.orders[0]?.id;
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
        await updateOrderStatus(orderId, OrderStatus.DELIVERING, {
          actionLat: verificationData.latitude,
          actionLng: verificationData.longitude,
        });
        socketService.emit('order:status_change', {
          orderId,
          status: OrderStatus.DELIVERING,
        });

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

        const otherUndelivered = activeTrip.orders.filter(
          (o: any) => o.id !== orderId && o.status !== OrderStatus.DELIVERED
        );

        if (otherUndelivered.length === 0) {
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
  }, [activeTrip, currentOrder, verificationOrderId, submitOrderVerification, updateTripStatus, updateOrderStatus]);

  return {
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
  };
};
