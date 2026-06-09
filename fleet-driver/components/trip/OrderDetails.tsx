import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { UserCheck, User, Phone, Package, Scale, Clock, Timer, FileText } from 'lucide-react-native';
import { Order } from '@/types/trip';
import { useCountdown } from '../../hooks/useCountdown';
import { getCategoryLabel, getPriorityLabel, getPriorityColor, formatCountdown } from '../../utils/order';

interface OrderDetailsProps {
  order: Order;
  handleCall: (phone?: string) => void;
}

export const OrderDetails: React.FC<OrderDetailsProps> = ({ order, handleCall }) => {
  const remaining = useCountdown(order.deliveryDeadline);
  const countdown = formatCountdown(remaining);
  const isActiveOrder = !['delivered', 'failed', 'cancelled'].includes(order.status);
  const phone = order.recipientPhone || order.customerPhone;

  return (
    <View className="mt-4 pt-4 border-t border-white/5 gap-4">
      {/* Recipient Details */}
      <View className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 gap-2.5">
        <View className="flex-row items-center gap-2 mb-1">
          <UserCheck size={14} color="#818cf8" />
          <Text className="text-indigo-400 text-xs font-black uppercase tracking-wider">Thông tin người nhận</Text>
        </View>

        <View className="flex-row items-center justify-between py-1 border-b border-white/5">
          <View className="flex-row items-center gap-2">
            <User size={14} color="#94a3b8" />
            <Text className="text-slate-400 text-xs font-semibold">Người nhận</Text>
          </View>
          <Text className="text-slate-200 text-xs font-bold">{order.recipientName || order.customerName || 'N/A'}</Text>
        </View>

        <View className="flex-row items-center justify-between py-1">
          <View className="flex-row items-center gap-2">
            <Phone size={14} color="#94a3b8" />
            <Text className="text-slate-400 text-xs font-semibold">Số điện thoại</Text>
          </View>
          {phone ? (
            <TouchableOpacity 
              onPress={() => handleCall(phone)}
              className="bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/30 flex-row items-center gap-1"
            >
              <Text className="text-indigo-300 text-xs font-bold">{phone}</Text>
            </TouchableOpacity>
          ) : (
            <Text className="text-slate-500 text-xs font-medium">N/A</Text>
          )}
        </View>
      </View>

      {/* Order Specs */}
      <View className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 gap-2.5">
        <View className="flex-row items-center gap-2 mb-1">
          <Package size={14} color="#818cf8" />
          <Text className="text-indigo-400 text-xs font-black uppercase tracking-wider">Chi tiết hàng hóa</Text>
        </View>

        <View className="flex-row items-center justify-between py-1 border-b border-white/5">
          <Text className="text-slate-400 text-xs font-semibold">Phân loại</Text>
          <Text className="text-slate-200 text-xs font-bold">{getCategoryLabel(order.category)}</Text>
        </View>

        <View className="flex-row items-center justify-between py-1 border-b border-white/5">
          <Text className="text-slate-400 text-xs font-semibold">Độ ưu tiên</Text>
          <View className="px-2 py-0.5 rounded" style={{ backgroundColor: getPriorityColor(order.priority) + '20' }}>
            <Text className="text-[10px] font-bold" style={{ color: getPriorityColor(order.priority) }}>
              {getPriorityLabel(order.priority)}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between py-1">
          <View className="flex-row items-center gap-2">
            <Scale size={14} color="#94a3b8" />
            <Text className="text-slate-400 text-xs font-semibold">Khối lượng</Text>
          </View>
          <Text className="text-slate-200 text-xs font-bold">{order.weightKg ? `${order.weightKg} kg` : 'N/A'}</Text>
        </View>
      </View>

      {/* Delivery Constraint (Deadline) */}
      {order.deliveryDeadline && (
        <View className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 gap-2.5">
          <View className="flex-row items-center gap-2 mb-1">
            <Clock size={14} color="#818cf8" />
            <Text className="text-indigo-400 text-xs font-black uppercase tracking-wider">Hạn giao hàng</Text>
          </View>

          <View className="flex-row justify-between items-center">
            <View className="flex-1 mr-4">
              <Text className="text-slate-300 text-xs font-bold leading-5">
                {new Date(order.deliveryDeadline).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {new Date(order.deliveryDeadline).toLocaleDateString('vi-VN')}
              </Text>
            </View>
            {isActiveOrder && remaining !== null && (
              <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-lg" style={{ backgroundColor: countdown.color + '20' }}>
                <Timer size={10} color={countdown.color} />
                <Text className="text-[10px] font-bold" style={{ color: countdown.color }}>
                  {countdown.text}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Instructions */}
      {order.description && (
        <View className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
          <View className="flex-row items-center gap-2 mb-2">
            <FileText size={14} color="#818cf8" />
            <Text className="text-indigo-400 text-xs font-black uppercase tracking-wider">Chỉ dẫn giao hàng</Text>
          </View>
          <Text className="text-slate-400 text-xs leading-5">{order.description}</Text>
        </View>
      )}
    </View>
  );
};
