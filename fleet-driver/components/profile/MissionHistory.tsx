import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Navigation } from 'lucide-react-native';

interface MissionHistoryProps {
  tripHistory: any[];
}

export const MissionHistory: React.FC<MissionHistoryProps> = ({ tripHistory }) => {
  return (
    <View className="px-5 mt-10">
      <View className="flex-row items-center justify-between mb-4 ml-1">
        <View className="flex-row items-center">
          <View className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-2" />
          <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[2px]">Mission History</Text>
        </View>
        <TouchableOpacity>
          <Text className="text-indigo-400 text-[10px] font-black uppercase">View All</Text>
        </TouchableOpacity>
      </View>
      
      <View className="bg-slate-900/40 rounded-[32px] overflow-hidden border border-white/5">
        {tripHistory.length > 0 ? (
          tripHistory.slice(0, 3).map((trip, idx) => (
            <TouchableOpacity 
              key={trip.id} 
              className={`flex-row items-center justify-between p-5 ${idx !== 0 ? 'border-t border-white/5' : ''}`}
            >
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-full bg-slate-800 items-center justify-center">
                  <Navigation size={18} color={trip.status === 'completed' ? '#10b981' : '#6366f1'} />
                </View>
                <View>
                  <Text className="text-white text-sm font-bold mb-0.5 tracking-tight">
                    TRIP #{trip.id.substring(0, 8).toUpperCase()}
                  </Text>
                  <Text className="text-slate-500 text-[10px] font-medium uppercase tracking-wider">
                    {new Date(trip.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
              </View>
              <View 
                className={`px-3 py-1 rounded-full border ${trip.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-500/10 border-slate-500/20'}`}
              >
                <Text className={`text-[8px] font-black uppercase tracking-widest ${trip.status === 'completed' ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {trip.status}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View className="p-10 items-center">
            <Text className="text-slate-600 font-bold text-sm">No activity recorded yet</Text>
          </View>
        )}
      </View>
    </View>
  );
};
