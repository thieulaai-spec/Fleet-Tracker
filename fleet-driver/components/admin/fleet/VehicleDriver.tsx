import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { User as UserIcon } from 'lucide-react-native';
import { Vehicle } from '../../../store/useFleetStore';

interface VehicleDriverProps {
  vehicle: Vehicle;
  onViewProfile: (driverId: string) => void;
}

export const VehicleDriver: React.FC<VehicleDriverProps> = ({ vehicle, onViewProfile }) => {
  return (
    <View className="bg-slate-800 rounded-[24px] p-5 border border-white/10">
      <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-5">Assigned Driver</Text>
      
      <View className="flex-row items-center gap-4 mb-5">
        <UserIcon size={20} color="#64748b" />
        <View>
          <Text className="text-xs text-slate-500 font-semibold">Driver Name</Text>
          <Text className="text-base text-slate-50 font-bold">{vehicle.driver?.user.fullName || 'Unassigned'}</Text>
        </View>
      </View>

      {vehicle.driver && (
        <TouchableOpacity 
          className="bg-indigo-500/10 py-3 rounded-xl items-center mt-2"
          onPress={() => onViewProfile(vehicle.driverId as string)}
        >
          <Text className="text-indigo-500 font-bold text-sm">View Driver Profile</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
