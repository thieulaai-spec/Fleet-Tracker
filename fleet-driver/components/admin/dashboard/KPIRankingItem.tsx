import React from 'react';
import { View, Text } from 'react-native';
import { Star, TrendingUp, Award } from 'lucide-react-native';
import { DriverKPI } from '../../../store/useReportStore';

interface KPIRankingItemProps {
  kpi: DriverKPI;
  rank: number;
}

export const KPIRankingItem: React.FC<KPIRankingItemProps> = ({ kpi, rank }) => {
  const getRankColor = () => {
    if (rank === 1) return '#f59e0b'; // Gold
    if (rank === 2) return '#94a3b8'; // Silver
    if (rank === 3) return '#b45309'; // Bronze
    return '#475569';
  };

  return (
    <View className="bg-slate-800/50 rounded-2xl p-4 mb-3 border border-white/5 flex-row items-center">
      <View 
        className="w-10 h-10 rounded-full justify-center items-center mr-4"
        style={{ backgroundColor: `${getRankColor()}20` }}
      >
        {rank <= 3 ? (
          <Award size={20} color={getRankColor()} />
        ) : (
          <Text className="text-slate-400 font-bold">{rank}</Text>
        )}
      </View>
      
      <View className="flex-1">
        <Text className="text-slate-50 font-bold text-base">{kpi.driverName}</Text>
        <View className="flex-row items-center mt-1">
          <Star size={12} color="#f59e0b" fill="#f59e0b" />
          <Text className="text-amber-500 text-xs font-bold ml-1">{kpi.rating.toFixed(1)}</Text>
          <Text className="text-slate-500 text-[10px] mx-2">•</Text>
          <TrendingUp size={12} color="#10b981" />
          <Text className="text-emerald-500 text-xs font-bold ml-1">{kpi.onTimeRate}% On-time</Text>
        </View>
      </View>

      <View className="items-end">
        <Text className="text-slate-400 text-[10px] uppercase font-bold mb-0.5">Score</Text>
        <Text className="text-indigo-400 font-black text-lg">{kpi.score}</Text>
      </View>
    </View>
  );
};
