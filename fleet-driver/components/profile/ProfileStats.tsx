import React from 'react';
import { View } from 'react-native';
import { Trophy, Map as MapIcon, Activity } from 'lucide-react-native';
import { StatCard } from '../ui/StatCard';

interface ProfileStatsProps {
  completedCount: number;
  totalDistance: string;
  avgSpeed: string;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({ 
  completedCount, 
  totalDistance, 
  avgSpeed 
}) => {
  const stats = [
    { label: 'Completed', value: completedCount, icon: Trophy, color: '#fbbf24' },
    { label: 'Total Km', value: totalDistance, icon: MapIcon, color: '#10b981' },
    { label: 'Avg Speed', value: avgSpeed, icon: Activity, color: '#6366f1', unit: 'km/h' },
  ];

  return (
    <View className="flex-row justify-between px-5 -mt-4 mb-8">
      {stats.map((stat, index) => (
        <StatCard 
          key={index}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          unit={stat.unit}
        />
      ))}
    </View>
  );
};
