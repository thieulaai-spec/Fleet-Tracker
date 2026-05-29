import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { Navigation, Clock, Target } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ConnectionStatus } from '../ui/ConnectionStatus';
import { Trip, Order } from '@/types/trip';

interface MissionDashboardProps {
  activeTrip: Trip;
  currentOrder?: Order | null;
  routeData?: {
    distance: number;
    duration: number;
  } | null;
}

const getStatusColor = (status: string = '') => {
  switch ((status || '').toLowerCase()) {
    case 'pending': return '#f59e0b';
    case 'accepted': return '#6366f1';
    case 'in_progress': return '#818cf8';
    case 'completed': return '#10b981';
    default: return '#94a3b8';
  }
};

export const MissionDashboard: React.FC<MissionDashboardProps> = ({ activeTrip, currentOrder, routeData }) => {
  const formattedDistance = routeData 
    ? (routeData.distance / 1000).toFixed(1) + ' KM'
    : activeTrip.totalDistanceKm ? Number(activeTrip.totalDistanceKm).toFixed(1) + ' KM' : '-- KM';
    
  const formattedETA = routeData
    ? Math.round(routeData.duration / 60) + ' MIN'
    : '24 MIN'; // Default or calculated fallback

  return (
    <SafeAreaView className="absolute top-0 left-0 right-0 pointer-events-none">
      <View className="px-5 pt-20 pointer-events-auto">
        <BlurView intensity={35} tint="dark" className="rounded-[32px] border border-white/10 shadow-2xl overflow-hidden">
          <View className="p-5 bg-slate-900/40">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-4">
                <LinearGradient
                  colors={['#6366f1', '#4f46e5']}
                  className="w-14 h-14 rounded-[22px] justify-center items-center shadow-lg shadow-indigo-500/30"
                >
                  <Navigation size={28} color="#fff" strokeWidth={2} />
                </LinearGradient>
                <View>
                  <View className="flex-row items-center gap-2 mb-1">
                    <View className="bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
                      <Text className="text-indigo-400 text-[8px] font-black uppercase tracking-widest">In Progress</Text>
                    </View>
                    <View className="flex-row items-center gap-1.5 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                      <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <Text className="text-emerald-400 text-[8px] font-black uppercase tracking-widest">Live</Text>
                    </View>
                  </View>
                  <Text className="text-white font-black text-xl tracking-tighter uppercase">Mission Intel</Text>
                  <Text className="text-[#c7c7c7] text-[9px] font-black uppercase tracking-[1.5px] mt-0.5">
                    ID #{activeTrip.id.substring(0, 8).toUpperCase()}
                  </Text>
                </View>
              </View>
              <ConnectionStatus />
            </View>

            <View className="flex-row gap-6 mt-6 pt-5 border-t border-white/5">
              <View className="flex-1 flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-2xl bg-white/5 items-center justify-center border border-white/5">
                  <Clock size={18} color="#818cf8" />
                </View>
                <View>
                  <Text className="text-[#c7c7c7] text-[9px] font-black uppercase tracking-wider">ETA</Text>
                  <Text className="text-slate-100 text-sm font-black tracking-tight">{formattedETA}</Text>
                </View>
              </View>
              <View className="flex-1 flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-2xl bg-white/5 items-center justify-center border border-white/5">
                  <Target size={18} color="#818cf8" />
                </View>
                <View>
                  <Text className="text-[#c7c7c7] text-[9px] font-black uppercase tracking-wider">Distance</Text>
                  <Text className="text-slate-100 text-sm font-black tracking-tight">{formattedDistance}</Text>
                </View>
              </View>
              
              <View className="justify-center">
                <View 
                  className="px-5 py-2 rounded-2xl border border-white/5"
                  style={{ backgroundColor: getStatusColor(activeTrip.status) + '15' }}
                >
                  <Text className="font-black text-[10px] uppercase tracking-[1.5px]" style={{ color: getStatusColor(activeTrip.status) }}>
                    {(activeTrip.status || '').replace('_', ' ')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </BlurView>
      </View>
    </SafeAreaView>
  );
};
