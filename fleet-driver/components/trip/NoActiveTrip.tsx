import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Truck, RefreshCcw } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface NoActiveTripProps {
  onRefresh: () => void;
}

export const NoActiveTrip: React.FC<NoActiveTripProps> = ({ onRefresh }) => {
  return (
    <View className="flex-1 bg-[#020617] justify-center items-center p-8">
      {/* Background Glows */}
      <View 
        className="absolute w-[400px] h-[400px] rounded-full bg-indigo-600/10" 
        style={{ top: '10%', left: '-20%', transform: [{ scale: 1.5 }] }} 
      />
      <View 
        className="absolute w-[350px] h-[350px] rounded-full bg-blue-600/10" 
        style={{ bottom: '10%', right: '-10%', transform: [{ scale: 1.5 }] }} 
      />

      <BlurView intensity={20} tint="dark" className="p-10 rounded-[48px] border border-slate-800/40 items-center overflow-hidden w-full max-w-[340px]">
        <LinearGradient
          colors={['#1e293b', '#0f172a']}
          className="w-28 h-28 rounded-[40px] justify-center items-center mb-10 shadow-2xl border border-slate-700/30"
        >
          <Truck size={48} color="#6366f1" strokeWidth={1.5} />
        </LinearGradient>
        
        <Text className="text-white text-4xl font-black text-center tracking-tight leading-none">NO ACTIVE{"\n"}MISSION</Text>
        <Text className="text-slate-400 text-center mt-6 leading-6 font-medium text-base">
          Stand by for incoming deployments. Fleet Intelligence is monitoring for new requests.
        </Text>

        <TouchableOpacity 
          className="mt-12 w-full overflow-hidden rounded-xl"
          onPress={onRefresh}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#6366f1', '#4f46e5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-5 flex-row justify-center items-center gap-3"
          >
            <RefreshCcw size={20} color="#fff" />
            <Text className="text-white font-black text-base uppercase tracking-widest">Check Status</Text>
          </LinearGradient>
        </TouchableOpacity>
      </BlurView>
    </View>
  );
};
