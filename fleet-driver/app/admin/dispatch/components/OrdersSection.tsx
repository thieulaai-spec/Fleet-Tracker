import React from 'react';
import { View, Text } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { Order } from '../../../../store/useOrderStore';
import { OrderDispatchItem } from '../../../../components/admin/order/OrderDispatchItem';

interface OrdersSectionProps {
  pendingOrders: Order[];
  selectedOrderId: string | null;
  onSelectOrder: (orderId: string | null) => void;
}

const OrdersSection: React.FC<OrdersSectionProps> = ({
  pendingOrders,
  selectedOrderId,
  onSelectOrder,
}) => {
  return (
    <View className="mt-4 mb-6">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-slate-50 font-bold text-lg">Pending Orders</Text>
        <View className="bg-amber-500/20 px-2 py-0.5 rounded-full">
          <Text className="text-amber-500 text-[10px] font-bold">{pendingOrders.length}</Text>
        </View>
      </View>
      
      {pendingOrders.length === 0 ? (
        <View className="bg-slate-900/50 rounded-3xl p-8 items-center border border-dashed border-slate-800">
          <AlertCircle size={32} color="#475569" />
          <Text className="text-slate-400 mt-2 text-center text-sm">No pending orders available</Text>
        </View>
      ) : (
        pendingOrders.map(order => (
          <OrderDispatchItem
            key={order.id}
            order={order}
            isSelected={selectedOrderId === order.id}
            onPress={() => onSelectOrder(order.id === selectedOrderId ? null : order.id)}
          />
        ))
      )}
    </View>
  );
};

export default OrdersSection;
