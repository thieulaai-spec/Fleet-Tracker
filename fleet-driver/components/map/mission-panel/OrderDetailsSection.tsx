import React from 'react';
import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { User, ShieldCheck, Phone, AlertTriangle } from 'lucide-react-native';
import { Trip, OrderStatus } from '@/types/trip';

interface OrderDetailsSectionProps {
  activeTrip: Trip;
  currentOrder: any;
  isCollapsed: boolean;
  onSelectOrder?: (orderId: string) => void;
}

export const OrderDetailsSection: React.FC<OrderDetailsSectionProps> = ({
  activeTrip,
  currentOrder,
  isCollapsed,
  onSelectOrder,
}) => {
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

  if (!currentOrder || isCollapsed) return null;

  const undeliveredCount = activeTrip.orders.filter(o => o.status !== OrderStatus.DELIVERED).length;

  return (
    <>
      <View className="flex-row items-center gap-1.5 mt-1.5">
        <View className="w-5 h-5 rounded-lg bg-white/5 items-center justify-center">
          <User size={10} color="#94a3b8" />
        </View>
        {undeliveredCount > 1 ? (
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
  );
};
