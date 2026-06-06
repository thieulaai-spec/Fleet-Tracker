import React from 'react';
import { View } from 'react-native';
import { Navigation, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react-native';
import { StatCard } from '../ui/StatCard';

interface ProfileStatsProps {
  kpi?: {
    totalTrips: number;
    completionRate: number;
    totalViolations: number;
    kpiScore: number;
  } | null;
  onCardPress?: (type: 'trips' | 'completion' | 'violations' | 'score') => void;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({ kpi, onCardPress }) => {
  const stats = [
    { 
      label: 'Total Trips', 
      value: kpi?.totalTrips ?? 0, 
      icon: Navigation, 
      color: '#6366f1', // indigo 
      type: 'trips' as const
    },
    { 
      label: 'Completion Rate', 
      value: kpi?.completionRate != null ? `${Number(kpi.completionRate).toFixed(0)}%` : '0%', 
      icon: CheckCircle, 
      color: '#10b981', // emerald 
      type: 'completion' as const
    },
    { 
      label: 'Safety Violations', 
      value: kpi?.totalViolations ?? 0, 
      icon: AlertTriangle, 
      color: '#ef4444', // red
      type: 'violations' as const
    },
    { 
      label: 'Performance Score', 
      value: kpi?.kpiScore != null ? Number(kpi.kpiScore).toFixed(1) : '0.0', 
      icon: TrendingUp, 
      color: '#fbbf24', // amber
      type: 'score' as const
    },
  ];

  return (
    <View className="flex-row flex-wrap justify-between px-5 -mt-4 mb-8 gap-y-3">
      {stats.map((stat, index) => (
        <StatCard 
          key={index}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          onPress={() => onCardPress?.(stat.type)}
        />
      ))}
    </View>
  );
};
