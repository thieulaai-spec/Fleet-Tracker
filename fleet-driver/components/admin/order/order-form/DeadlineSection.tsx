import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Clock, Calendar, ChevronRight } from 'lucide-react-native';

interface DeadlineSectionProps {
  deliveryDeadline: Date;
  errors: Record<string, string>;
  onOpenDatePicker: () => void;
}

export const DeadlineSection: React.FC<DeadlineSectionProps> = ({
  deliveryDeadline,
  errors,
  onOpenDatePicker,
}) => {
  return (
    <View className="bg-slate-900 rounded-3xl p-5 border border-slate-700/50 gap-4">
      <View className="flex-row items-center gap-2.5 mb-1">
        <Clock size={20} color="#10b981" />
        <Text className="text-lg font-bold text-slate-50">Delivery Constraint</Text>
      </View>
      
      <View className="gap-2">
        <Text className="text-sm font-semibold text-slate-400 ml-1">Delivery Deadline</Text>
        <TouchableOpacity
          onPress={onOpenDatePicker}
          className={`flex-row items-center bg-slate-800 rounded-2xl h-[52px] px-4 gap-3 border border-slate-700/50 ${errors.deliveryDeadline ? 'border-red-500' : ''}`}
          activeOpacity={0.7}
        >
          <Calendar size={18} color="#64748b" style={{ marginRight: 4 }} />
          <Text className="flex-1 text-slate-50 text-base">
            {deliveryDeadline.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {deliveryDeadline.toLocaleDateString('vi-VN')}
          </Text>
          <ChevronRight size={18} color="#64748b" />
        </TouchableOpacity>
        {!!errors.deliveryDeadline && <Text className="text-red-500 text-xs font-semibold ml-1">{errors.deliveryDeadline}</Text>}
      </View>
    </View>
  );
};
