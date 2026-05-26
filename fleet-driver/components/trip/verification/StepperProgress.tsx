import React from 'react';
import { View } from 'react-native';

interface StepperProgressProps {
  currentStep: number;
  step: 'accept' | 'pickup' | 'checkpoint' | 'delivery';
}

export const StepperProgress: React.FC<StepperProgressProps> = ({ currentStep, step }) => {
  return (
    <View className="flex-row justify-center gap-2 mb-8">
      <View className={`h-1.5 rounded-full flex-1 ${currentStep >= 0 ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]' : 'bg-white/10'}`} />
      <View className={`h-1.5 rounded-full flex-1 ${currentStep >= 1 ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]' : 'bg-white/10'}`} />
      {step !== 'accept' && (
        <View className={`h-1.5 rounded-full flex-1 ${currentStep >= 2 ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]' : 'bg-white/10'}`} />
      )}
      <View className={`h-1.5 rounded-full flex-1 ${currentStep >= 3 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-white/10'}`} />
    </View>
  );
};
