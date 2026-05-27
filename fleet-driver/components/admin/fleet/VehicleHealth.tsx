import React from 'react';
import { View, Text } from 'react-native';

export const VehicleHealth: React.FC = () => {
  return (
    <View className="bg-slate-800 rounded-[24px] p-5 border border-white/10">
      <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-5">Vehicle Health</Text>
      <View className="flex-row gap-3">
        <View className="flex-1 bg-white/5 p-4 rounded-2xl items-center">
          <Text className="text-lg font-extrabold text-emerald-500">Good</Text>
          <Text className="text-[11px] text-slate-500 font-bold mt-1">Condition</Text>
        </View>
        <View className="flex-1 bg-white/5 p-4 rounded-2xl items-center">
          <Text className="text-lg font-extrabold text-emerald-500">85%</Text>
          <Text className="text-[11px] text-slate-500 font-bold mt-1">Fuel</Text>
        </View>
        <View className="flex-1 bg-white/5 p-4 rounded-2xl items-center">
          <Text className="text-lg font-extrabold text-emerald-500">1.2k</Text>
          <Text className="text-[11px] text-slate-500 font-bold mt-1">KM this month</Text>
        </View>
      </View>
    </View>
  );
};
