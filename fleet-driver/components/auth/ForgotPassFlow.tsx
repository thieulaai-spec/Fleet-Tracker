import React from 'react';
import { View, Text } from 'react-native';
import { Mail, ShieldCheck, Lock, ArrowLeft } from 'lucide-react-native';
import { AuthInput, AuthButton } from './AuthUI';
import { AuthStage } from '../../hooks/auth/useAuthFlow';

interface ForgotPassFlowProps {
  stage: AuthStage;
  resetEmail: string;
  setResetEmail: (v: string) => void;
  resetCode: string;
  setResetCode: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  isLoading: boolean;
  onSendCode: () => void;
  onVerifyCode: () => void;
  onResetPassword: () => void;
  onBack: () => void;
}

export const ForgotPassFlow = (props: ForgotPassFlowProps) => {
  return (
    <View className="gap-2">
      <View className="flex-row items-center mb-6">
        <AuthButton title="" variant="ghost" onPress={props.onBack} icon={<ArrowLeft color="#818cf8" size={24} />} />
        <Text className="text-white text-2xl font-bold ml-2">Reset Password</Text>
      </View>

      {props.stage === 'email' && (
        <>
          <Text className="text-slate-400 mb-6">Enter your email to receive a password reset code.</Text>
          <AuthInput
            label="Email Address"
            value={props.resetEmail}
            onChangeText={props.setResetEmail}
            placeholder="driver@fleet.com"
            keyboardType="email-address"
            icon={<Mail color="#818cf8" size={20} />}
          />
          <AuthButton title="Send Reset Code" onPress={props.onSendCode} isLoading={props.isLoading} />
        </>
      )}

      {props.stage === 'code' && (
        <>
          <Text className="text-slate-400 mb-6">Enter the 6-digit code sent to {props.resetEmail}.</Text>
          <AuthInput
            label="Reset Code"
            value={props.resetCode}
            onChangeText={props.setResetCode}
            placeholder="123456"
            keyboardType="numeric"
            icon={<ShieldCheck color="#818cf8" size={20} />}
          />
          <AuthButton title="Verify Code" onPress={props.onVerifyCode} isLoading={props.isLoading} />
        </>
      )}

      {props.stage === 'password' && (
        <>
          <Text className="text-slate-400 mb-6">Create a new secure password for your account.</Text>
          <AuthInput
            label="New Password"
            value={props.newPassword}
            onChangeText={props.setNewPassword}
            placeholder="••••••••"
            secureTextEntry
            icon={<Lock color="#818cf8" size={20} />}
          />
          <AuthInput
            label="Confirm Password"
            value={props.confirmPassword}
            onChangeText={props.setConfirmPassword}
            placeholder="••••••••"
            secureTextEntry
            icon={<Lock color="#818cf8" size={20} />}
          />
          <AuthButton title="Reset Password" onPress={props.onResetPassword} isLoading={props.isLoading} />
        </>
      )}
    </View>
  );
};
