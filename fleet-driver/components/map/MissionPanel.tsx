import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { MapPin, User, ShieldCheck, Navigation, Phone, Truck, CheckCircle2, Eye, ChevronUp, ChevronDown } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Trip, TripStatus, OrderStatus } from '@/types/trip';
import { SosButton } from '../ui/SosButton';
import { calculateDistance } from '../../utils/geo';

interface MissionPanelProps {
  activeTrip: Trip;
  currentOrder: any;
  progressPercent?: number;
  location?: any;
  onNavigate: () => void;
  onUpdateTripStatus: (status: TripStatus) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onProofOfDelivery?: () => void;
  onCheckpoint?: () => void;
  selectedOrderId?: string | null;
  onSelectOrder?: (orderId: string) => void;
}

export const MissionPanel: React.FC<MissionPanelProps> = ({
  activeTrip,
  currentOrder,
  progressPercent = 0,
  location,
  onNavigate,
  onUpdateTripStatus,
  onUpdateOrderStatus,
  onProofOfDelivery,
  onCheckpoint,
  selectedOrderId,
  onSelectOrder
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSelectOrderPrompt = () => {
    const undeliveredOrders = activeTrip.orders.filter(o => o.status !== OrderStatus.DELIVERED);
    if (undeliveredOrders.length <= 1) return;

    Alert.alert(
      'Chọn nhiệm vụ mục tiêu',
      'Chọn đơn hàng bạn muốn thực hiện tiếp theo:',
      [
        ...undeliveredOrders.map(o => ({
          text: `Đơn #${o.id.slice(-6).toUpperCase()} (${
            o.status === OrderStatus.PICKED_UP || o.status === OrderStatus.DELIVERING ? 'Giao hàng' : 'Lấy hàng'
          })`,
          onPress: () => onSelectOrder?.(o.id)
        })),
        { text: 'Hủy', style: 'cancel' }
      ]
    );
  };

  const pickupDistance = React.useMemo(() => {
    if (!location || !currentOrder?.pickupLocation) return null;
    return calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      currentOrder.pickupLocation.latitude,
      currentOrder.pickupLocation.longitude
    );
  }, [location, currentOrder?.pickupLocation]);

  const isWithinPickupRange = pickupDistance !== null && pickupDistance < 200;

  const deliveryDistance = React.useMemo(() => {
    if (!location || !currentOrder?.deliveryLocation) return null;
    return calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      currentOrder.deliveryLocation.latitude,
      currentOrder.deliveryLocation.longitude
    );
  }, [location, currentOrder?.deliveryLocation]);

  const isWithinDeliveryRange = deliveryDistance !== null && deliveryDistance < 200;

  // Render Action Button based on Trip and Order status
  const renderActionButton = () => {
    // 1. If trip is ACCEPTED (Going to pick up) -> directly offer Confirm Pickup!
    if (activeTrip.status === TripStatus.ACCEPTED) {
      if (!currentOrder) return null;

      if (isWithinPickupRange) {
        return (
          <TouchableOpacity
            style={{ flex: 1, width: '100%' }}
            className="shadow-2xl shadow-amber-500/30"
            onPress={() => onUpdateOrderStatus(currentOrder.id, OrderStatus.PICKED_UP)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 48, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 }}
            >
              <Truck size={16} color="#fff" strokeWidth={2.5} />
              <Text className="text-white font-black text-xs uppercase tracking-wide" numberOfLines={1}>Xác nhận lấy hàng</Text>
            </LinearGradient>
          </TouchableOpacity>
        );
      } else {
        const distText = pickupDistance !== null ? `${Math.round(pickupDistance)}m` : 'chưa xác định';
        return (
          <TouchableOpacity
            style={{ flex: 1, width: '100%' }}
            className="shadow-2xl"
            onPress={() => {
              Alert.alert(
                'Cảnh báo khoảng cách',
                `Bạn còn cách điểm lấy hàng ${distText}. Vui lòng đến trong phạm vi 200m để xác nhận.`
              );
            }}
            activeOpacity={0.8}
          >
            <View style={{ height: 48, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 }} className="bg-slate-800 border border-slate-700">
              <Truck size={16} color="#64748b" strokeWidth={2.5} />
              <Text className="text-slate-400 font-bold text-xs uppercase tracking-wide" numberOfLines={1}>
                Lấy hàng ({distText})
              </Text>
            </View>
          </TouchableOpacity>
        );
      }
    }

    // 2. If trip is IN_PROGRESS (Delivering)
    if (activeTrip.status === TripStatus.IN_PROGRESS) {
      if (!currentOrder) {
        return (
          <TouchableOpacity
            style={{ flex: 1, width: '100%' }}
            className="shadow-2xl shadow-blue-500/30"
            onPress={() => onUpdateTripStatus(TripStatus.COMPLETED)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#3b82f6', '#2563eb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 48, borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 6 }}
            >
              <CheckCircle2 size={18} color="#fff" strokeWidth={2.5} />
              <Text className="text-white font-black text-xs uppercase tracking-wider text-center flex-1" numberOfLines={1} ellipsizeMode="tail">Hoàn thành chuyến</Text>
            </LinearGradient>
          </TouchableOpacity>
        );
      }

      // If order is still assigned (should have auto-picked up, but as fallback)
      if (currentOrder.status === OrderStatus.ASSIGNED || currentOrder.status === OrderStatus.PENDING) {
        if (isWithinPickupRange) {
          return (
            <TouchableOpacity
              style={{ flex: 1, width: '100%' }}
              className="shadow-2xl shadow-amber-500/30"
              onPress={() => onUpdateOrderStatus(currentOrder.id, OrderStatus.PICKED_UP)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 48, borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 6 }}
              >
                <Truck size={18} color="#fff" strokeWidth={2.5} />
                <Text className="text-white font-black text-xs uppercase tracking-wider text-center flex-1" numberOfLines={1} ellipsizeMode="tail">Xác nhận lấy hàng</Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        } else {
          const distText = pickupDistance !== null ? `${Math.round(pickupDistance)}m` : 'chưa xác định';
          return (
            <TouchableOpacity
              style={{ flex: 1, width: '100%' }}
              className="shadow-2xl"
              onPress={() => {
                Alert.alert(
                  'Cảnh báo khoảng cách',
                  `Bạn còn cách điểm lấy hàng ${distText}. Vui lòng đến trong phạm vi 200m để xác nhận.`
                );
              }}
              activeOpacity={0.8}
            >
              <View style={{ height: 48, borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 6 }} className="bg-slate-800 border border-slate-700">
                <Truck size={18} color="#64748b" strokeWidth={2.5} />
                <Text className="text-slate-400 font-bold text-xs uppercase tracking-wider text-center flex-1" numberOfLines={1} ellipsizeMode="tail">
                  Lấy hàng ({distText})
                </Text>
              </View>
            </TouchableOpacity>
          );
        }
      }

      // If order is picked up but not set to delivering (as fallback)
      if (currentOrder.status === OrderStatus.PICKED_UP) {
        return (
          <TouchableOpacity
            style={{ flex: 1, width: '100%' }}
            className="shadow-2xl shadow-violet-500/30"
            onPress={() => onUpdateOrderStatus(currentOrder.id, OrderStatus.DELIVERING)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 48, borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 6 }}
            >
              <Navigation size={18} color="#fff" strokeWidth={2.5} />
              <Text className="text-white font-black text-xs uppercase tracking-wider text-center flex-1" numberOfLines={1} ellipsizeMode="tail">Bắt đầu giao hàng</Text>
            </LinearGradient>
          </TouchableOpacity>
        );
      }

      // Active delivering screen -> Show Confirm Delivery!
      if (isWithinDeliveryRange) {
        return (
          <TouchableOpacity
            style={{ flex: 1, width: '100%' }}
            className="shadow-2xl shadow-emerald-500/30"
            onPress={onProofOfDelivery}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 48, borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 6 }}
            >
              <CheckCircle2 size={18} color="#fff" strokeWidth={2.5} />
              <Text className="text-white font-black text-xs uppercase tracking-wider text-center flex-1" numberOfLines={1} ellipsizeMode="tail">Xác nhận giao hàng</Text>
            </LinearGradient>
          </TouchableOpacity>
        );
      } else {
        const distText = deliveryDistance !== null ? `${Math.round(deliveryDistance)}m` : 'chưa xác định';
        return (
          <TouchableOpacity
            style={{ flex: 1, width: '100%' }}
            className="shadow-2xl"
            onPress={() => {
              Alert.alert(
                'Cảnh báo khoảng cách',
                `Bạn còn cách điểm giao hàng ${distText}. Vui lòng đến trong phạm vi 200m để xác nhận.`
              );
            }}
            activeOpacity={0.8}
          >
            <View style={{ height: 48, borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 6 }} className="bg-slate-800 border border-slate-700">
              <CheckCircle2 size={18} color="#64748b" strokeWidth={2.5} />
              <Text className="text-slate-400 font-bold text-xs uppercase tracking-wider text-center flex-1" numberOfLines={1} ellipsizeMode="tail">
                Giao hàng ({distText})
              </Text>
            </View>
          </TouchableOpacity>
        );
      }
    }

    return null;
  };

  return (
    <View className="absolute bottom-32 left-4 right-4">
      <BlurView 
        intensity={95} 
        tint="light" 
        className="rounded-[24px] border border-slate-700/50 shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.96)' }}
      >
        <View className="p-4">
          <View className={`flex-row items-center pt-1.5 ${isCollapsed ? 'mb-0' : 'mb-5'}`}>
            <TouchableOpacity 
              onPress={() => setIsCollapsed(!isCollapsed)}
              activeOpacity={0.85}
              className="flex-row items-center flex-1 mr-2"
            >
              <View className="shadow-2xl">
                <LinearGradient
                  colors={currentOrder ? ['#10b981', '#059669'] : ['#334155', '#1e293b']}
                  style={{ width: 48, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}
                >
                  <MapPin size={24} color="#fff" strokeWidth={2.5} />
                </LinearGradient>
              </View>
              <View className="flex-1 min-w-0 ml-4">
                <Text className="text-indigo-400 text-[9px] font-black uppercase tracking-[2px] mb-1">
                  {currentOrder?.status === OrderStatus.PICKED_UP || currentOrder?.status === OrderStatus.DELIVERING ? 'Delivery Point' : 'Pickup Point'}
                </Text>
                <Text className="text-white text-lg font-black tracking-tight" numberOfLines={1} ellipsizeMode="tail">
                  {currentOrder
                    ? (currentOrder.status === OrderStatus.PICKED_UP || currentOrder.status === OrderStatus.DELIVERING
                      ? currentOrder.address
                      : currentOrder.pickupAddress)
                    : 'Mission Accomplished'}
                </Text>
                {currentOrder && !isCollapsed && (
                  <>
                    <View className="flex-row items-center gap-1.5 mt-1.5">
                      <View className="w-5 h-5 rounded-lg bg-white/5 items-center justify-center">
                        <User size={10} color="#94a3b8" />
                      </View>
                      {activeTrip.orders.filter(o => o.status !== OrderStatus.DELIVERED).length > 1 ? (
                        <TouchableOpacity 
                          onPress={handleSelectOrderPrompt}
                          className="flex-row items-center bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20"
                          activeOpacity={0.7}
                        >
                          <Text className="text-indigo-400 text-xs font-black tracking-tight mr-1">
                            Đơn #{currentOrder.id.slice(-6).toUpperCase()} 🔄
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <Text className="text-slate-400 text-xs font-bold tracking-tight" numberOfLines={1} ellipsizeMode="tail">
                          Đơn #{currentOrder.id.slice(-6).toUpperCase()}
                        </Text>
                      )}
                      <View className="w-1 h-1 rounded-full bg-slate-700 mx-0.5" />
                      <ShieldCheck size={12} color="#10b981" />
                      <Text className="text-emerald-500 text-[9px] font-black uppercase">Xác thực</Text>
                    </View>

                    {/* Customer Info Row */}
                    <View className="flex-row items-center gap-3 mt-2.5 pt-2 border-t border-slate-700/10">
                      <View className="flex-row items-center gap-1 flex-1">
                        <User size={12} color="#4f46e5" strokeWidth={2.5} />
                        <Text className="text-white text-xs font-black" numberOfLines={1} ellipsizeMode="tail">
                          {currentOrder.customerName || 'Chưa rõ tên'}
                        </Text>
                      </View>
                      {currentOrder.customerPhone && (
                        <TouchableOpacity 
                          onPress={() => {
                            Linking.openURL(`tel:${currentOrder.customerPhone}`).catch(() => 
                              Alert.alert('Lỗi', 'Không thể gọi số điện thoại này')
                            );
                          }}
                          className="flex-row items-center gap-1 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-[8px]"
                          activeOpacity={0.7}
                        >
                          <Phone size={10} color="#4f46e5" strokeWidth={2.5} />
                          <Text className="text-slate-400 text-[10px] font-black tracking-tight">
                            {currentOrder.customerPhone}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                )}
              </View>
            </TouchableOpacity>

            <View className="flex-row gap-1.5 items-center">
              <TouchableOpacity
                className="bg-white/5 w-10 h-10 rounded-[12px] justify-center items-center border border-white/10"
                onPress={onNavigate}
                activeOpacity={0.7}
              >
                <Navigation size={18} color="#fff" strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity
                className="w-8 h-10 justify-center items-center"
                onPress={() => setIsCollapsed(!isCollapsed)}
                activeOpacity={0.7}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                {isCollapsed ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Tactical Actions */}
          {!isCollapsed && (
            <View className="flex-row gap-2.5 items-center">
              <View className="flex-1 w-full">
                {renderActionButton()}
              </View>

              <View className="flex-1 w-full">
                <SosButton tripId={activeTrip.id} />
              </View>
            </View>
          )}
        </View>
      </BlurView>
    </View>
  );
};
