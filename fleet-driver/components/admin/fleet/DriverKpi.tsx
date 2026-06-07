import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Navigation, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react-native';
import { StatCard } from '../../ui/StatCard';

interface DriverKpiProps {
  kpi: any;
  kpiLoading: boolean;
  onCardPress?: (type: 'trips' | 'completion' | 'violations' | 'score') => void;
}

export const DriverKpi: React.FC<DriverKpiProps> = ({ kpi, kpiLoading, onCardPress }) => {
  return (
    <View className="bg-slate-800 rounded-[24px] p-5 border border-white/10">
      <Text className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-5">Driver KPI Metrics</Text>
      {kpiLoading ? (
        <ActivityIndicator size="small" color="#6366f1" className="py-4" />
      ) : (
        <View className="flex-row flex-wrap justify-between gap-y-3">
          <StatCard 
            label="Total Trips" 
            value={kpi?.totalTrips ?? 0} 
            icon={Navigation} 
            color="#6366f1" 
            onPress={() => onCardPress?.('trips')}
          />
          <StatCard 
            label="Completion" 
            value={kpi?.completionRate != null ? `${Number(kpi.completionRate).toFixed(0)}%` : '0%'} 
            icon={CheckCircle} 
            color="#10b981" 
            onPress={() => onCardPress?.('completion')}
          />
          <StatCard 
            label="Violations" 
            value={kpi?.totalViolations ?? 0} 
            icon={AlertTriangle} 
            color="#ef4444" 
            onPress={() => onCardPress?.('violations')}
          />
          <StatCard 
            label="KPI Score" 
            value={kpi?.kpiScore != null ? Number(kpi.kpiScore).toFixed(1) : '0.0'} 
            icon={TrendingUp} 
            color="#fbbf24" 
            onPress={() => onCardPress?.('score')}
          />
        </View>
      )}
    </View>
  );
};
