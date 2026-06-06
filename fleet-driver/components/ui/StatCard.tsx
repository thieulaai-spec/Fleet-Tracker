import React from 'react';
import { View, Text, Platform, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { LucideIcon } from 'lucide-react-native';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  unit?: string;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color, unit, onPress }) => {
  const content = (
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
  );

  if (onPress) {
    return (
      <TouchableOpacity 
        onPress={onPress}
        className="w-[48%] rounded-xl overflow-hidden border border-slate-700/50"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)' }}
      >
        <BlurView 
          intensity={Platform.OS === 'ios' ? 40 : 100}
          tint="light"
          className="w-full"
        >
          {content}
        </BlurView>
      </TouchableOpacity>
    );
  }

  return (
    <BlurView 
      intensity={Platform.OS === 'ios' ? 40 : 100}
      tint="light"
      className="w-[48%] rounded-xl overflow-hidden border border-slate-700/50"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)' }}
    >
      {content}
    </BlurView>
  );
};
