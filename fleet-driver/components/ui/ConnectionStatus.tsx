import React from 'react';
import { View, Text } from 'react-native';
import { Wifi, WifiOff } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useTripStore } from '../../store/useTripStore';

export function ConnectionStatus() {
  const isOnline = useTripStore((state) => state.isSocketConnected);

  return (
    <BlurView
      intensity={80}
      tint="dark"
      className="flex-row items-center px-2 py-2 rounded-full border border-white/10"
    >
      <View className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      {isOnline ? (
        <Wifi size={14} color="#10b981" />
      ) : (
        <WifiOff size={14} color="#f43f5e" />
      )}
      <Text className={`ml-2 text-[10px] font-black uppercase tracking-widest ${isOnline ? 'text-emerald-500' : 'text-rose-500'}`}>
        {isOnline ? 'System Online' : 'Connection Lost'}
      </Text>
    </BlurView>
  );
}
