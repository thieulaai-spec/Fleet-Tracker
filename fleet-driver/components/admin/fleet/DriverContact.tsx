import React from 'react';
import { View, Text } from 'react-native';
import { Mail, Phone } from 'lucide-react-native';
import { Driver } from '../../../store/useFleetStore';

interface DriverContactProps {
  driver: Driver;
}

export const DriverContact: React.FC<DriverContactProps> = ({ driver }) => {
  return (
    <View className="bg-slate-800 rounded-[24px] p-5 border border-white/10">
      <Text className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-5">Contact Details</Text>

      <View className="flex-row items-center gap-4 mb-5">
        <Mail size={20} color="#64748b" />
        <View>
          <Text className="text-xs text-slate-500 font-semibold">Email</Text>
          <Text className="text-base text-slate-50 font-bold">{driver.user.email}</Text>
        </View>
      </View>

      <View className="flex-row items-center gap-4">
        <Phone size={20} color="#64748b" />
        <View>
          <Text className="text-xs text-slate-500 font-semibold">Phone</Text>
          <Text className="text-base text-slate-50 font-bold">
            {driver.user.phone || "Not provided"}
          </Text>
        </View>
      </View>
    </View>
  );
};
