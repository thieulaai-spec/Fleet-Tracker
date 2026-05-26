import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Camera } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CargoCaptureStepProps {
  cargoPhoto: string;
  onCapture: () => void;
  onSkip: () => void;
}

export const CargoCaptureStep: React.FC<CargoCaptureStepProps> = ({
  cargoPhoto,
  onCapture,
  onSkip,
}) => {
  return (
    <View className="items-center w-full">
      <Text className="text-slate-300 text-lg font-bold text-center mb-1">Chụp Ảnh Hàng Hóa</Text>
      <Text className="text-slate-500 text-xs text-center mb-8 px-6">
        Vui lòng sử dụng camera điện thoại của bạn chụp ảnh hàng hóa tại chặng này làm đối chứng.
      </Text>

      <TouchableOpacity
        onPress={onCapture}
        activeOpacity={0.8}
        className="w-48 h-48 rounded-[36px] bg-slate-900 border border-dashed border-white/20 justify-center items-center shadow-2xl overflow-hidden"
      >
        {cargoPhoto ? (
          <Image source={{ uri: cargoPhoto }} className="w-full h-full" />
        ) : (
          <LinearGradient
            colors={['#1e293b', '#0f172a']}
            style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
          >
            <Camera size={48} color="#94a3b8" strokeWidth={1.5} />
            <Text className="text-slate-400 font-black text-[11px] uppercase tracking-wider mt-3">Mở Camera</Text>
          </LinearGradient>
        )}
      </TouchableOpacity>

      <View className="flex-row gap-4 w-[80%] mt-8">
        <TouchableOpacity
          onPress={onSkip}
          className="flex-1 bg-slate-800 py-4 rounded-2xl items-center border border-white/5"
        >
          <Text className="text-slate-400 font-bold uppercase text-[11px]">Bỏ Qua</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onCapture}
          className="flex-1 bg-indigo-600 py-4 rounded-2xl items-center shadow-lg"
          style={{ flex: 2 }}
        >
          <Text className="text-white font-black uppercase text-[11px] tracking-wider">Chụp Ảnh</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
