import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Truck, CheckCircle2, Navigation } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trip, TripStatus, OrderStatus } from '@/types/trip';

interface ActionButtonProps {
  activeTrip: Trip;
  currentOrder: any;
  pickupDistance: number | null;
  deliveryDistance: number | null;
  isWithinPickupRange: boolean;
  isWithinDeliveryRange: boolean;
  onUpdateTripStatus: (status: TripStatus) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onProofOfDelivery?: () => void;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  activeTrip,
  currentOrder,
  pickupDistance,
  deliveryDistance,
  isWithinPickupRange,
  isWithinDeliveryRange,
  onUpdateTripStatus,
  onUpdateOrderStatus,
  onProofOfDelivery,
}) => {
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
