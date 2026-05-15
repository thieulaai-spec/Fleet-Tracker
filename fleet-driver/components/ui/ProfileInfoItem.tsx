import React from 'react';
import { View, Text } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface ProfileInfoItemProps {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  showDivider?: boolean;
}

export const ProfileInfoItem: React.FC<ProfileInfoItemProps> = ({ 
  label, 
  value, 
  icon: Icon, 
  color, 
  showDivider = true 
}) => {
  return (
    <>
      <View className="flex-row items-center gap-4 p-4">
        <View 
          className="w-12 h-12 rounded-2xl items-center justify-center border"
          style={{ 
            backgroundColor: `${color}15`,
            borderColor: `${color}20`
          }}
        >
          <Icon size={22} color={color} />
        </View>
        <View className="flex-1">
          <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">{label}</Text>
          <Text className="text-white text-base font-bold tracking-tight">{value}</Text>
        </View>
      </View>
      {showDivider && <View className="h-px bg-white/5 mx-4" />}
    </>
  );
};
