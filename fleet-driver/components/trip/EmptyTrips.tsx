import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Calendar } from 'lucide-react-native';

interface EmptyTripsProps {
  onRefresh: () => void;
}

export const EmptyTrips: React.FC<EmptyTripsProps> = ({ onRefresh }) => {
  return (
    <View className="items-center justify-center mt-20 px-12">
      <View className="w-28 h-28 bg-[#0f172a] rounded-[45px] justify-center items-center mb-8 border border-white/5 shadow-2xl">
        <Calendar size={40} color="#334155" strokeWidth={1.5} />
      </View>
      <Text className="text-white text-3xl font-black text-center tracking-tight mb-3">All Clear</Text>
      <Text className="text-slate-500 text-[13px] text-center leading-5 font-medium">
        No new assignments scheduled. Enjoy your downtime or force a sync to check again.
      </Text>
      
      <TouchableOpacity 
        activeOpacity={0.7}
        className="mt-12 bg-indigo-500/10 px-10 py-5 rounded-xl border border-indigo-500/20"
        onPress={onRefresh}
      >
        <Text className="text-indigo-400 font-black uppercase tracking-[2px] text-xs">Request Update</Text>
      </TouchableOpacity>
    </View>
  );
};
