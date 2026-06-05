import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Layers, MapPin, Target } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

interface MapControlsProps {
  onCenter: () => void;
  onToggleType: () => void;
  onZoomToDestination: () => void;
  mapType: 'standard' | 'satellite' | 'hybrid';
  isFollowing?: boolean;
  isNavMode?: boolean;
}

export function MapControls({ onCenter, onToggleType, onZoomToDestination, mapType, isFollowing, isNavMode }: MapControlsProps) {
  return (
    <View className="absolute right-6 top-0 bottom-0 justify-center gap-4" style={{ zIndex: 9000 }}>
      <TouchableOpacity onPress={onToggleType} activeOpacity={0.7}>
        <BlurView intensity={80} tint="light" className="w-14 h-14 rounded-2xl items-center justify-center border border-white/10 overflow-hidden shadow-2xl">
          <Layers size={24} color={mapType === 'standard' ? '#64748b' : '#10b981'} />
        </BlurView>
      </TouchableOpacity>

      <TouchableOpacity onPress={onZoomToDestination} activeOpacity={0.7}>
        <BlurView intensity={80} tint="light" className="w-14 h-14 rounded-2xl items-center justify-center border border-emerald-500/30 overflow-hidden shadow-2xl bg-emerald-500/10">
          <MapPin size={24} color="#10b981" />
        </BlurView>
      </TouchableOpacity>

      <TouchableOpacity onPress={onCenter} activeOpacity={0.7}>
        <BlurView 
          intensity={80} 
          tint="light" 
          className={`w-14 h-14 rounded-2xl items-center justify-center border overflow-hidden shadow-2xl ${
            isNavMode 
              ? 'border-emerald-400 bg-emerald-500/30' 
              : isFollowing 
                ? 'border-emerald-400 bg-emerald-500/20' 
                : 'border-slate-300 bg-slate-100'
          }`}
        >
          <Target size={24} color={isNavMode ? '#059669' : isFollowing ? '#10b981' : '#475569'} />
        </BlurView>
      </TouchableOpacity>
    </View>
  );
}
