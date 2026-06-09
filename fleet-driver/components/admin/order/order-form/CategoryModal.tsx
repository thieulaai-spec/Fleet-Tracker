import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';

export const categories = [
  { label: 'Dạng thô', value: 'bulk', desc: 'Cát, đá, vật liệu thô, hàng rời...' },
  { label: 'Dễ vỡ', value: 'fragile', desc: 'Thủy tinh, đồ gốm sứ, thiết bị điện tử...' },
  { label: 'Hàng cồng kềnh', value: 'bulky', desc: 'Bàn ghế, thiết bị kích thước lớn...' },
  { label: 'Hàng nguy hiểm', value: 'dangerous', desc: 'Hóa chất, chất dễ cháy nổ...' },
  { label: 'Khác', value: 'other', desc: 'Các mặt hàng khác...' },
];

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: string;
  onSelectCategory: (value: string) => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  selectedCategory,
  onSelectCategory,
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
          <View className="w-12 h-1.5 bg-slate-700 rounded-full self-center mb-5" />
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-slate-50">Phân loại hàng hoá</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-base text-indigo-500 font-bold">Đóng</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ gap: 12 }}>
            {categories.map((item) => {
              const isSelected = selectedCategory === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => {
                    onSelectCategory(item.value);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl border flex-row items-center justify-between ${
                    isSelected ? 'bg-indigo-500/10 border-indigo-500' : 'bg-slate-800 border-slate-700/50'
                  }`}
                >
                  <View className="flex-1 pr-4">
                    <Text className={`font-bold text-base ${isSelected ? 'text-indigo-400' : 'text-slate-50'}`}>
                      {item.label}
                    </Text>
                    <Text className="text-xs text-slate-400 mt-1">{item.desc}</Text>
                  </View>
                  {isSelected && (
                    <View className="w-6 h-6 rounded-full bg-indigo-500 justify-center items-center">
                      <Text className="text-white text-xs font-bold">✓</Text>
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
