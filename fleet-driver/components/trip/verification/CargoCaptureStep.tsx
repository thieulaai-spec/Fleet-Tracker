import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Camera, Plus, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CargoCaptureStepProps {
  cargoPhotos: string[];
  onCapture: () => void;
  onRemove: (index: number) => void;
  onNext: () => void;
  onSkip: () => void;
}

export const CargoCaptureStep: React.FC<CargoCaptureStepProps> = ({
  cargoPhotos,
  onCapture,
  onRemove,
  onNext,
  onSkip,
}) => {
  return (
    <View className="items-center w-full">
      <Text className="text-slate-300 text-lg font-bold text-center mb-1">Chụp Ảnh Hàng Hóa</Text>
      <Text className="text-slate-500 text-xs text-center mb-6 px-6">
        Vui lòng chụp ảnh hàng hóa thực tế làm minh chứng đối chứng (có thể chụp nhiều ảnh).
      </Text>

      {cargoPhotos.length === 0 ? (
        <TouchableOpacity
          onPress={onCapture}
          activeOpacity={0.8}
          className="w-48 h-48 rounded-[36px] bg-slate-900 border border-dashed border-white/20 justify-center items-center shadow-2xl overflow-hidden"
        >
          <LinearGradient
            colors={['#1e293b', '#0f172a']}
            style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
          >
            <Camera size={48} color="#94a3b8" strokeWidth={1.5} />
            <Text className="text-slate-400 font-black text-[11px] uppercase tracking-wider mt-3">Mở Camera</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <View className="w-full items-center">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingHorizontal: 20 }}
            className="flex-grow-0 mb-6 w-full"
          >
            {cargoPhotos.map((photo, index) => (
              <View key={index} className="relative w-32 h-32 rounded-2xl overflow-hidden border border-white/10 bg-slate-900">
                <Image source={{ uri: photo }} className="w-full h-full" resizeMode="cover" />
                <TouchableOpacity
                  onPress={() => onRemove(index)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/75 items-center justify-center border border-white/20"
                >
                  <Trash2 size={12} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add More Button */}
            <TouchableOpacity
              onPress={onCapture}
              activeOpacity={0.8}
              className="w-32 h-32 rounded-2xl bg-slate-900 border border-dashed border-white/20 justify-center items-center"
            >
              <Plus size={24} color="#94a3b8" />
              <Text className="text-slate-400 text-[10px] font-black uppercase mt-1">Chụp Thêm</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      <View className="flex-row gap-4 w-[80%] mt-4">
        {cargoPhotos.length === 0 ? (
          <>
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
          </>
        ) : (
          <>
            <TouchableOpacity
              onPress={onCapture}
              className="flex-1 bg-slate-800 py-4 rounded-2xl items-center border border-white/5"
            >
              <Text className="text-slate-300 font-bold uppercase text-[11px]">Chụp thêm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onNext}
              className="flex-1 bg-indigo-600 py-4 rounded-2xl items-center shadow-lg"
              style={{ flex: 2 }}
            >
              <Text className="text-white font-black uppercase text-[11px] tracking-wider">Tiếp Tục</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};
