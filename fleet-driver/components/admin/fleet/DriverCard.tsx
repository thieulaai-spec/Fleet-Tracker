import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { User as UserIcon, ShieldCheck, Activity, ChevronRight } from 'lucide-react-native';
import { Driver, DriverStatus } from '../../../store/useFleetStore';

const DRIVER_STATUS_CONFIG = {
  [DriverStatus.AVAILABLE]: { label: 'Available', color: '#10b981' },
  [DriverStatus.ON_TRIP]: { label: 'On Trip', color: '#6366f1' },
  [DriverStatus.OFF_DUTY]: { label: 'Off Duty', color: '#94a3b8' },
};

interface DriverCardProps {
  driver: Driver;
  onPress: () => void;
}

export const DriverCard: React.FC<DriverCardProps> = ({ driver, onPress }) => {
  const status = DRIVER_STATUS_CONFIG[driver.status] || DRIVER_STATUS_CONFIG[DriverStatus.OFF_DUTY];
  
  return (
    <TouchableOpacity 
      className="bg-slate-800 rounded-3xl p-5 mb-4 border border-white/10" 
      onPress={onPress}
    >
      <View className="flex-row items-center mb-4">
        <View className="w-12 h-12 rounded-2xl bg-indigo-500/10 justify-center items-center mr-3">
          <UserIcon size={24} color="#6366f1" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-slate-50">{driver.user.fullName}</Text>
          <Text className="text-[13px] text-slate-400">{driver.user.email}</Text>
        </View>
        <View 
          className="flex-row items-center px-2.5 py-1 rounded-lg gap-1.5" 
          style={{ backgroundColor: `${status.color}20` }}
        >
          <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.color }} />
          <Text className="text-[11px] font-extrabold uppercase" style={{ color: status.color }}>
            {status.label}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center pt-4 border-t border-white/5 gap-4">
        <View className="flex-1 flex-row items-center gap-1.5">
          <ShieldCheck size={16} color="#94a3b8" />
          <Text className="text-slate-400 text-xs font-semibold">{driver.licenseClass || 'N/A'}</Text>
        </View>
        <View className="flex-1 flex-row items-center gap-1.5">
          <Activity size={16} color="#94a3b8" />
          <Text className="text-slate-400 text-xs font-semibold">Active</Text>
        </View>
        <ChevronRight size={20} color="#475569" />
      </View>
    </TouchableOpacity>
  );
};
