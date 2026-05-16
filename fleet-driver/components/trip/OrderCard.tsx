import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { MapPin, Navigation, Camera, Package, Truck, CheckCircle2 } from 'lucide-react-native';
import * as Location from 'expo-location';
import { Order, OrderStatus } from '@/types/trip';
import { calculateDistance } from '@/utils/geo';
import { useGeofencing } from '@/hooks/useGeofencing';

interface OrderCardProps {
  order: Order;
  index: number;
  onNavigate?: (latitude: number, longitude: number) => void;
  onProof?: (orderId: string) => void;
  onStatusUpdate?: (orderId: string, status: OrderStatus, options?: { actionLat?: number, actionLng?: number }) => Promise<void>;
  canSubmitProof?: boolean;
}

const GEOFENCE_RADIUS = 200; // meters

export const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  index, 
  onNavigate, 
  onProof, 
  onStatusUpdate,
  canSubmitProof 
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { checkProximity, getCurrentLocation, isLoading: isCheckingLocation } = useGeofencing();

  const isDelivered = order.status === OrderStatus.DELIVERED;
  const isPickedUp = order.status === OrderStatus.PICKED_UP;
  const isDelivering = order.status === OrderStatus.DELIVERING;
  const isAssigned = order.status === OrderStatus.ASSIGNED;

  const currentAddress = isAssigned ? order.pickupAddress : order.address;
  const currentLocation = isAssigned ? order.pickupLocation : order.deliveryLocation;
  const isPickupPhase = isAssigned;

  const handleStatusUpdate = async (status: OrderStatus) => {
    if (!onStatusUpdate) return;

    setIsUpdating(true);
    try {
      let actionLat: number | undefined;
      let actionLng: number | undefined;

      // Only check proximity for PICKED_UP (Arrived at Pickup)
      if (status === OrderStatus.PICKED_UP) {
        if (!currentLocation) {
          Alert.alert('Error', 'Missing location data for this order.');
          return;
        }

        const coords = await checkProximity(
          currentLocation, 
          isPickupPhase ? 'pickup point' : 'delivery point'
        );
        
        if (!coords) return;
        actionLat = coords.latitude;
        actionLng = coords.longitude;
      } else {
        // Just get current location for audit without blocking
        const coords = await getCurrentLocation();
        if (coords) {
          actionLat = coords.latitude;
          actionLng = coords.longitude;
        }
      }

      // Proceed with update
      await onStatusUpdate(order.id, status, {
        actionLat,
        actionLng
      });
    } catch (error) {
      console.error('Status update error:', error);
      Alert.alert('Update Failed', 'An error occurred while updating the status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProof = async () => {
    if (!onProof) return;

    if (!currentLocation) {
      Alert.alert('Error', 'Missing location data for this order.');
      return;
    }

    const coords = await checkProximity(currentLocation, 'delivery point');
    if (!coords) return;

    onProof(order.id);
  };

  return (
    <BlurView 
      intensity={10} 
      tint="light"
      className="rounded-[32px] p-5 mb-5 border border-white/5 overflow-hidden"
    >
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3 flex-1 mr-4">
          <View className="w-10 h-10 rounded-full bg-indigo-500/20 items-center justify-center">
            <Text className="text-indigo-400 font-black text-xs">{index + 1}</Text>
          </View>
          <Text className="text-white text-lg font-black flex-1" numberOfLines={1}>
            {order.customerName}
          </Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${isDelivered ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
          <Text className={`text-[10px] font-black uppercase ${isDelivered ? 'text-emerald-400' : 'text-amber-400'}`}>
            {order.status}
          </Text>
        </View>
      </View>

      <View className="flex-row items-start gap-3 mb-6 bg-white/5 p-4 rounded-2xl border border-white/5">
        <View className="mt-1">
          {isPickupPhase ? (
            <Package size={18} color="#60a5fa" />
          ) : (
            <MapPin size={18} color="#f87171" />
          )}
        </View>
        <View className="flex-1">
          <Text className="text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1">
            {isPickupPhase ? 'Pickup Point' : 'Delivery Destination'}
          </Text>
          <Text className="text-slate-300 text-sm leading-5 font-medium">
            {currentAddress}
          </Text>
        </View>
      </View>
      
      <View className="flex-row gap-3">
        {currentLocation && onNavigate && (
          <TouchableOpacity 
            className="flex-1 flex-row items-center justify-center gap-2 bg-indigo-500 h-12 rounded-xl"
            activeOpacity={0.8}
            onPress={() => onNavigate(currentLocation.latitude, currentLocation.longitude)}
            disabled={isUpdating}
          >
            <Navigation size={16} color="#fff" />
            <Text className="text-white text-sm font-bold uppercase">Navigate</Text>
          </TouchableOpacity>
        )}
        
        {canSubmitProof && !isDelivered && onStatusUpdate && (
          <View className="flex-1 flex-row gap-2">
            {isAssigned && (
              <TouchableOpacity 
                className="flex-1 flex-row items-center justify-center gap-2 bg-blue-500 h-12 rounded-xl"
                activeOpacity={0.8}
                onPress={() => handleStatusUpdate(OrderStatus.PICKED_UP)}
                disabled={isUpdating || isCheckingLocation}
              >
                {(isUpdating || isCheckingLocation) ? <ActivityIndicator size="small" color="#fff" /> : (
                  <>
                    <Package size={16} color="#fff" />
                    <Text className="text-white text-xs font-bold uppercase">Pick Up</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {isPickedUp && (
              <TouchableOpacity 
                className="flex-1 flex-row items-center justify-center gap-2 bg-amber-500 h-12 rounded-xl"
                activeOpacity={0.8}
                onPress={() => handleStatusUpdate(OrderStatus.DELIVERING)}
                disabled={isUpdating || isCheckingLocation}
              >
                {(isUpdating || isCheckingLocation) ? <ActivityIndicator size="small" color="#fff" /> : (
                  <>
                    <Truck size={16} color="#fff" />
                    <Text className="text-white text-xs font-bold uppercase">Deliver</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {(isDelivering || isDelivered) && onProof && (
              <TouchableOpacity 
                className={`flex-1 flex-row items-center justify-center gap-2 h-12 rounded-xl ${isDelivered ? 'bg-slate-800' : 'bg-emerald-500'}`}
                activeOpacity={0.8}
                onPress={() => !isDelivered && handleProof()}
                disabled={isDelivered || isUpdating || isCheckingLocation}
              >
                {isDelivered ? <CheckCircle2 size={16} color="#10b981" /> : (
                  (isUpdating || isCheckingLocation) ? <ActivityIndicator size="small" color="#fff" /> : (
                    <>
                      <Camera size={16} color="#fff" />
                      <Text className={`text-sm font-bold uppercase ${isDelivered ? 'text-emerald-500' : 'text-white'}`}>Proof</Text>
                    </>
                  )
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </BlurView>
  );
};
