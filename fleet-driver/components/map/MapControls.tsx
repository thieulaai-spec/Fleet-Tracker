import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Layers, Navigation2, Target } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

interface MapControlsProps {
  onCenter: () => void;
  onToggleType: () => void;
  mapType: 'standard' | 'satellite' | 'hybrid';
}

export function MapControls({ onCenter, onToggleType, mapType }: MapControlsProps) {
  return (
    <View className="absolute right-6 bottom-32 gap-4">
      <TouchableOpacity onPress={onToggleType} activeOpacity={0.7}>
        <BlurView intensity={80} tint="dark" className="w-14 h-14 rounded-2xl items-center justify-center border border-white/10 overflow-hidden shadow-2xl">
          <Layers size={24} color={mapType === 'standard' ? '#94a3b8' : '#6366f1'} />
        </BlurView>
      </TouchableOpacity>

      <TouchableOpacity onPress={onCenter} activeOpacity={0.7}>
        <BlurView intensity={80} tint="dark" className="w-14 h-14 rounded-2xl items-center justify-center border border-indigo-500/30 overflow-hidden shadow-2xl bg-indigo-500/10">
          <Target size={24} color="#818cf8" />
        </BlurView>
      </TouchableOpacity>
    </View>
  );
}
