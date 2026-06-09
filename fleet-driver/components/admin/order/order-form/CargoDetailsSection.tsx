import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Scale, FileText, ChevronRight } from 'lucide-react-native';
import { categories } from './CategoryModal';

const priorities = [
  { label: 'Thấp', value: 'low', activeBg: 'bg-emerald-500' },
  { label: 'Trung bình', value: 'medium', activeBg: 'bg-amber-500' },
  { label: 'Cao', value: 'high', activeBg: 'bg-rose-500' },
];

interface CargoDetailsSectionProps {
  weightKg: string;
  onWeightKgChange: (text: string) => void;
  description: string;
  onDescriptionChange: (text: string) => void;
  category: string;
  onOpenCategoryModal: () => void;
  priority: string;
  onPriorityChange: (value: any) => void;
  errors: Record<string, string>;
}

export const CargoDetailsSection: React.FC<CargoDetailsSectionProps> = ({
  weightKg,
  onWeightKgChange,
  description,
  onDescriptionChange,
  category,
  onOpenCategoryModal,
  priority,
  onPriorityChange,
  errors,
}) => {
  const selectedCategoryLabel = categories.find(c => c.value === category)?.label || 'Chọn phân loại';

  return (
    <View className="bg-slate-900 rounded-3xl p-5 border border-slate-700/50 gap-4">
      <View className="flex-row items-center gap-2.5 mb-1">
        <Scale size={20} color="#10b981" />
        <Text className="text-lg font-bold text-slate-50">Cargo Info</Text>
      </View>
      
      <View className="gap-2">
        <Text className="text-sm font-semibold text-slate-400 ml-1">Weight (kg)</Text>
        <TextInput
          className={`bg-slate-800 rounded-2xl h-[52px] px-4 text-slate-50 text-base border border-slate-700/50 ${errors.weightKg ? 'border-red-500' : ''}`}
          placeholder="e.g. 150.5"
          placeholderTextColor="#64748b"
          keyboardType="numeric"
          value={weightKg}
          onChangeText={onWeightKgChange}
        />
        {!!errors.weightKg && <Text className="text-red-500 text-xs font-semibold ml-1">{errors.weightKg}</Text>}
      </View>

      <View className="gap-2">
        <View className="flex-row items-center gap-1.5">
          <FileText size={16} color="#64748b" />
          <Text className="text-sm font-semibold text-slate-400 ml-1">Description (Optional)</Text>
        </View>
        <TextInput
          className="bg-slate-800 rounded-2xl h-[100px] pt-4 px-4 text-slate-50 text-base border border-slate-700/50"
          placeholder="Cargo type, handling instructions..."
          placeholderTextColor="#64748b"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={onDescriptionChange}
          style={{ textAlignVertical: 'top' }}
        />
      </View>

      {/* Phân loại hàng hoá */}
      <View className="gap-2">
        <Text className="text-sm font-semibold text-slate-400 ml-1">Phân loại hàng hoá</Text>
        <TouchableOpacity
          onPress={onOpenCategoryModal}
          className="flex-row items-center bg-slate-800 rounded-2xl h-[52px] px-4 gap-3 border border-slate-700/50"
          activeOpacity={0.7}
        >
          <FileText size={18} color="#10b981" />
          <Text className="flex-1 text-slate-550 text-[15px] font-semibold">
            {selectedCategoryLabel}
          </Text>
          <ChevronRight size={18} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Mức độ ưu tiên */}
      <View className="gap-2">
        <Text className="text-sm font-semibold text-slate-400 ml-1">Mức độ ưu tiên</Text>
        <View className="flex-row gap-3">
          {priorities.map((item) => {
            const isActive = priority === item.value;
            return (
              <TouchableOpacity
                key={item.value}
                onPress={() => onPriorityChange(item.value)}
                className={`flex-1 h-[48px] rounded-2xl justify-center items-center border ${
                  isActive ? `${item.activeBg} border-transparent` : 'bg-slate-800 border-slate-700/50'
                }`}
              >
                <Text className={`font-bold text-sm ${isActive ? 'text-white' : 'text-slate-400'}`}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};
