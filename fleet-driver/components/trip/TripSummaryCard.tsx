import React from 'react';
import { View, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { Route, Fuel } from 'lucide-react-native';

interface TripSummaryCardProps {
  totalDistanceKm: number;
  estimatedFuelCost?: number | string;
}

export const TripSummaryCard: React.FC<TripSummaryCardProps> = ({ totalDistanceKm, estimatedFuelCost }) => {
  const estFuel = (totalDistanceKm * 0.1).toFixed(1);
  const showFuelCost = estimatedFuelCost !== undefined && estimatedFuelCost !== null;
  const fuelCostNum = showFuelCost ? Math.round(Number(estimatedFuelCost)) : 0;

  return (
    <BlurView 
      intensity={30} 
      tint="light" 
      className="rounded-[32px] p-6 mt-4 border border-indigo-500/20 bg-indigo-500/5 overflow-hidden"
    >
      <Text className="text-white text-lg font-black italic mb-5 uppercase tracking-tight">Trip Summary</Text>
      
      <View className="flex-row gap-4 flex-wrap">
        <View className="flex-1 min-w-[110px] bg-white/5 p-4 rounded-2xl border border-white/5">
          <Route size={20} color="#94a3b8" className="mb-2" />
          <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Distance</Text>
          <Text className="text-white text-xl font-black">
            {totalDistanceKm} <Text className="text-sm font-medium">KM</Text>
          </Text>
        </View>
        
        <View className="flex-1 min-w-[110px] bg-white/5 p-4 rounded-2xl border border-white/5">
          <Fuel size={20} color="#94a3b8" className="mb-2" />
          <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Est. Fuel</Text>
          <Text className="text-white text-xl font-black">
            {estFuel} <Text className="text-sm font-medium">L</Text>
          </Text>
        </View>

        {showFuelCost && (
          <View className="flex-1 min-w-[110px] bg-white/5 p-4 rounded-2xl border border-white/5">
            <Fuel size={20} color="#10b981" className="mb-2" />
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Fuel Cost</Text>
            <Text className="text-emerald-400 text-lg font-black" numberOfLines={1}>
              {fuelCostNum.toLocaleString('vi-VN')} <Text className="text-[10px] font-bold">₫</Text>
            </Text>
          </View>
        )}
      </View>
    </BlurView>
  );
};
