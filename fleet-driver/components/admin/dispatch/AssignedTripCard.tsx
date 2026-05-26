import React from 'react';
import { View, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { User, Phone, Truck } from 'lucide-react-native';

interface AssignedTripCardProps {
  assignedTrip?: {
    id: string;
    status: string;
    driver?: {
      id: string;
      fullName: string | null;
      phone: string | null;
    } | null;
    vehicle?: {
      id: string;
      plateNumber: string | null;
    } | null;
  } | null;
}

export const AssignedTripCard: React.FC<AssignedTripCardProps> = ({ assignedTrip }) => {
  if (!assignedTrip?.driver && !assignedTrip?.vehicle) {
    return null;
  }

  const driverName = assignedTrip.driver?.fullName || 'Chưa xác định';
  const driverPhone = assignedTrip.driver?.phone || 'Chưa xác định';
  const licensePlate = assignedTrip.vehicle?.plateNumber || 'Chưa xác định';

  return (
    <BlurView 
      intensity={10} 
      tint="dark" 
      className="mx-4 mt-4 p-4 rounded-3xl border border-white/10 bg-slate-900/40 overflow-hidden"
    >
      <View className="flex-row items-center justify-between mb-3 border-b border-white/5 pb-2">
        <Text className="font-black text-sm tracking-wider uppercase text-indigo-400">
          Thông tin tài xế & phương tiện
        </Text>
        <View className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30">
          <Text className="text-indigo-300 font-extrabold text-[10px] uppercase">Assigned</Text>
        </View>
      </View>

      <View className="gap-3">
        <View className="flex-row items-center gap-3">
          <View className="w-8 h-8 rounded-xl bg-indigo-500/10 justify-center items-center border border-indigo-500/20">
            <User size={16} color="#6366f1" />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-slate-400 font-semibold">Tài xế</Text>
            <Text className="text-white font-extrabold text-sm">{driverName}</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <View className="w-8 h-8 rounded-xl bg-indigo-500/10 justify-center items-center border border-indigo-500/20">
            <Phone size={16} color="#6366f1" />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-slate-400 font-semibold">Số điện thoại</Text>
            <Text className="text-white font-extrabold text-sm">{driverPhone}</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <View className="w-8 h-8 rounded-xl bg-indigo-500/10 justify-center items-center border border-indigo-500/20">
            <Truck size={16} color="#6366f1" />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-slate-400 font-semibold">Biển số xe</Text>
            <Text className="text-white font-extrabold text-sm">{licensePlate}</Text>
          </View>
        </View>
      </View>
    </BlurView>
  );
};
