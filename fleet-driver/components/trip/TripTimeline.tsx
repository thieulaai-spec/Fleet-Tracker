import React from 'react';
import { View, Text } from 'react-native';
import { Calendar, Truck, CheckCircle2 } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { TripStatus } from '../../store/useTripStore';

interface TripTimelineProps {
  trip: any;
  getTripDuration: () => string | null;
}

export const TripTimeline: React.FC<TripTimelineProps> = ({ trip, getTripDuration }) => {
  const isCompletedTrip = trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED;
  
  if (!isCompletedTrip) return null;

  return (
    <BlurView 
      intensity={10} 
      tint="light" 
      className="rounded-[32px] p-6 mb-8 border border-white/5 overflow-hidden"
    >
      <Text className="text-white text-base font-black italic mb-5 uppercase tracking-tight">Timeline hành trình</Text>
      
      <View className="gap-5">
        {/* Node 1: Dispatch */}
        <View className="flex-row gap-4">
          <View className="items-center">
            <View className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 items-center justify-center">
              <Calendar size={14} color="#818cf8" />
            </View>
            <View className="w-px flex-1 bg-white/10 my-1" />
          </View>
          <View className="flex-1 pb-1">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-0.5">Bàn giao</Text>
            <Text className="text-white text-sm font-bold">Chuyến đi được tạo & điều phối</Text>
            <Text className="text-slate-550 text-[11px] mt-0.5">
              {new Date(trip.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
            </Text>
          </View>
        </View>

        {/* Node 2: Start */}
        {trip.startedAt && (
          <View className="flex-row gap-4">
            <View className="items-center">
              <View className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 items-center justify-center">
                <Truck size={14} color="#60a5fa" />
              </View>
              {trip.completedAt && <View className="w-px flex-1 bg-white/10 my-1" />}
            </View>
            <View className="flex-1 pb-1">
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-0.5">Bắt đầu di chuyển</Text>
              <Text className="text-white text-sm font-bold">Rời trạm & bắt đầu giao hàng</Text>
              <Text className="text-slate-500 text-[11px] mt-0.5">
                {new Date(trip.startedAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
              </Text>
            </View>
          </View>
        )}

        {/* Node 3: Complete */}
        {trip.completedAt && (
          <View className="flex-row gap-4">
            <View className="items-center">
              <View className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 items-center justify-center">
                <CheckCircle2 size={14} color="#10b981" />
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-0.5">
                {trip.status === TripStatus.COMPLETED ? 'Hoàn thành' : 'Hủy chuyến'}
              </Text>
              <Text className={trip.status === TripStatus.COMPLETED ? 'text-emerald-400 text-sm font-bold' : 'text-rose-400 text-sm font-bold'}>
                {trip.status === TripStatus.COMPLETED ? 'Giao tất cả đơn hàng thành công' : 'Chuyến đi đã bị hủy'}
              </Text>
              <Text className="text-slate-500 text-[11px] mt-0.5">
                {new Date(trip.completedAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
              </Text>
              
              {getTripDuration() && (
                <View className="bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl self-start mt-2">
                  <Text className="text-emerald-400 text-[10px] font-black uppercase">
                    Thời gian vận hành: {getTripDuration()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </BlurView>
  );
};
