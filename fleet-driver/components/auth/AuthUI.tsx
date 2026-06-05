import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';

// AuthBackground
export const AuthBackground = () => (
  <View className="absolute inset-0 bg-slate-950" style={StyleSheet.absoluteFill}>
    <LinearGradient
      colors={['#ffffff', '#f0fdf4', '#dcfce7']}
      style={StyleSheet.absoluteFill}
    />
    {/* Animated Shapes */}
    <MotiView
      from={{ opacity: 0.3, scale: 0.5, translateX: -100 }}
      animate={{ opacity: 0.5, scale: 1.2, translateX: 50 }}
      transition={{ type: 'timing', duration: 10000, loop: true }}
      className="absolute top-[-10%] left-[-20%] w-[300] h-[300] rounded-full bg-indigo-500/10"
    />
    <MotiView
      from={{ opacity: 0.2, scale: 0.8, translateY: 100 }}
      animate={{ opacity: 0.4, scale: 1.5, translateY: -50 }}
      transition={{ type: 'timing', duration: 15000, loop: true }}
      className="absolute bottom-[-10%] right-[-20%] w-[400] h-[400] rounded-full bg-indigo-500/5"
    />
  </View>
);

// AuthInput
interface AuthInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  icon?: React.ReactNode;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
}

export const AuthInput = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  secureTextEntry, 
  keyboardType, 
  icon,
  autoCapitalize,
  autoCorrect
}: AuthInputProps) => (
  <View className="mb-5">
    <Text className="text-slate-400 mb-2 ml-1 text-sm font-medium">{label}</Text>
    <View className="relative">
      <View className="absolute left-4 top-[15] z-10 opacity-60">
        {icon}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        className="bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-slate-100 text-base"
      />
    </View>
  </View>
);

// AuthButton
interface AuthButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: React.ReactNode;
}

export const AuthButton = ({ title, onPress, isLoading, variant = 'primary', icon }: AuthButtonProps) => {
  if (variant === 'ghost') {
    return (
      <TouchableOpacity onPress={onPress} className="py-2">
        <Text className="text-indigo-400 font-medium">{title}</Text>
      </TouchableOpacity>
    );
  }

  const bgColors = variant === 'primary' 
    ? (['#10b981', '#059669'] as const) 
    : (['#f1f5f9', '#e2e8f0'] as const);

  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={isLoading}
      className={`overflow-hidden rounded-2xl shadow-lg ${variant === 'primary' ? 'shadow-indigo-500/20' : 'border border-slate-700'}`}
    >
      <LinearGradient
        colors={bgColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
      >
        {isLoading ? (
          <ActivityIndicator color={variant === 'primary' ? '#fff' : '#0f172a'} size="small" />
        ) : (
          <>
            {icon && <View className="mr-2">{icon}</View>}
            <Text className={`${variant === 'primary' ? 'text-slate-950' : 'text-slate-100'} font-bold text-lg`}>{title}</Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};
