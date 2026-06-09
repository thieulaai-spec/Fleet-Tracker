import React from 'react';
import { View, Text, Image } from 'react-native';
import { User as UserIcon } from 'lucide-react-native';
import { DriverStatus } from '../../../store/useFleetStore';

const STATUS_CONFIG = {
  [DriverStatus.AVAILABLE]: { label: "Available", color: "#10b981" },
  [DriverStatus.ON_TRIP]: { label: "On Trip", color: "#6366f1" },
  [DriverStatus.OFF_DUTY]: { label: "Off Duty", color: "#94a3b8" },
};

interface DriverProfileCardProps {
  driver: any;
}

export const DriverProfileCard: React.FC<DriverProfileCardProps> = ({ driver }) => {
  if (!driver) return null;

  const status = STATUS_CONFIG[driver.status as DriverStatus] || STATUS_CONFIG[DriverStatus.OFF_DUTY];

  return (
    <View className="items-center py-8 bg-slate-800 rounded-b-[32px] border-b border-x border-white/5">
      <View className="w-24 h-24 rounded-[32px] bg-indigo-500/10 justify-center items-center mb-4 overflow-hidden">
        {driver?.avatarUrl || driver?.user?.avatarUrl ? (
          <Image 
            source={{ uri: driver.avatarUrl || driver.user.avatarUrl }} 
            className="w-full h-full" 
          />
        ) : (
          <UserIcon size={48} color="#6366f1" />
        )}
      </View>
      <Text className="text-2xl font-bold text-slate-50 mb-2">{driver?.user?.fullName}</Text>
      {status && (
        <View
          className="flex-row items-center px-3 py-1.5 rounded-xl gap-2"
          style={{ backgroundColor: `${status.color}20` }}
        >
          <View
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: status.color }}
          />
          <Text
            className="text-xs font-extrabold uppercase"
            style={{ color: status.color }}
          >
            {status.label}
          </Text>
        </View>
      )}
    </View>
  );
};
