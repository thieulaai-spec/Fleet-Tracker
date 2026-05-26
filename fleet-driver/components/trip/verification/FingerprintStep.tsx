import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Fingerprint } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface FingerprintStepProps {
  isScanning: boolean;
  fingerprintProgress: number;
  pulseAnim: Animated.Value;
  onPressIn: () => void;
  onPressOut: () => void;
}

export const FingerprintStep: React.FC<FingerprintStepProps> = ({
  isScanning,
  fingerprintProgress,
  pulseAnim,
  onPressIn,
  onPressOut,
}) => {
  return (
    <View className="items-center w-full">
      <Text className="text-slate-300 text-lg font-bold text-center mb-1">Xác Thực Vân Tay Của Bạn</Text>
      <Text className="text-slate-500 text-xs text-center mb-8 px-6">
        Nhấn giữ ngón tay vào khu vực cảm biến để xác nhận bạn đang thực hiện chặng giao hàng này.
      </Text>

      <TouchableOpacity
        activeOpacity={1}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        className="relative w-44 h-44 rounded-full bg-slate-900 border border-white/10 justify-center items-center shadow-2xl"
      >
        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }],
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: 999,
            borderWidth: 2,
            borderColor: isScanning ? '#6366f1' : 'transparent',
            opacity: 0.3,
          }}
        />
        
        {/* Ring Progress Overlay */}
        <View className="absolute inset-2 rounded-full border border-dashed border-indigo-500/20" />
        
        <LinearGradient
          colors={isScanning ? ['#6366f1', '#4f46e5'] : ['#1e293b', '#0f172a']}
          style={{ width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center' }}
        >
          <Fingerprint size={64} color="#fff" strokeWidth={1.5} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Progress Text */}
      <View className="mt-8 h-8 justify-center">
        {isScanning ? (
          <Text className="text-indigo-400 font-black text-sm tracking-wider uppercase">ĐANG XÁC THỰC... {fingerprintProgress}%</Text>
        ) : (
          <Text className="text-slate-500 font-bold text-sm tracking-wider uppercase">ẤN GIỮ ĐỂ BẮT ĐẦU</Text>
        )}
      </View>
    </View>
  );
};
