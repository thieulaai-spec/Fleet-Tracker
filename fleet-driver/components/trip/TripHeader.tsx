import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

interface TripHeaderProps {
  onBack: () => void;
  isCompletedTrip: boolean;
}

export const TripHeader: React.FC<TripHeaderProps> = ({ onBack, isCompletedTrip }) => {
  return (
    <View className="flex-row items-center px-4 py-3 gap-4 border-b border-white/5 bg-slate-950">
      <TouchableOpacity
        onPress={onBack}
        className="w-10 h-10 rounded-full bg-white/5 justify-center items-center"
      >
        <ChevronLeft color="#fff" size={24} />
      </TouchableOpacity>
      <Text className="flex-1 text-base font-black text-white uppercase tracking-wider">
        {isCompletedTrip ? 'LỊCH SỬ CHUYẾN ĐI' : 'CHI TIẾT CHUYẾN ĐI'}
      </Text>
    </View>
  );
};
