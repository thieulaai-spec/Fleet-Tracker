import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { MapPin, Navigation, Camera } from 'lucide-react-native';
import { Order } from '@/types/trip';

interface OrderCardProps {
  order: Order;
  index: number;
  onNavigate?: (latitude: number, longitude: number) => void;
  onProof?: (orderId: string) => void;
  canSubmitProof?: boolean;
}

export const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  index, 
  onNavigate, 
  onProof, 
  canSubmitProof 
}) => {
  const isDelivered = order.status.toLowerCase() === 'delivered';

  return (
    <BlurView 
      intensity={10} 
      tint="light"
      className="rounded-[32px] p-5 mb-5 border border-white/5 overflow-hidden"
    >
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3 flex-1 mr-4">
          <View className="w-10 h-10 rounded-full bg-indigo-500/20 items-center justify-center">
            <Text className="text-indigo-400 font-black text-xs">{index + 1}</Text>
          </View>
          <Text className="text-white text-lg font-black flex-1" numberOfLines={1}>
            {order.customerName}
          </Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${isDelivered ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
          <Text className={`text-[10px] font-black uppercase ${isDelivered ? 'text-emerald-400' : 'text-amber-400'}`}>
            {order.status}
          </Text>
        </View>
      </View>

      <View className="flex-row items-start gap-3 mb-6 bg-white/5 p-4 rounded-2xl border border-white/5">
        <MapPin size={18} color="#f87171" className="mt-1" />
        <Text className="text-slate-300 text-sm leading-5 flex-1 font-medium">
          {order.address}
        </Text>
      </View>
      
      <View className="flex-row gap-3">
        {order.deliveryLocation && onNavigate && (
          <TouchableOpacity 
            className="flex-1 flex-row items-center justify-center gap-2 bg-indigo-500 h-12 rounded-xl"
            activeOpacity={0.8}
            onPress={() => onNavigate(order.deliveryLocation!.latitude, order.deliveryLocation!.longitude)}
          >
            <Navigation size={16} color="#fff" />
            <Text className="text-white text-sm font-bold uppercase">Navigate</Text>
          </TouchableOpacity>
        )}
        
        {canSubmitProof && !isDelivered && onProof && (
          <TouchableOpacity 
            className="flex-1 flex-row items-center justify-center gap-2 bg-emerald-500 h-12 rounded-xl"
            activeOpacity={0.8}
            onPress={() => onProof(order.id)}
          >
            <Camera size={16} color="#fff" />
            <Text className="text-white text-sm font-bold uppercase">Proof</Text>
          </TouchableOpacity>
        )}
      </View>
    </BlurView>
  );
};
