import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { MapPin, Navigation, Camera, Package, Truck, CheckCircle2, ChevronDown, ChevronUp, Fingerprint, FileText, UserCheck, Check } from 'lucide-react-native';
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
  verifications?: any[];
}

const GEOFENCE_RADIUS = 200; // meters

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

  const renderProofDetails = () => {
    const orderVers = verifications.filter(v => v.orderId === order.id);
    
    // Filter verifications based on current order status
    let visibleVers = orderVers;
    if (order.status === OrderStatus.PICKED_UP || order.status === OrderStatus.DELIVERING) {
      // Show accept, pickup, checkpoint steps
      visibleVers = orderVers.filter(v => v.step === 'accept' || v.step === 'pickup' || v.step === 'checkpoint');
    } else if (order.status === OrderStatus.ASSIGNED) {
      // Show accept step
      visibleVers = orderVers.filter(v => v.step === 'accept');
    }

    if (visibleVers.length === 0 && !order.signatureUrl) {
      return (
        <View className="mt-4 pt-4 border-t border-white/5">
          <Text className="text-slate-500 text-xs italic text-center">Chưa có minh chứng xác thực nào được ghi nhận.</Text>
        </View>
      );
    }

    return (
      <View className="mt-4 pt-4 border-t border-white/5 gap-4">
        <View className="flex-row items-center gap-2 mb-1">
          <FileText size={12} color="#818cf8" />
          <Text className="text-indigo-400 text-xs font-black uppercase tracking-wider">Chi tiết minh chứng xác thực</Text>
        </View>
        
        <View className="gap-4">
          {visibleVers.map((ver, idx) => {
            const isPickupStep = ver.step === 'pickup';
            const isDeliveryStep = ver.step === 'delivery';
            const isAcceptStep = ver.step === 'accept';
            const isCheckpointStep = ver.step === 'checkpoint';
            
            let stepTitle = 'Xác thực';
            if (isAcceptStep) stepTitle = 'Chấp nhận đơn';
            else if (isPickupStep) stepTitle = 'Lấy hàng thành công (Đã đến lấy)';
            else if (isDeliveryStep) stepTitle = 'Bàn giao hàng thành công (Đã giao)';
            else if (isCheckpointStep) stepTitle = 'Mốc lộ trình';

            return (
              <View key={ver.id || idx} className="flex-row gap-3">
                {/* Node Line */}
                <View className="items-center">
                  <View className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 items-center justify-center">
                    <Check size={10} color="#818cf8" />
                  </View>
                  {idx !== visibleVers.length - 1 && (
                    <View className="w-px flex-1 bg-white/10 my-1" />
                  )}
                </View>

                {/* Node Content */}
                <View className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                  <View className="flex-row justify-between items-center mb-2.5">
                    <Text className="text-white text-xs font-black tracking-wide">{stepTitle}</Text>
                    <Text className="text-slate-500 text-[9px] font-black uppercase tracking-wider">
                      {new Date(ver.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>

                  {/* Fingerprint proof */}
                  {ver.fingerprintStatus && (
                    <View className="flex-row items-center gap-1.5 mb-3 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg self-start">
                      <Fingerprint size={10} color="#10b981" />
                      <Text className="text-emerald-400 text-[8px] font-black uppercase tracking-wider">Vân tay đã xác minh</Text>
                    </View>
                  )}

                  {/* Photos Row */}
                  {(ver.facePhotoUrl || ver.cargoPhotoUrl) && (
                    <View className="flex-row gap-3 mt-1.5">
                      {/* Face Photo */}
                      {ver.facePhotoUrl && (
                        <View className="flex-1">
                          <Text className="text-slate-500 text-[8px] font-black uppercase tracking-wider mb-1">Xác thực tài xế (Face ID)</Text>
                          <View className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-slate-950">
                            <Image 
                              source={{ uri: ver.facePhotoUrl }} 
                              className="w-full h-full"
                              resizeMode="cover"
                            />
                          </View>
                        </View>
                      )}

                      {/* Cargo Photo */}
                      {ver.cargoPhotoUrl && (
                        <View className="flex-1">
                          <Text className="text-slate-500 text-[8px] font-black uppercase tracking-wider mb-1">Ảnh thực tế hàng hóa</Text>
                          <View className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-slate-950">
                            <Image 
                              source={{ uri: ver.cargoPhotoUrl }} 
                              className="w-full h-full"
                              resizeMode="cover"
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {/* GPS Location Details */}
                  {ver.location && ver.location.coordinates && (
                    <View className="flex-row items-center gap-1.5 mt-3 bg-white/[0.03] p-2 rounded-lg border border-white/5">
                      <MapPin size={10} color="#a78bfa" />
                      <Text className="text-slate-400 text-[9px] font-bold" numberOfLines={1}>
                        GPS: {ver.location.coordinates[1].toFixed(5)}, {ver.location.coordinates[0].toFixed(5)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {/* Customer Signature (Only for DELIVERED status) */}
          {order.status === OrderStatus.DELIVERED && order.signatureUrl && (
            <View className="flex-row gap-3">
              <View className="items-center">
                <View className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 items-center justify-center">
                  <UserCheck size={10} color="#10b981" />
                </View>
              </View>
              <View className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                <Text className="text-white text-xs font-black tracking-wide mb-2">Chữ ký xác nhận của người nhận</Text>
                <View className="h-20 bg-slate-950/80 rounded-xl overflow-hidden items-center justify-center p-1 border border-white/10">
                  <Image 
                    source={{ uri: order.signatureUrl }} 
                    className="w-full h-full"
                    resizeMode="contain"
                  />
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    );
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

      {/* Render Proof Details Dynamically if expanded */}
      {expanded && renderProofDetails()}
    </BlurView>
  );
};
