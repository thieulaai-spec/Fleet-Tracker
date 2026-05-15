import React from 'react';
import { View, Text } from 'react-native';
import { Mail, Phone, CreditCard, Truck } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { ProfileInfoItem } from '../ui/ProfileInfoItem';

interface AccountInfoProps {
  user: any;
  activeTrip: any;
}

export const AccountInfo: React.FC<AccountInfoProps> = ({ user, activeTrip }) => {
  return (
    <View className="px-5 mt-4">
      <View className="flex-row items-center mb-4 ml-1">
        <View className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2" />
        <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[2px]">Fleet Credentials</Text>
      </View>
      
      <BlurView 
        intensity={20} 
        tint="dark"
        className="rounded-[32px] overflow-hidden border border-white/5 bg-slate-900/40"
      >
        <View className="p-2">
          <ProfileInfoItem 
            label="Primary Email"
            value={user?.email || 'N/A'}
            icon={Mail}
            color="#6366f1"
          />
          <ProfileInfoItem 
            label="Mobile Number"
            value="+84 912 345 678"
            icon={Phone}
            color="#10b981"
          />
          <ProfileInfoItem 
            label="Operator License"
            value="Class C • 24-558291"
            icon={CreditCard}
            color="#fbbf24"
          />
          <ProfileInfoItem 
            label="Active Assignment"
            value={activeTrip ? `Vehicle ${activeTrip.vehicleId.substring(0, 8).toUpperCase()}` : 'No active vehicle'}
            icon={Truck}
            color="#6366f1"
            showDivider={false}
          />
        </View>
      </BlurView>
    </View>
  );
};
