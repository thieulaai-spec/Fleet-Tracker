import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Truck, ArrowLeft } from 'lucide-react-native';
import { MotiView } from 'moti';

interface LoginHeaderProps {
  onBack?: () => void;
  isForgotMode?: boolean;
}

export const LoginHeader = ({ onBack, isForgotMode }: LoginHeaderProps) => (
  <View className="items-center mb-10 w-full">
    {onBack && (
      <TouchableOpacity 
        onPress={onBack}
        className="absolute left-0 top-0 p-2 z-10"
      >
        <ArrowLeft color="#10b981" size={28} />
      </TouchableOpacity>
    )}
    <MotiView
      from={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 15 }}
      className="w-20 h-20 bg-emerald-500 rounded-3xl items-center justify-center shadow-2xl shadow-emerald-500/50"
    >
      <Truck color="white" size={40} />
    </MotiView>
    <MotiView
      from={{ translateY: 20, opacity: 0 }}
      animate={{ translateY: 0, opacity: 1 }}
      transition={{ delay: 200 }}
      className="mt-6 items-center"
    >
      <Text className="text-white text-3xl font-black tracking-tighter">
        {isForgotMode ? 'RESET' : 'FLEET'}<Text className="text-emerald-500">{isForgotMode ? 'PASS' : 'DRIVER'}</Text>
      </Text>
      <View className="h-1 w-12 bg-emerald-500 rounded-full mt-1" />
    </MotiView>
  </View>
);
