import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { User, Navigation, Truck } from 'lucide-react-native';
import { getStatusColor } from './trackingUtils';

interface SelectedVehicleCardProps {
  selectedVehicle: any;
  onClose: () => void;
  isFetchingDetails: boolean;
  onFetchDetails: (tripId: string) => void;
}

export const SelectedVehicleCard: React.FC<SelectedVehicleCardProps> = ({
  selectedVehicle,
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

      <View className="gap-3 mb-5">
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
