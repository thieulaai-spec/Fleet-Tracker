import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Package, MapPin, Calendar, ChevronRight } from 'lucide-react-native';
import { Order } from '../../../store/useOrderStore';

interface OrderDispatchItemProps {
  order: Order;
  isSelected: boolean;
  onPress: () => void;
}

export const OrderDispatchItem: React.FC<OrderDispatchItemProps> = ({ order, isSelected, onPress }) => {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className={`p-4 mb-3 rounded-2xl border ${
        isSelected 
          ? 'bg-indigo-500/10 border-indigo-500/50' 
          : 'bg-slate-800/50 border-white/5'
      }`}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row items-center">
          <View className={`w-10 h-10 rounded-xl justify-center items-center mr-3 ${
            isSelected ? 'bg-indigo-500' : 'bg-slate-700'
          }`}>
            <Package size={20} color={isSelected ? '#fff' : '#94a3b8'} />
          </View>
          <View>
            <Text className="text-slate-50 font-bold text-sm">Order #{order.id.slice(-6).toUpperCase()}</Text>
            <Text className="text-slate-400 text-[11px]">{order.weightKg}kg • Single Trip</Text>
          </View>
        </View>
        <View className="bg-amber-500/10 px-2 py-1 rounded-md">
          <Text className="text-amber-500 text-[10px] font-bold uppercase">Pending</Text>
        </View>
      </View>

      <View className="space-y-2">
        <View className="flex-row items-center">
          <MapPin size={14} color="#6366f1" />
          <Text className="text-slate-300 text-xs ml-2 flex-1" numberOfLines={1}>
            {order.pickupAddress}
          </Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-3.5 items-center">
            <View className="w-0.5 h-3 bg-slate-700" />
          </View>
        </View>
        <View className="flex-row items-center">
          <MapPin size={14} color="#f43f5e" />
          <Text className="text-slate-300 text-xs ml-2 flex-1" numberOfLines={1}>
            {order.deliveryAddress}
          </Text>
        </View>
      </View>

      <View className="mt-3 pt-3 border-t border-white/5 flex-row justify-between items-center">
        <View className="flex-row items-center">
          <Calendar size={14} color="#94a3b8" />
          <Text className="text-slate-400 text-[11px] ml-1.5">
            {new Date(order.createdAt).toLocaleDateString()}
          </Text>
        </View>
        {isSelected && (
          <View className="flex-row items-center">
            <Text className="text-indigo-400 text-[11px] font-bold mr-1">Selected</Text>
            <ChevronRight size={14} color="#6366f1" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
