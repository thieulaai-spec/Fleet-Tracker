import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Order, OrderStatus } from '@/types/trip';

interface OrderSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  currentOrder: any;
  onSelectOrder: (orderId: string) => void;
}

export const OrderSelectModal: React.FC<OrderSelectModalProps> = ({
  isOpen,
  onClose,
  orders,
  currentOrder,
  onSelectOrder,
}) => {
  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={isOpen}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        className="flex-1 justify-end bg-black/60"
        activeOpacity={1}
        onPress={onClose}
      >
        <View className="bg-slate-900 rounded-t-3xl border border-slate-700 pb-8 pt-4 px-5 max-h-[80%]">
          {/* Handle bar */}
          <View className="w-12 h-1.5 bg-slate-700 rounded-full self-center mb-5" />
          
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-black text-slate-50">Chọn nhiệm vụ mục tiêu</Text>
            <TouchableOpacity onPress={onClose} className="py-1 px-2">
              <Text className="text-base text-indigo-400 font-bold">Hủy</Text>
            </TouchableOpacity>
          </View>
          
          {/* Scrollable list */}
          <ScrollView contentContainerStyle={{ gap: 12 }} showsVerticalScrollIndicator={false}>
            {orders.map((item) => {
              const isSelected = currentOrder && currentOrder.id === item.id;
              const isDelivering = item.status === OrderStatus.PICKED_UP || item.status === OrderStatus.DELIVERING;
              const label = isDelivering ? 'Giao hàng' : 'Lấy hàng';
              const targetAddress = isDelivering ? item.address : item.pickupAddress;
              
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    onSelectOrder(item.id);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl border flex-row items-center justify-between ${
                    isSelected ? 'bg-indigo-500/10 border-indigo-500' : 'bg-slate-800 border-slate-700/50'
                  }`}
                  activeOpacity={0.7}
                >
                  <View className="flex-1 pr-4">
                    <View className="flex-row items-center gap-2 mb-1.5">
                      <View className={`w-2 h-2 rounded-full ${isDelivering ? 'bg-amber-400' : 'bg-blue-400'}`} />
                      <Text className={`font-black text-base ${isSelected ? 'text-indigo-400' : 'text-slate-50'}`}>
                        #{item.id.slice(-6).toUpperCase()}
                      </Text>
                      <View className={`px-2 py-0.5 rounded-md ${isDelivering ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                        <Text className={`text-[9px] font-black uppercase ${isDelivering ? 'text-amber-400' : 'text-blue-400'}`}>
                          {label}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs text-slate-400 font-medium" numberOfLines={1}>
                      {targetAddress}
                    </Text>
                  </View>
                  {isSelected && (
                    <View className="w-6 h-6 rounded-full bg-indigo-500 justify-center items-center">
                      <Text className="text-white text-xs font-black">✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};
