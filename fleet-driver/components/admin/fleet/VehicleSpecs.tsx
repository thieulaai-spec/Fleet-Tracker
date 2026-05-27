import React from 'react';
import { View, Text } from 'react-native';
import { Box, Scale, Cpu } from 'lucide-react-native';
import { Vehicle, VehicleType } from '../../../store/useFleetStore';

const TYPE_LABELS = {
  [VehicleType.SMALL]: 'Small Van',
  [VehicleType.MEDIUM]: 'Box Truck',
  [VehicleType.LARGE]: 'Semi Truck',
};

interface VehicleSpecsProps {
  vehicle: Vehicle;
}

export const VehicleSpecs: React.FC<VehicleSpecsProps> = ({ vehicle }) => {
  return (
    <View className="bg-slate-800 rounded-[24px] p-5 border border-white/10">
      <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-5">Specifications</Text>
      
      <View className="flex-row items-center gap-4 mb-5">
        <Box size={20} color="#64748b" />
        <View>
          <Text className="text-xs text-slate-500 font-semibold">Type</Text>
          <Text className="text-base text-slate-50 font-bold">{TYPE_LABELS[vehicle.type] || 'N/A'}</Text>
        </View>
      </View>

      <View className="flex-row items-center gap-4 mb-5">
        <Scale size={20} color="#64748b" />
        <View>
          <Text className="text-xs text-slate-500 font-semibold">Max Capacity</Text>
          <Text className="text-base text-slate-50 font-bold">{vehicle.maxCapacityKg} kg</Text>
        </View>
      </View>

      <View className="flex-row items-center gap-4">
        <Cpu size={20} color="#64748b" />
        <View>
          <Text className="text-xs text-slate-500 font-semibold">Hardware GPS Device ID</Text>
          <Text className="text-base text-slate-50 font-bold">{vehicle.deviceId || 'No Device Linked'}</Text>
        </View>
      </View>
    </View>
  );
};
