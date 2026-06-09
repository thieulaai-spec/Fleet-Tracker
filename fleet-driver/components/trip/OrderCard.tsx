import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { BlurView } from 'expo-blur';
import { MapPin, Navigation, Camera, Package, Truck, CheckCircle2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react-native';
import { Order, OrderStatus } from '@/types/trip';
import { useGeofencing } from '@/hooks/useGeofencing';
import { OrderDetails } from './OrderDetails';
import { OrderProofDetails } from './OrderProofDetails';

interface OrderCardProps {
  order: Order;
  index: number;
  onNavigate?: (latitude: number, longitude: number) => void;
  onProof?: (orderId: string) => void;
  onStatusUpdate?: (orderId: string, status: OrderStatus, options?: { actionLat?: number, actionLng?: number }) => Promise<void>;
  canSubmitProof?: boolean;
  verifications?: any[];
}

export const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  index, 
  onNavigate, 
  onProof, 
  onStatusUpdate,
  canSubmitProof,
  verifications = []
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [expanded, setExpanded] = useState(false);
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
          Alert.alert('Lỗi', 'Thiếu dữ liệu vị trí cho đơn hàng này.');
          return;
        }

        const coords = await checkProximity(
          currentLocation, 
          isPickupPhase ? 'điểm lấy hàng' : 'điểm giao hàng'
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
      Alert.alert('Cập nhật thất bại', 'Đã xảy ra lỗi khi cập nhật trạng thái.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProof = async () => {
    if (!onProof) return;

    if (!currentLocation) {
      Alert.alert('Lỗi', 'Thiếu dữ liệu vị trí cho đơn hàng này.');
      return;
    }

    const coords = await checkProximity(currentLocation, 'điểm giao hàng');
    if (!coords) return;

    onProof(order.id);
  };

  const handleCall = (phone?: string) => {
    if (!phone) {
      Alert.alert('Lỗi', 'Không có số điện thoại.');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Lỗi', 'Không thể thực hiện cuộc gọi.');
    });
  };

  return (
    <BlurView 
      intensity={10} 
      tint="light"
      className="rounded-[32px] p-5 mb-5 border border-white/5 overflow-hidden"
    >
      <TouchableOpacity 
        activeOpacity={0.7} 
        onPress={() => setExpanded(!expanded)}
        className="flex-row items-center justify-between mb-4"
      >
        <View className="flex-row items-center gap-3 flex-1 mr-4">
          <View className="w-10 h-10 rounded-full bg-indigo-500/20 items-center justify-center">
            <Text className="text-indigo-400 font-black text-xs">{index + 1}</Text>
          </View>
          <Text className="text-white text-lg font-black flex-1" numberOfLines={1}>
            Đơn hàng #{order.id.slice(-6).toUpperCase()}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className={`px-3 py-1 rounded-full ${isDelivered ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
            <Text className={`text-[10px] font-black uppercase ${isDelivered ? 'text-emerald-400' : 'text-amber-400'}`}>
              {order.status}
            </Text>
          </View>
          {expanded ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
        </View>
      </TouchableOpacity>

      {/* Quick alert badges if fragile or dangerous or high priority */}
      {(order.category === 'fragile' || order.category === 'dangerous' || order.priority === 'high') && (
        <View className="flex-row flex-wrap gap-2 mb-3">
          {order.category === 'fragile' && (
            <View className="flex-row items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl">
              <AlertTriangle size={12} color="#f59e0b" />
              <Text className="text-amber-400 text-[10px] font-black uppercase">Hàng dễ vỡ</Text>
            </View>
          )}
          {order.category === 'dangerous' && (
            <View className="flex-row items-center gap-1 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-xl">
              <AlertTriangle size={12} color="#ef4444" />
              <Text className="text-rose-400 text-[10px] font-black uppercase">Nguy hiểm</Text>
            </View>
          )}
          {order.priority === 'high' && (
            <View className="flex-row items-center gap-1 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-xl">
              <AlertTriangle size={12} color="#ef4444" />
              <Text className="text-rose-400 text-[10px] font-black uppercase">Ưu tiên cao</Text>
            </View>
          )}
        </View>
      )}

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
            {isPickupPhase ? 'Điểm lấy hàng' : 'Điểm giao hàng'}
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
            <Text className="text-white text-sm font-bold uppercase">Dẫn đường</Text>
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
                    <Text className="text-white text-xs font-bold uppercase">Lấy hàng</Text>
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
                    <Text className="text-white text-xs font-bold uppercase">Giao hàng</Text>
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
                      <Text className={`text-sm font-bold uppercase ${isDelivered ? 'text-emerald-500' : 'text-white'}`}>Xác thực</Text>
                    </>
                  )
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Render Details & Proof if expanded */}
      {expanded && (
        <>
          <OrderDetails order={order} handleCall={handleCall} />
          <OrderProofDetails order={order} verifications={verifications} />
        </>
      )}
    </BlurView>
  );
};
