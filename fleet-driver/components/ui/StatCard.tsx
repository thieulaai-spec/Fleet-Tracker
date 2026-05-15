import React from 'react';
import { View, Text, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LucideIcon } from 'lucide-react-native';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  unit?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color, unit }) => {
  return (
    <BlurView 
      intensity={Platform.OS === 'ios' ? 40 : 100}
      tint="dark"
      className="w-[31%] rounded-xl overflow-hidden border border-white/5"
      style={{ backgroundColor: Platform.OS === 'android' ? 'rgba(15, 23, 42, 0.8)' : 'transparent' }}
    >
      <View className="p-4 items-center">
        <View 
          className="w-10 h-10 rounded-2xl justify-center items-center mb-3"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={20} color={color} />
        </View>
        <View className="flex-row items-baseline">
          <Text className="text-white text-lg font-black">{value}</Text>
          {unit && <Text className="text-slate-500 text-[8px] ml-0.5 font-bold">{unit}</Text>}
        </View>
        <Text className="text-slate-500 text-[9px] uppercase font-black tracking-widest mt-1">{label}</Text>
      </View>
    </BlurView>
  );
};
