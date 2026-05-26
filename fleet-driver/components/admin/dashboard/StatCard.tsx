import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  trend?: string;
  trendColor?: string;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  trend,
  trendColor = '#10b981'
}) => {
  return (
    <View 
      className="bg-slate-800 rounded-2xl p-4 mb-4 border border-white/5" 
      style={{ width: cardWidth }}
    >
      <View 
        className="w-10 h-10 rounded-xl justify-center items-center mb-3" 
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon size={20} color={color} />
      </View>
      <Text className="text-xl font-bold text-slate-50 mb-1">{value}</Text>
      <Text className="text-[12px] text-slate-400 uppercase tracking-wider font-semibold">{title}</Text>
      {trend && (
        <Text className="text-[11px] mt-2 font-bold" style={{ color: trendColor }}>{trend}</Text>
      )}
    </View>
  );
};

