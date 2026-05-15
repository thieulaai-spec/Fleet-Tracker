import React from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthFlow } from "../hooks/auth/useAuthFlow";
import { AuthBackground } from "../components/auth/AuthUI";
import { LoginHeader } from "../components/auth/LoginHeader";
import { LoginForm } from "../components/auth/LoginForm";
import { ForgotPassFlow } from "../components/auth/ForgotPassFlow";

export default function LoginScreen() {
  const {
    email, setEmail,
    password, setPassword,
    isLoading,
    isForgotMode, toggleForgotMode,
    resetEmail, setResetEmail,
    resetCode, setResetCode,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    stage, setStage,
    handleLogin,
    handleForgotPassword,
    handleVerifyCode,
    handleResetPassword,
  } = useAuthFlow();

  return (
    <View className="flex-1 bg-slate-950">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <LinearGradient
        colors={["#020617", "#0f172a", "#020617"]}
        className="flex-1"
      >
        <AuthBackground />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 px-8 justify-center"
        >
          <LoginHeader 
            onBack={isForgotMode ? () => toggleForgotMode(false) : undefined}
            isForgotMode={isForgotMode}
          />

          {!isForgotMode ? (
            <LoginForm
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              isLoading={isLoading}
              onLogin={handleLogin}
              onForgotPassword={() => {
                toggleForgotMode(true);
                setStage("email");
              }}
            />
          ) : (
            <ForgotPassFlow
              stage={stage}
              resetEmail={resetEmail}
              setResetEmail={setResetEmail}
              resetCode={resetCode}
              setResetCode={setResetCode}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              isLoading={isLoading}
              onSendCode={handleForgotPassword}
              onVerifyCode={handleVerifyCode}
              onResetPassword={handleResetPassword}
              onBack={() => toggleForgotMode(false)}
            />
          )}
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}
