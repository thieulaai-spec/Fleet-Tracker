import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Calendar } from 'lucide-react-native';

interface CustomDatePickerRangeProps {
  startDate: Date;
  endDate: Date;
  onShowPicker: (type: 'start' | 'end') => void;
}

export const CustomDatePickerRange: React.FC<CustomDatePickerRangeProps> = ({
  startDate,
  endDate,
  onShowPicker,
}) => {
  return (
    <View className="px-6 mb-4 flex-row gap-3">
      <TouchableOpacity
        onPress={() => onShowPicker('start')}
        className="flex-1 bg-slate-900/40 border border-white/5 p-3 rounded-2xl flex-row items-center justify-between"
        activeOpacity={0.7}
      >
        <View>
          <Text className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Từ ngày</Text>
          <Text className="text-white text-xs font-bold mt-0.5">{startDate.toLocaleDateString('vi-VN')}</Text>
        </View>
        <Calendar size={14} color="#10b981" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onShowPicker('end')}
        className="flex-1 bg-slate-900/40 border border-white/5 p-3 rounded-2xl flex-row items-center justify-between"
        activeOpacity={0.7}
      >
        <View>
          <Text className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Đến ngày</Text>
          <Text className="text-white text-xs font-bold mt-0.5">{endDate.toLocaleDateString('vi-VN')}</Text>
        </View>
        <Calendar size={14} color="#10b981" />
      </TouchableOpacity>
    </View>
  );
};
