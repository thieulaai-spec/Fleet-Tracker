import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Image, Linking } from 'react-native';
import { BlurView } from 'expo-blur';
import { MapPin, Navigation, Camera, Package, Truck, CheckCircle2, ChevronDown, ChevronUp, Fingerprint, FileText, UserCheck, Check, Phone, User, Timer, Scale, AlertTriangle, Clock } from 'lucide-react-native';
import * as Location from 'expo-location';
import { Order, OrderStatus } from '@/types/trip';
import { calculateDistance } from '@/utils/geo';
import { useGeofencing } from '@/hooks/useGeofencing';
import { LightboxModal } from '../admin/tracking/LightboxModal';

const getCategoryLabel = (category?: string) => {
  switch (category) {
    case 'bulk': return 'Dạng thô (Bulk)';
    case 'fragile': return 'Dễ vỡ (Fragile)';
    case 'bulky': return 'Hàng cồng kềnh (Bulky)';
    case 'dangerous': return 'Hàng nguy hiểm (Dangerous)';
    case 'other': return 'Khác';
    default: return 'Khác';
  }
};

const getPriorityLabel = (priority?: string) => {
  switch (priority) {
    case 'high': return 'Cao';
    case 'medium': return 'Trung bình';
    case 'low': return 'Thấp';
    default: return 'Trung bình';
  }
};

const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case 'high': return '#ef4444';
    case 'medium': return '#f59e0b';
    case 'low': return '#10b981';
    default: return '#f59e0b';
  }
};

function useCountdown(deadline?: string) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!deadline) { setRemaining(null); return; }
    const calc = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      setRemaining(diff);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return remaining;
}

function formatCountdown(ms: number | null): { text: string; color: string } {
  if (ms === null) return { text: '', color: '#64748b' };
  if (ms <= 0) return { text: 'Quá hạn (Overdue)', color: '#ef4444' };
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const color = ms < 3600000 ? '#ef4444' : ms < 7200000 ? '#f59e0b' : '#10b981';
  if (d > 0) return { text: `${d}d ${h}h ${m}m`, color };
  if (h > 0) return { text: `${h}h ${m}m ${s}s`, color };
  return { text: `${m}m ${s}s`, color };
}

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
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
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

  const renderOrderDetails = () => {
    const remaining = useCountdown(order.deliveryDeadline);
    const countdown = formatCountdown(remaining);
    const isActiveOrder = !['delivered', 'failed', 'cancelled'].includes(order.status);
    const phone = order.recipientPhone || order.customerPhone;

    return (
      <View className="mt-4 pt-4 border-t border-white/5 gap-4">
        {/* Recipient Details */}
        <View className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 gap-2.5">
          <View className="flex-row items-center gap-2 mb-1">
            <UserCheck size={14} color="#818cf8" />
            <Text className="text-indigo-400 text-xs font-black uppercase tracking-wider">Thông tin người nhận</Text>
          </View>

          <View className="flex-row items-center justify-between py-1 border-b border-white/5">
            <View className="flex-row items-center gap-2">
              <User size={14} color="#94a3b8" />
              <Text className="text-slate-400 text-xs font-semibold">Người nhận</Text>
            </View>
            <Text className="text-slate-200 text-xs font-bold">{order.recipientName || order.customerName || 'N/A'}</Text>
          </View>

          <View className="flex-row items-center justify-between py-1">
            <View className="flex-row items-center gap-2">
              <Phone size={14} color="#94a3b8" />
              <Text className="text-slate-400 text-xs font-semibold">Số điện thoại</Text>
            </View>
            {phone ? (
              <TouchableOpacity 
                onPress={() => handleCall(phone)}
                className="bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/30 flex-row items-center gap-1"
              >
                <Text className="text-indigo-300 text-xs font-bold">{phone}</Text>
              </TouchableOpacity>
            ) : (
              <Text className="text-slate-500 text-xs font-medium">N/A</Text>
            )}
          </View>
        </View>

        {/* Order Specs */}
        <View className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 gap-2.5">
          <View className="flex-row items-center gap-2 mb-1">
            <Package size={14} color="#818cf8" />
            <Text className="text-indigo-400 text-xs font-black uppercase tracking-wider">Chi tiết hàng hóa</Text>
          </View>

          <View className="flex-row items-center justify-between py-1 border-b border-white/5">
            <Text className="text-slate-400 text-xs font-semibold">Phân loại</Text>
            <Text className="text-slate-200 text-xs font-bold">{getCategoryLabel(order.category)}</Text>
          </View>

          <View className="flex-row items-center justify-between py-1 border-b border-white/5">
            <Text className="text-slate-400 text-xs font-semibold">Độ ưu tiên</Text>
            <View className="px-2 py-0.5 rounded" style={{ backgroundColor: getPriorityColor(order.priority) + '20' }}>
              <Text className="text-[10px] font-bold" style={{ color: getPriorityColor(order.priority) }}>
                {getPriorityLabel(order.priority)}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between py-1">
            <View className="flex-row items-center gap-2">
              <Scale size={14} color="#94a3b8" />
              <Text className="text-slate-400 text-xs font-semibold">Khối lượng</Text>
            </View>
            <Text className="text-slate-200 text-xs font-bold">{order.weightKg ? `${order.weightKg} kg` : 'N/A'}</Text>
          </View>
        </View>

        {/* Delivery Constraint (Deadline) */}
        {order.deliveryDeadline && (
          <View className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 gap-2.5">
            <View className="flex-row items-center gap-2 mb-1">
              <Clock size={14} color="#818cf8" />
              <Text className="text-indigo-400 text-xs font-black uppercase tracking-wider">Hạn giao hàng</Text>
            </View>

            <View className="flex-row justify-between items-center">
              <View className="flex-1 mr-4">
                <Text className="text-slate-300 text-xs font-bold leading-5">
                  {new Date(order.deliveryDeadline).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {new Date(order.deliveryDeadline).toLocaleDateString('vi-VN')}
                </Text>
              </View>
              {isActiveOrder && remaining !== null && (
                <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-lg" style={{ backgroundColor: countdown.color + '20' }}>
                  <Timer size={10} color={countdown.color} />
                  <Text className="text-[10px] font-bold" style={{ color: countdown.color }}>
                    {countdown.text}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Instructions */}
        {order.description && (
          <View className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
            <View className="flex-row items-center gap-2 mb-2">
              <FileText size={14} color="#818cf8" />
              <Text className="text-indigo-400 text-xs font-black uppercase tracking-wider">Chỉ dẫn giao hàng</Text>
            </View>
            <Text className="text-slate-400 text-xs leading-5">{order.description}</Text>
          </View>
        )}
      </View>
    );
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

    if (visibleVers.length === 0) {
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

            const cargoPhotos = ver.cargoPhotoUrl ? ver.cargoPhotoUrl.split(',').filter(Boolean) : [];

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
                  {(ver.facePhotoUrl || cargoPhotos.length > 0) && (
                    <View className="flex-row gap-3 mt-1.5">
                      {/* Face Photo */}
                      {ver.facePhotoUrl && (
                        <View className="flex-1">
                          <Text className="text-slate-500 text-[8px] font-black uppercase tracking-wider mb-1">Xác thực tài xế (Face ID)</Text>
                          <TouchableOpacity 
                            activeOpacity={0.9} 
                            onPress={() => setLightboxUrl(ver.facePhotoUrl)}
                            className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-slate-950"
                          >
                            <Image 
                              source={{ uri: ver.facePhotoUrl }} 
                              className="w-full h-full"
                              resizeMode="cover"
                            />
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Cargo Photos */}
                      {cargoPhotos.length > 0 && (
                        <View className="flex-1">
                          <Text className="text-slate-500 text-[8px] font-black uppercase tracking-wider mb-1">Ảnh thực tế hàng hóa</Text>
                          <View className="flex-row flex-wrap gap-1.5">
                            {cargoPhotos.map((photoUrl: string, pIdx: number) => (
                              <TouchableOpacity 
                                key={pIdx}
                                activeOpacity={0.9} 
                                onPress={() => setLightboxUrl(photoUrl)}
                                className={cargoPhotos.length === 1 ? "w-full aspect-square rounded-xl overflow-hidden border border-white/10 bg-slate-950" : "w-[47%] aspect-square rounded-xl overflow-hidden border border-white/10 bg-slate-950"}
                              >
                                <Image 
                                  source={{ uri: photoUrl }} 
                                  className="w-full h-full"
                                  resizeMode="cover"
                                />
                              </TouchableOpacity>
                            ))}
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
          {renderOrderDetails()}
          {renderProofDetails()}
        </>
      )}

      {lightboxUrl && (
        <LightboxModal imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </BlurView>
  );
};
