import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Check } from 'lucide-react-native';

interface FaceCaptureStepProps {
  facePhoto: string;
  onNext: () => void;
}

export const FaceCaptureStep: React.FC<FaceCaptureStepProps> = ({ facePhoto, onNext }) => {
  return (
    <View className="items-center w-full">
      <Text className="text-slate-300 text-lg font-bold text-center mb-1">ESP32-Cam Biometric Captured</Text>
      <Text className="text-slate-500 text-xs text-center mb-8">
        Ảnh sinh trắc chân dung khuôn mặt đã được camera giám sát chụp thành công làm minh chứng.
      </Text>

      <View className="relative w-48 h-48 rounded-full border-4 border-indigo-500 overflow-hidden shadow-2xl shadow-indigo-500/20">
        <Image source={{ uri: facePhoto }} className="w-full h-full" />
        <View className="absolute inset-0 bg-indigo-500/10" />
        <View className="absolute top-4 right-4 bg-emerald-500 w-8 h-8 rounded-full items-center justify-center border border-white">
          <Check size={18} color="#fff" strokeWidth={3} />
        </View>
      </View>

      <TouchableOpacity
        onPress={onNext}
        className="mt-8 bg-indigo-600 px-8 py-4 rounded-2xl w-[80%] items-center shadow-lg"
      >
        <Text className="text-white font-black uppercase text-xs tracking-wider">Tiếp Tục</Text>
      </TouchableOpacity>
    </View>
  );
};
