import React from 'react';
import { View, Text } from 'react-native';

interface TripRoutePathProps {
  origin?: string;
  destination?: string;
}

export const TripRoutePath: React.FC<TripRoutePathProps> = ({ 
  origin = 'Global Logistics Center - A4', 
  destination = 'Target Location Pending' 
}) => {
  return (
    <View className="flex-row mb-8 px-1">
      <View className="items-center w-6 mr-5">
        <View className="w-4 h-4 rounded-full bg-indigo-500 border-4 border-slate-900 z-10 shadow-sm" />
        <View className="w-px flex-1 bg-slate-800 my-1 border-l border-white/10" />
        <View className="w-4 h-4 rounded-lg bg-emerald-500 border-4 border-slate-900 z-10 shadow-sm" />
      </View>
      <View className="flex-1 gap-6 justify-center">
        <View>
          <Text className="text-slate-500 text-[9px] font-black uppercase tracking-[2px] mb-1">Origin Hub</Text>
          <Text className="text-white text-[15px] font-bold" numberOfLines={1}>{origin}</Text>
        </View>
        <View>
          <Text className="text-slate-500 text-[9px] font-black uppercase tracking-[2px] mb-1">Final Destination</Text>
          <Text className="text-white text-[15px] font-bold" numberOfLines={1}>{destination}</Text>
        </View>
      </View>
    </View>
  );
};
