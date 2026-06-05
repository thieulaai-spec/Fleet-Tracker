import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Mail, Lock } from 'lucide-react-native';
import { AuthInput, AuthButton } from './AuthUI';

interface LoginFormProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  isLoading: boolean;
  onLogin: () => void;
  onForgotPassword: () => void;
}

export const LoginForm = (props: LoginFormProps) => {
  return (
    <View className="gap-2">
      <Text className="text-white text-3xl font-bold mb-2">Welcome Back</Text>
      <Text className="text-slate-400 mb-8">Sign in to manage your deliveries</Text>

      <AuthInput
        label="Email Address"
        value={props.email}
        onChangeText={props.setEmail}
        placeholder="driver@fleet.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        icon={<Mail color="#10b981" size={20} />}
      />

      <AuthInput
        label="Password"
        value={props.password}
        onChangeText={props.setPassword}
        placeholder="••••••••"
        secureTextEntry
        icon={<Lock color="#10b981" size={20} />}
      />

      <View className="items-end mb-8">
        <TouchableOpacity onPress={props.onForgotPassword}>
          <Text className="text-indigo-400 font-medium">Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      <AuthButton 
        title="Sign In" 
        onPress={props.onLogin} 
        isLoading={props.isLoading} 
      />
    </View>
  );
};
