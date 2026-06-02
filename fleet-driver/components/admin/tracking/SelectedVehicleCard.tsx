import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { User, Navigation, Truck, MapPin } from 'lucide-react-native';
import { getStatusColor } from './trackingUtils';

interface SelectedVehicleCardProps {
  selectedVehicle: any;
  activeTrip: any | null;
  onClose: () => void;
  isFetchingDetails: boolean;
  onFetchDetails: (tripId: string) => void;
}

export const SelectedVehicleCard: React.FC<SelectedVehicleCardProps> = ({
  selectedVehicle,
  activeTrip,
  onClose,
  isFetchingDetails,
  onFetchDetails,
}) => {
  if (!selectedVehicle) return null;

  return (
    <BlurView 
      intensity={95} 
      tint="dark" 
      className="absolute left-4 right-4 rounded-3xl overflow-hidden p-5 border border-white/15 shadow-2xl shadow-black/30"
      style={{ bottom: 112 }}
    >
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center gap-2">
          <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getStatusColor(selectedVehicle.status) }} />
          <Text className="text-white text-xl font-extrabold">{selectedVehicle.licensePlate}</Text>
        </View>
        <TouchableOpacity onPress={onClose}>
          <Text className="text-slate-400 text-sm">Close</Text>
        </TouchableOpacity>
      </View>

      <View className="gap-3 mb-4">
        <View className="flex-row justify-between">
          <View className="flex-row items-center gap-2 flex-1">
            <User size={16} color="#94a3b8" />
            <Text className="text-slate-100 text-sm font-medium" numberOfLines={1}>{selectedVehicle.driverName}</Text>
          </View>
          <View className="flex-row items-center gap-2 flex-1">
            <Navigation size={16} color="#94a3b8" />
            <Text className="text-slate-100 text-sm font-medium">{selectedVehicle.speed} km/h</Text>
          </View>
        </View>

        <View className="flex-row justify-between">
          <View className="flex-row items-center gap-2 flex-1">
            <Truck size={16} color="#94a3b8" />
            <Text className="text-slate-100 text-sm font-medium">{selectedVehicle.status.replace('_', ' ').toUpperCase()}</Text>
          </View>
          <View className="flex-row items-center gap-2 flex-1">
            <Text className="text-slate-500 text-xs">Updated: </Text>
            <Text className="text-slate-100 text-sm font-medium">Just now</Text>
          </View>
        </View>
      </View>

      {/* Render active trip destinations directly on card */}
      {activeTrip && activeTrip.tripOrders && activeTrip.tripOrders.length > 0 && (
        <View className="mt-1 pt-3 border-t border-white/10 gap-2 mb-4">
          <View className="flex-row items-center gap-1.5 mb-1">
            <MapPin size={12} color="#818cf8" />
            <Text className="text-indigo-400 text-[10px] font-black uppercase tracking-wider">Thông tin địa điểm chuyến đi</Text>
          </View>
          {activeTrip.tripOrders.map((to: any) => {
            const order = to.order;
            if (!order) return null;
            return (
              <View key={order.id} className="bg-white/5 rounded-xl p-3 border border-white/5 gap-1.5">
                <View className="flex-row justify-between items-center">
                  <Text className="text-white text-xs font-bold font-mono">Đơn: #{order.id.substring(0, 8)}</Text>
                  <Text className="text-emerald-400 text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-500/10 rounded-full">{order.status}</Text>
                </View>
                <View className="gap-1">
                  <Text className="text-slate-300 text-xs" numberOfLines={1} ellipsizeMode="tail">
                    📍 <Text className="font-semibold text-indigo-300">Lấy:</Text> {order.pickupAddress}
                  </Text>
                  <Text className="text-slate-300 text-xs" numberOfLines={1} ellipsizeMode="tail">
                    🏁 <Text className="font-semibold text-emerald-300">Giao:</Text> {order.deliveryAddress}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {selectedVehicle.tripId ? (
        <TouchableOpacity
          onPress={() => onFetchDetails(selectedVehicle.tripId!)}
          disabled={isFetchingDetails}
          className="bg-indigo-500 py-3.5 rounded-2xl items-center flex-row justify-center gap-2"
        >
          {isFetchingDetails ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text className="text-white font-black uppercase text-xs tracking-wider">Xem Chi Tiết Minh Chứng</Text>
          )}
        </TouchableOpacity>
      ) : (
        <View className="bg-white/5 py-3.5 rounded-2xl items-center border border-white/5">
          <Text className="text-slate-400 text-xs font-semibold">Không Có Chuyến Đi Đang Chạy</Text>
        </View>
      )}
    </BlurView>
  );
};
