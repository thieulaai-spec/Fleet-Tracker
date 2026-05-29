import React from 'react';
import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { MapPin, User, ShieldCheck, Navigation, Phone, Truck, CheckCircle2, Eye } from 'lucide-react-native';
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
  onCheckpoint
}) => {
  const pickupDistance = React.useMemo(() => {
    if (!location || !currentOrder?.pickupLocation) return null;
    return calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      currentOrder.pickupLocation.latitude,
      currentOrder.pickupLocation.longitude
    );
  }, [location, currentOrder?.pickupLocation]);

  const isWithinPickupRange = pickupDistance === null || pickupDistance < 200;

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
              style={{ height: 56, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}
            >
              <Truck size={20} color="#fff" strokeWidth={2.5} />
              <Text className="text-white font-black text-[13px] uppercase tracking-wider" numberOfLines={1}>Xác nhận lấy hàng</Text>
            </LinearGradient>
          </TouchableOpacity>
        );
      } else {
        const distText = pickupDistance !== null ? `${Math.round(pickupDistance)}m` : 'chưa xác định';
        return (
          <TouchableOpacity
            style={{ flex: 1, width: '100%' }}
            className="shadow-2xl border border-slate-700 bg-slate-800"
            onPress={() => {
              Alert.alert(
                'Cảnh báo khoảng cách',
                `Bạn còn cách điểm lấy hàng ${distText}. Vui lòng đến trong phạm vi 200m để xác nhận.`
              );
            }}
            activeOpacity={0.8}
          >
            <View style={{ height: 56, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }} className="bg-slate-800">
              <Truck size={20} color="#64748b" strokeWidth={2.5} />
              <Text className="text-slate-400 font-bold text-[12px] uppercase tracking-wider" numberOfLines={1}>
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
              style={{ height: 56, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}
            >
              <CheckCircle2 size={20} color="#fff" strokeWidth={2.5} />
              <Text className="text-white font-black text-[13px] uppercase tracking-wider" numberOfLines={1}>Hoàn thành chuyến</Text>
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
                style={{ height: 56, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}
              >
                <Truck size={20} color="#fff" strokeWidth={2.5} />
                <Text className="text-white font-black text-[13px] uppercase tracking-wider" numberOfLines={1}>Xác nhận lấy hàng</Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        } else {
          const distText = pickupDistance !== null ? `${Math.round(pickupDistance)}m` : 'chưa xác định';
          return (
            <TouchableOpacity
              style={{ flex: 1, width: '100%' }}
              className="shadow-2xl border border-slate-700 bg-slate-800"
              onPress={() => {
                Alert.alert(
                  'Cảnh báo khoảng cách',
                  `Bạn còn cách điểm lấy hàng ${distText}. Vui lòng đến trong phạm vi 200m để xác nhận.`
                );
              }}
              activeOpacity={0.8}
            >
              <View style={{ height: 56, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }} className="bg-slate-800">
                <Truck size={20} color="#64748b" strokeWidth={2.5} />
                <Text className="text-slate-400 font-bold text-[12px] uppercase tracking-wider" numberOfLines={1}>
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
              style={{ height: 56, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}
            >
              <Navigation size={20} color="#fff" strokeWidth={2.5} />
              <Text className="text-white font-black text-[13px] uppercase tracking-wider" numberOfLines={1}>Bắt đầu giao hàng</Text>
            </LinearGradient>
          </TouchableOpacity>
        );
      }

      // Active delivering screen -> Show Checkpoint and Confirm Delivery!
      return (
        <View style={{ flexDirection: 'row', gap: 12, flex: 1, width: '100%' }}>
          <TouchableOpacity
            style={{ flex: 1 }}
            className="shadow-2xl shadow-amber-500/20"
            onPress={onCheckpoint}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 56, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}
            >
              <Eye size={16} color="#fff" strokeWidth={2.5} />
              <Text className="text-white font-black text-[12px] uppercase tracking-wider" numberOfLines={1}>Báo chặng</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flex: 1.5 }}
            className="shadow-2xl shadow-emerald-500/30"
            onPress={onProofOfDelivery}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 56, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}
            >
              <CheckCircle2 size={16} color="#fff" strokeWidth={2.5} />
              <Text className="text-white font-black text-[12px] uppercase tracking-wider" numberOfLines={1}>Xác nhận giao hàng</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <View className="absolute bottom-32 left-5 right-5">
      <BlurView intensity={45} tint="dark" className="rounded-[44px] border border-white/10 shadow-2xl overflow-hidden">
        <View className="p-6 bg-slate-900/60">
          {/* Mission Progress Indicator */}
          <View className="absolute top-0 left-0 right-0 h-1.5 bg-white/5">
            <View
              className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.9)]"
              style={{ width: `${progressPercent}%` }}
            />
          </View>

          <View className="flex-row items-center mb-8 pt-3">
            <View className="shadow-2xl">
              <LinearGradient
                colors={currentOrder ? ['#10b981', '#059669'] : ['#334155', '#1e293b']}
                style={{ width: 64, height: 64, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}
              >
                <MapPin size={32} color="#fff" strokeWidth={2.5} />
              </LinearGradient>
            </View>
            <View className="flex-1 ml-5">
              <Text className="text-indigo-400 text-[10px] font-black uppercase tracking-[2.5px] mb-1.5">
                {currentOrder?.status === OrderStatus.PICKED_UP || currentOrder?.status === OrderStatus.DELIVERING ? 'Delivery Point' : 'Pickup Point'}
              </Text>
              <Text className="text-white text-2xl font-black tracking-tight" numberOfLines={1}>
                {currentOrder
                  ? (currentOrder.status === OrderStatus.PICKED_UP || currentOrder.status === OrderStatus.DELIVERING
                    ? currentOrder.address
                    : currentOrder.pickupAddress)
                  : 'Mission Accomplished'}
              </Text>
              {currentOrder && (
                <View className="flex-row items-center gap-2 mt-2">
                  <View className="w-6 h-6 rounded-lg bg-white/5 items-center justify-center">
                    <User size={12} color="#94a3b8" />
                  </View>
                  <Text className="text-slate-400 text-sm font-bold tracking-tight">
                    {currentOrder.customerName && currentOrder.customerName !== 'Unknown Customer'
                      ? currentOrder.customerName
                      : 'Elite Fleet Client'}
                  </Text>
                  <View className="w-1.5 h-1.5 rounded-full bg-slate-700 mx-1" />
                  <ShieldCheck size={14} color="#10b981" />
                  <Text className="text-emerald-500 text-[10px] font-black uppercase">Verified</Text>
                </View>
              )}
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="bg-white/5 w-12 h-12 rounded-[18px] justify-center items-center border border-white/10 shadow-lg"
                onPress={onNavigate}
                activeOpacity={0.7}
              >
                <Navigation size={22} color="#fff" strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-white/5 w-12 h-12 rounded-[18px] justify-center items-center border border-white/10 shadow-lg"
                activeOpacity={0.7}
                onPress={() => currentOrder?.customerPhone && Linking.openURL(`tel:${currentOrder.customerPhone}`)}
              >
                <Phone size={22} color="#fff" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tactical Actions */}
          <View className="flex-row gap-3">
            {renderActionButton()}

            <View className="flex-1">
              <SosButton tripId={activeTrip.id} />
            </View>
          </View>
        </View>
      </BlurView>
    </View>
  );
};
