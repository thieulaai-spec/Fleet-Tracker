import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Users, Truck, Calendar, ChevronRight } from 'lucide-react-native';
import { TripBadge } from '../../trip/TripBadge';

interface AdminTripCardProps {
  item: any;
  onPress: () => void;
}

export const AdminTripCard: React.FC<AdminTripCardProps> = ({ item, onPress }) => {
  const date = new Date(item.createdAt);
  const orderCount = item.tripOrders?.length || 0;
  const driverName = item.driver?.user?.fullName || 'Chưa gán tài xế';
  const plateNumber = item.vehicle?.plateNumber || 'Chưa gán xe';

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-slate-900/60 border border-white/5 p-4 rounded-2xl mb-4 flex-row items-center justify-between"
      activeOpacity={0.7}
    >
      <View className="flex-1 pr-2">
        <View className="flex-row items-center gap-2 mb-2 flex-wrap">
          <Text className="text-white text-sm font-mono font-bold">Trip: #{item.id.substring(0, 8).toUpperCase()}</Text>
          <TripBadge status={item.status} />
        </View>

        <View className="space-y-1">
          <View className="flex-row items-center gap-1.5">
            <Users size={12} color="#94a3b8" />
            <Text className="text-slate-300 text-xs font-semibold">{driverName}</Text>
          </View>

          <View className="flex-row items-center gap-1.5">
            <Truck size={12} color="#94a3b8" />
            <Text className="text-slate-300 text-xs font-semibold">Xe: {plateNumber}</Text>
          </View>

          <View className="flex-row items-center gap-1.5">
            <Calendar size={12} color="#94a3b8" />
            <Text className="text-slate-400 text-[11px] font-medium">
              {date.toLocaleDateString('vi-VN')} {date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-4 mt-3 pt-3 border-t border-white/5">
          <View>
            <Text className="text-slate-550 text-[8px] font-bold uppercase tracking-wider">Số đơn hàng</Text>
            <Text className="text-white text-xs font-extrabold mt-0.5">{orderCount} đơn</Text>
          </View>
          <View>
            <Text className="text-slate-550 text-[8px] font-bold uppercase tracking-wider">Quãng đường</Text>
            <Text className="text-white text-xs font-extrabold mt-0.5">{item.totalDistanceKm || 0} km</Text>
          </View>
        </View>
      </View>

      <View className="bg-white/5 w-8 h-8 rounded-full items-center justify-center border border-white/10 ml-2">
        <ChevronRight size={16} color="#94a3b8" />
      </View>
    </TouchableOpacity>
  );
};
