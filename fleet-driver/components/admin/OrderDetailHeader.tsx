import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowLeft, Edit3, Trash2, XCircle } from 'lucide-react-native';

interface OrderDetailHeaderProps {
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCancel?: () => void;
  canCancel: boolean;
}

export const OrderDetailHeader: React.FC<OrderDetailHeaderProps> = ({
  onBack,
  onEdit,
  onDelete,
  onCancel,
  canCancel,
}) => {
  return (
    <View className="flex-row items-center px-4 py-3 gap-4 border-b border-white/5 bg-slate-950">
      <TouchableOpacity 
        onPress={onBack} 
        className="w-10 h-10 rounded-full bg-white/5 justify-center items-center"
      >
        <ArrowLeft size={24} color="#fff" />
      </TouchableOpacity>
      <Text className="flex-1 text-xl font-extrabold text-white">Order Detail</Text>
      <View className="flex-row gap-2">
        {canCancel && onCancel && (
          <TouchableOpacity 
            onPress={onCancel} 
            className="w-10 h-10 rounded-full bg-white/5 justify-center items-center"
          >
            <XCircle size={20} color="#94a3b8" />
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          onPress={onEdit} 
          className="w-10 h-10 rounded-full bg-white/5 justify-center items-center"
        >
          <Edit3 size={20} color="#6366f1" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={onDelete} 
          className="w-10 h-10 rounded-full bg-white/5 justify-center items-center"
        >
          <Trash2 size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
