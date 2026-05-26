import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LucideIcon, ChevronRight } from 'lucide-react-native';

interface ReportCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  onPress: () => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({ title, subtitle, icon: Icon, color, onPress }) => {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="bg-slate-800 rounded-3xl p-5 mb-4 border border-white/10 flex-row items-center"
    >
      <View 
        className="w-14 h-14 rounded-2xl justify-center items-center mr-4"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon size={28} color={color} />
      </View>
      <View className="flex-1">
        <Text className="text-slate-50 font-bold text-lg">{title}</Text>
        <Text className="text-slate-400 text-sm">{subtitle}</Text>
      </View>
      <View className="w-10 h-10 rounded-full bg-slate-900 justify-center items-center">
        <ChevronRight size={20} color="#475569" />
      </View>
    </TouchableOpacity>
  );
};
