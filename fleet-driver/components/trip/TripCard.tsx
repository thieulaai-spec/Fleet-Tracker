import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MapPin, Clock, ChevronRight } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Trip, TripStatus } from '../../types/trip';

interface TripCardProps {
  item: Trip;
  section: any;
  onPress: () => void;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  isLoading?: boolean;
}

export function TripCard({ item, section, onPress, onAccept, onReject, isLoading }: TripCardProps) {
  const trip = item;
  const isStarted = trip.status === TripStatus.IN_PROGRESS;
  const firstOrder = trip.orders[0];
  const lastOrder = trip.orders[trip.orders.length - 1];
  const pickupAddress = firstOrder?.pickupAddress || 'Origin Hub';
  const deliveryAddress = lastOrder?.address || 'No destination';
  const pickupTime = trip.createdAt;

  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.9}
      className="mb-4"
    >
      <BlurView
        intensity={40}
        tint="light"
        className={`rounded-[32px] overflow-hidden border ${isStarted ? 'border-indigo-500/50' : 'border-white/5'}`}
      >
        <View className="p-6 bg-slate-900/40">
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className="text-white text-lg font-black tracking-tight mb-1">
                Mission #{trip.id.slice(-6).toUpperCase()}
              </Text>
              <View className="flex-row items-center">
                <View className={`w-2 h-2 rounded-full mr-2 ${trip.status === TripStatus.IN_PROGRESS ? 'bg-indigo-500' : trip.status === TripStatus.ACCEPTED ? 'bg-amber-500' : 'bg-slate-500'}`} />
                <Text className={`text-[10px] font-black uppercase tracking-widest ${trip.status === TripStatus.IN_PROGRESS ? 'text-indigo-400' : trip.status === TripStatus.ACCEPTED ? 'text-amber-400' : 'text-slate-500'}`}>
                  {trip.status === TripStatus.PENDING ? 'Chờ nhận chuyến' :
                   trip.status === TripStatus.ACCEPTED ? 'Đang đi lấy hàng' :
                   trip.status === TripStatus.IN_PROGRESS ? 'Đang giao hàng' :
                   trip.status === TripStatus.COMPLETED ? 'Đã hoàn thành' :
                   trip.status === TripStatus.CANCELLED ? 'Đã hủy' : trip.status}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={isStarted ? "#818cf8" : "#475569"} />
          </View>

          <View className="gap-3">
            <View className="flex-row items-center">
              <MapPin size={14} color="#6366f1" />
              <Text className="text-slate-300 text-sm ml-2 font-medium" numberOfLines={1}>
                {pickupAddress}
              </Text>
            </View>
            <View className="flex-row items-center">
              <MapPin size={14} color="#f43f5e" />
              <Text className="text-slate-300 text-sm ml-2 font-medium" numberOfLines={1}>
                {deliveryAddress}
              </Text>
            </View>
          </View>

          {section.title === 'Pending Trips' ? (
            <View className="flex-row gap-3 mt-6 pt-4 border-t border-white/5">
              <TouchableOpacity 
                className="flex-1 bg-indigo-500 h-12 rounded-2xl items-center justify-center shadow-lg shadow-indigo-500/20"
                onPress={() => onAccept?.(trip.id)}
                disabled={isLoading}
              >
                <Text className="text-white font-black text-[10px] uppercase tracking-widest">Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 bg-white/5 h-12 rounded-2xl items-center justify-center border border-white/10"
                onPress={() => onReject?.(trip.id)}
                disabled={isLoading}
              >
                <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Pass</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="mt-6 flex-row justify-between items-center pt-4 border-t border-white/5">
              <View className="flex-row items-center">
                <Clock size={14} color="#94a3b8" />
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-2">
                  {new Date(pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                {isStarted ? 'Live Intelligence' : 'Mission Detail'}
              </Text>
            </View>
          )}
        </View>
      </BlurView>
    </TouchableOpacity>
  );
}
