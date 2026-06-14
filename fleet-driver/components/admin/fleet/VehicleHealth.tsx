import React from 'react';
import { View, Text } from 'react-native';
import { Vehicle } from '../../../store/useFleetStore';

interface Props {
  vehicle: Vehicle;
}

export const VehicleHealth: React.FC<Props> = ({ vehicle }) => {
  const km = vehicle.kmThisMonth !== undefined ? vehicle.kmThisMonth : 0;
  const condition = vehicle.condition || 'Good';

  // Format KM (e.g. 1500 -> 1.5k, or just keep it as number if small)
  const kmLabel = km >= 1000 ? `${(km / 1000).toFixed(1)}k` : `${km}`;

  return (
    <View className="bg-slate-800 rounded-[24px] p-5 border border-white/10">
      <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-5">Vehicle Health</Text>
      <View className="flex-row gap-3">
        <View className="flex-1 bg-white/5 p-4 rounded-2xl items-center">
          <Text className="text-lg font-extrabold text-emerald-500">{condition}</Text>
          <Text className="text-[11px] text-slate-500 font-bold mt-1">Condition</Text>
        </View>
        <View className="flex-1 bg-white/5 p-4 rounded-2xl items-center">
          <Text className="text-lg font-extrabold text-emerald-500">{kmLabel}</Text>
          <Text className="text-[11px] text-slate-500 font-bold mt-1">KM this month</Text>
        </View>
      </View>
    </View>
  );
};
