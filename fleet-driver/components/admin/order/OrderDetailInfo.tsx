import React from 'react';
import { View, Text } from 'react-native';
import { MapPin, Scale, Calendar, Package, Clock } from 'lucide-react-native';
import { Order } from '../../../store/useOrderStore';

interface OrderDetailInfoProps {
  order: Order;
}

export const OrderDetailInfo: React.FC<OrderDetailInfoProps> = ({ order }) => {
  return (
    <View className="gap-5">
      {/* Route Details */}
      <View className="bg-slate-900 rounded-3xl p-5 border border-white/5">
        <View className="flex-row items-center gap-2.5 mb-4">
          <MapPin size={20} color="#6366f1" />
          <Text className="text-lg font-bold text-slate-100">Route Details</Text>
        </View>
        
        <View className="flex-row gap-4">
          <View className="w-3 items-center">
            <View className="w-3 h-3 rounded-full bg-amber-500 mt-1" />
            <View className="w-0.5 flex-1 bg-white/10 my-1" />
          </View>
          <View className="flex-1 pb-4">
            <Text className="text-xs text-slate-500 font-semibold mb-1">Pickup Address</Text>
            <Text className="text-sm text-slate-300 leading-5">{order.pickupAddress}</Text>
          </View>
        </View>
        
        <View className="flex-row gap-4">
          <View className="w-3 items-center">
            <View className="w-3 h-3 rounded-full bg-emerald-500 mt-1" />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-slate-500 font-semibold mb-1">Delivery Address</Text>
            <Text className="text-sm text-slate-300 leading-5">{order.deliveryAddress}</Text>
          </View>
        </View>
      </View>

      {/* Weight & Date */}
      <View className="flex-row gap-4">
        <View className="flex-1 bg-slate-900 rounded-3xl p-5 border border-white/5">
          <View className="flex-row items-center gap-2 mb-3">
            <Scale size={18} color="#6366f1" />
            <Text className="text-sm font-bold text-slate-100">Weight</Text>
          </View>
          <Text className="text-xl font-extrabold text-white">{order.weightKg} kg</Text>
        </View>

        <View className="flex-1 bg-slate-900 rounded-3xl p-5 border border-white/5">
          <View className="flex-row items-center gap-2 mb-3">
            <Calendar size={18} color="#6366f1" />
            <Text className="text-sm font-bold text-slate-100">Date</Text>
          </View>
          <Text className="text-xl font-extrabold text-white">
            {new Date(order.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Instructions */}
      {order.description && (
        <View className="bg-slate-900 rounded-3xl p-5 border border-white/5">
          <View className="flex-row items-center gap-2.5 mb-4">
            <Package size={20} color="#6366f1" />
            <Text className="text-lg font-bold text-slate-100">Instructions</Text>
          </View>
          <Text className="text-slate-400 text-sm leading-6">{order.description}</Text>
        </View>
      )}

      {/* Timeline */}
      <View className="bg-slate-900 rounded-3xl p-5 border border-white/5">
        <View className="flex-row items-center gap-2.5 mb-4">
          <Clock size={20} color="#6366f1" />
          <Text className="text-lg font-bold text-slate-100">Timeline</Text>
        </View>
        <View className="flex-row items-center gap-3 mb-3">
          <View className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <Text className="text-slate-500 text-xs flex-1">
            Order created on {new Date(order.createdAt).toLocaleString()}
          </Text>
        </View>
        {order.updatedAt !== order.createdAt && (
          <View className="flex-row items-center gap-3">
            <View className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <Text className="text-slate-500 text-xs flex-1">
              Last updated on {new Date(order.updatedAt).toLocaleString()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};
