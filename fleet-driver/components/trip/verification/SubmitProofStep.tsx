import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SubmitProofStepProps {
  step: 'accept' | 'pickup' | 'checkpoint' | 'delivery';
  facePhoto: string;
  cargoPhotos: string[];
  isSubmitting: boolean;
  onSubmit: () => void;
}

export const SubmitProofStep: React.FC<SubmitProofStepProps> = ({
  step,
  facePhoto,
  cargoPhotos,
  isSubmitting,
  onSubmit,
}) => {
  return (
    <View className="items-center w-full">
      <Text className="text-slate-300 text-lg font-bold text-center mb-1">Tổng Hợp Minh Chứng</Text>
      <Text className="text-slate-500 text-xs text-center mb-6">
        Vui lòng kiểm tra lại thông tin trước khi tải lên hệ thống.
      </Text>

      <View className="w-full bg-slate-950/40 border border-white/5 rounded-[32px] p-5 mb-8 justify-center gap-6">
        {(step === 'pickup' || step === 'delivery') && facePhoto && (
          <View className="items-center w-full border-b border-white/5 pb-5">
            <Text className="text-slate-500 text-[10px] font-black uppercase mb-3 tracking-wider">Mặt Tài Xế (Face ID)</Text>
            <View className="w-24 h-24 rounded-2xl border border-indigo-500 overflow-hidden bg-slate-900">
              <Image source={{ uri: facePhoto }} className="w-full h-full" />
            </View>
          </View>
        )}

        {step !== 'accept' && (
          <View className="items-center w-full">
            <Text className="text-slate-500 text-[10px] font-black uppercase mb-3 tracking-wider">Ảnh Thực Tế Hàng Hóa ({cargoPhotos.length})</Text>
            {cargoPhotos.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingHorizontal: 10 }}
                className="w-full flex-grow-0"
              >
                {cargoPhotos.map((photo, idx) => (
                  <View key={idx} className="w-20 h-20 rounded-xl border border-indigo-500/50 overflow-hidden bg-slate-900">
                    <Image source={{ uri: photo }} className="w-full h-full" resizeMode="cover" />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View className="w-24 h-20 rounded-xl border border-dashed border-white/10 items-center justify-center bg-slate-900/40">
                <Text className="text-slate-600 font-bold text-[9px] uppercase">Chưa chụp</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <TouchableOpacity
        onPress={onSubmit}
        disabled={isSubmitting}
        activeOpacity={0.8}
        className="w-[80%]"
      >
        <LinearGradient
          colors={['#10b981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8 }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <ShieldCheck size={20} color="#fff" strokeWidth={2.5} />
              <Text className="text-white font-black uppercase text-xs tracking-wider">Gửi Minh Chứng</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};
