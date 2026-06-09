import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowLeft, Edit3, Trash2 } from 'lucide-react-native';

interface DriverHeaderProps {
  onBack: () => void;
  isCreate: boolean;
  isEditing: boolean;
  onToggleEdit: () => void;
  onDelete: () => void;
}

export const DriverHeader: React.FC<DriverHeaderProps> = ({
  onBack,
  isCreate,
  isEditing,
  onToggleEdit,
  onDelete,
}) => {
  return (
    <View className="flex-row items-center px-4 py-3 gap-4">
      <TouchableOpacity
        onPress={onBack}
        className="w-10 h-10 rounded-full bg-white/5 justify-center items-center"
      >
        <ArrowLeft size={24} color="#fff" />
      </TouchableOpacity>
      <Text className="flex-1 text-xl font-extrabold text-white">
        {isCreate ? "New Driver" : "Driver Detail"}
      </Text>
      {!isCreate && (
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={onToggleEdit}
            className="w-10 h-10 rounded-full bg-white/5 justify-center items-center"
          >
            <Edit3 size={20} color={isEditing ? "#10b981" : "#6366f1"} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            className="w-10 h-10 rounded-full bg-white/5 justify-center items-center"
          >
            <Trash2 size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
