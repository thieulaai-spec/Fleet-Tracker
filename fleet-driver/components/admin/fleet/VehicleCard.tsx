import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Truck, User as UserIcon, Settings2, ChevronRight } from 'lucide-react-native';
import { Vehicle, VehicleStatus, VehicleType } from '../../../store/useFleetStore';

const VEHICLE_STATUS_CONFIG = {
  [VehicleStatus.AVAILABLE]: { label: 'Available', color: '#10b981' },
  [VehicleStatus.DELIVERING]: { label: 'Delivering', color: '#6366f1' },
  [VehicleStatus.MAINTENANCE]: { label: 'Maintenance', color: '#ef4444' },
};

const VEHICLE_TYPE_LABELS = {
  [VehicleType.SMALL]: 'Small Van',
  [VehicleType.MEDIUM]: 'Box Truck',
  [VehicleType.LARGE]: 'Semi Truck',
};

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress: () => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onPress }) => {
  const status = VEHICLE_STATUS_CONFIG[vehicle.status] || VEHICLE_STATUS_CONFIG[VehicleStatus.AVAILABLE];
  
  return (
    <TouchableOpacity className="bg-slate-800 rounded-[24px] p-5 mb-4 border border-white/5" onPress={onPress}>
      <View className="flex-row items-center mb-4">
        {vehicle.imageUrl ? (
          <Image 
            source={{ uri: vehicle.imageUrl }} 
            className="w-12 h-12 rounded-2xl mr-3 bg-slate-900 border border-slate-700" 
            resizeMode="cover"
          />
        ) : (
          <View className="w-12 h-12 rounded-2xl bg-emerald-500/10 justify-center items-center mr-3">
            <Truck size={24} color="#10b981" />
          </View>
        )}
        <View className="flex-1">
          <Text className="text-base font-bold text-slate-50">{vehicle.plateNumber}</Text>
          <Text className="text-[13px] text-slate-500">{VEHICLE_TYPE_LABELS[vehicle.type]}</Text>
        </View>
        <View className="flex-row items-center px-2.5 py-1 rounded-[10px] gap-1.5" style={{ backgroundColor: `${status.color}20` }}>
          <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.color }} />
          <Text className="text-[11px] font-extrabold uppercase" style={{ color: status.color }}>{status.label}</Text>
        </View>
      </View>

      <View className="flex-row items-center pt-4 border-t border-white/5 gap-4">
        <View className="flex-1 flex-row items-center gap-1.5">
          <Settings2 size={16} color="#94a3b8" />
          <Text className="text-slate-400 text-xs font-semibold">{vehicle.maxCapacityKg}kg</Text>
        </View>
        <View className="flex-1 flex-row items-center gap-1.5">
          <UserIcon size={16} color="#94a3b8" />
          <Text className="text-slate-400 text-xs font-semibold" numberOfLines={1}>{vehicle.driver?.user.fullName || 'Unassigned'}</Text>
        </View>
        <ChevronRight size={20} color="#475569" />
      </View>
    </TouchableOpacity>
  );
};

