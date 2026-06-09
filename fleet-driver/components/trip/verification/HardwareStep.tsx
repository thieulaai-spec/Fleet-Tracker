import React from 'react';
import { View, Text, Animated } from 'react-native';
import { CheckCircle2, Cpu } from 'lucide-react-native';

interface HardwareStepProps {
  hasHardwareVerified: boolean;
  pulseAnim: Animated.Value;
}

export const HardwareStep: React.FC<HardwareStepProps> = ({
  hasHardwareVerified,
  pulseAnim,
}) => {
  return (
    <View className="items-center justify-center py-8 px-4 w-full">
      {hasHardwareVerified ? (
        // Success View
        <View className="items-center w-full">
          <Animated.View className="bg-emerald-500/20 p-6 rounded-full border border-emerald-500/30 mb-6">
            <CheckCircle2 size={64} color="#10b981" />
          </Animated.View>
          <Text className="text-white text-xl font-bold text-center mb-2">
            Xác Thực Thành Công!
          </Text>
          <Text className="text-slate-400 text-sm text-center px-4">
            Thiết bị trên xe đã xác nhận vân tay & khuôn mặt. Chuyến đi của bạn đang được cập nhật...
          </Text>
        </View>
      ) : (
        // Waiting View
        <View className="items-center w-full">
          <View className="relative w-32 h-32 items-center justify-center mb-6">
            <Animated.View 
              className="absolute inset-0 bg-indigo-500/10 rounded-full border border-indigo-500/30"
              style={{
                transform: [{ scale: pulseAnim }],
              }}
            />
            <View className="bg-indigo-100 p-6 rounded-full border border-indigo-300">
              <Cpu size={48} color="#059669" />
            </View>
          </View>
          
          <Text className="text-white text-lg font-bold text-center mb-2">
            Đang đợi thiết bị trên xe xác thực...
          </Text>
          
          <Text className="text-slate-400 text-sm text-center mb-8 px-6 font-medium leading-relaxed">
            Vui lòng đặt vân tay lên đầu đọc AS608 và nhìn thẳng vào Camera trên xe để hoàn tất.
          </Text>

          <View className="w-full h-[1px] bg-white/5 my-4" />
        </View>
      )}
    </View>
  );
};
