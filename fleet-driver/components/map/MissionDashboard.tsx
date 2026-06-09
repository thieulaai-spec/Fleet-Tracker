import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { Navigation, Clock, Target, ChevronUp, ChevronDown } from 'lucide-react-native';
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

const getCategoryLabel = (category?: string) => {
  switch (category) {
    case 'bulk': return 'Dạng thô';
    case 'fragile': return 'Dễ vỡ';
    case 'bulky': return 'Cồng kềnh';
    case 'dangerous': return 'Nguy hiểm';
    case 'other': return 'Hàng khác';
    default: return '';
  }
};

const getCategoryBadgeStyles = (category?: string) => {
  switch (category) {
    case 'fragile': 
      return { 
        bg: 'bg-amber-500/10 border-amber-500/25', 
        text: 'text-amber-500' 
      };
    case 'dangerous': 
      return { 
        bg: 'bg-rose-500/10 border-rose-500/25', 
        text: 'text-rose-500' 
      };
    case 'bulk': 
      return { 
        bg: 'bg-blue-500/10 border-blue-500/25', 
        text: 'text-blue-400' 
      };
    case 'bulky': 
      return { 
        bg: 'bg-violet-500/10 border-violet-500/25', 
        text: 'text-violet-400' 
      };
    default: 
      return { 
        bg: 'bg-slate-500/10 border-slate-500/25', 
        text: 'text-slate-400' 
      };
  }
};

export const MissionDashboard: React.FC<MissionDashboardProps> = ({ activeTrip, currentOrder, routeData }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const formattedDistance = routeData 
    ? (routeData.distance / 1000).toFixed(1) + ' KM'
    : activeTrip.totalDistanceKm ? Number(activeTrip.totalDistanceKm).toFixed(1) + ' KM' : '-- KM';
    
  const formattedETA = routeData
    ? Math.round(routeData.duration / 60) + ' MIN'
    : '24 MIN'; // Default or calculated fallback

  return (
    <SafeAreaView pointerEvents="box-none" className="absolute top-0 left-0 right-0">
      <View pointerEvents="auto" className="px-4 pt-14">
        <BlurView 
          intensity={95} 
          tint="light" 
          className="rounded-[20px] border border-slate-700/50 shadow-2xl overflow-hidden"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.96)' }}
        >
          <TouchableOpacity 
            onPress={() => setIsCollapsed(!isCollapsed)} 
            activeOpacity={0.85}
            className="p-4"
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-3 flex-1 mr-2">
                <LinearGradient
                  colors={['#6366f1', '#4f46e5']}
                  className="w-11 h-11 rounded-[16px] justify-center items-center shadow-lg shadow-indigo-500/30"
                >
                  <Navigation size={22} color="#fff" strokeWidth={2} />
                </LinearGradient>
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5 mb-0.5 flex-wrap">
                    <View className="bg-indigo-500/20 px-1.5 py-0.5 rounded-full border border-indigo-500/30">
                      <Text className="text-indigo-400 text-[7px] font-black uppercase tracking-widest">In Progress</Text>
                    </View>
                    <View className="flex-row items-center gap-1 bg-emerald-500/10 px-1 py-0.5 rounded-full border border-emerald-500/20">
                      <View className="w-1 h-1 rounded-full bg-emerald-500" />
                      <Text className="text-emerald-400 text-[7px] font-black uppercase tracking-widest">Live</Text>
                    </View>
                    {currentOrder?.category && (
                      <View className={`px-1.5 py-0.5 rounded-full border ${getCategoryBadgeStyles(currentOrder.category).bg}`}>
                        <Text className={`text-[7px] font-black uppercase tracking-widest ${getCategoryBadgeStyles(currentOrder.category).text}`}>
                          {getCategoryLabel(currentOrder.category)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-white font-black text-lg tracking-tighter uppercase">Mission Intel</Text>
                  {!isCollapsed && (
                    <Text className="text-[#c7c7c7] text-[8px] font-black uppercase tracking-[1.5px] mt-0.5">
                      ID #{activeTrip.id.substring(0, 8).toUpperCase()}
                    </Text>
                  )}
                </View>
              </View>
              <View className="flex-row items-center gap-3.5">
                <ConnectionStatus />
                {isCollapsed ? <ChevronDown size={18} color="#64748b" /> : <ChevronUp size={18} color="#64748b" />}
              </View>
            </View>

            {!isCollapsed && (
              <View className="flex-row gap-5 mt-4 pt-3.5 border-t border-slate-700/50">
                <View className="flex-1 flex-row items-center gap-2.5">
                  <View className="w-8 h-8 rounded-xl bg-white/5 items-center justify-center border border-slate-700/30">
                    <Clock size={15} color="#818cf8" />
                  </View>
                  <View>
                    <Text className="text-[#c7c7c7] text-[8px] font-black uppercase tracking-wider">ETA</Text>
                    <Text className="text-slate-100 text-xs font-black tracking-tight">{formattedETA}</Text>
                  </View>
                </View>
                <View className="flex-1 flex-row items-center gap-2.5">
                  <View className="w-8 h-8 rounded-xl bg-white/5 items-center justify-center border border-slate-700/30">
                    <Target size={15} color="#818cf8" />
                  </View>
                  <View>
                    <Text className="text-[#c7c7c7] text-[8px] font-black uppercase tracking-wider">Distance</Text>
                    <Text className="text-slate-100 text-xs font-black tracking-tight">{formattedDistance}</Text>
                  </View>
                </View>
                
                <View className="justify-center">
                  <View 
                    className="px-3.5 py-1.5 rounded-xl border border-slate-700/30"
                    style={{ backgroundColor: getStatusColor(activeTrip.status) + '15' }}
                  >
                    <Text className="font-black text-[9px] uppercase tracking-[1.5px]" style={{ color: getStatusColor(activeTrip.status) }}>
                      {(activeTrip.status || '').replace('_', ' ')}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </BlurView>
      </View>
    </SafeAreaView>
  );
};
