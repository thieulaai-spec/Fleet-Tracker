import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/useAuthStore";
import Toast from "react-native-toast-message";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001/api";

export type AuthStage = "email" | "code" | "password";

export function useAuthFlow() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [stage, setStage] = useState<AuthStage>("email");
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || data?.error?.message || "Login failed");
      }

      const payload = data?.data ?? data;
      const accessToken = payload?.accessToken ?? payload?.access_token;
      const refreshToken = payload?.refreshToken ?? payload?.refresh_token;
      const { user } = payload;

      if (!accessToken || !refreshToken || !user) {
        throw new Error("Invalid server response");
      }

      if ((user.role || "").toLowerCase() !== "driver") {
        throw new Error("Access denied: Drivers only");
      }

      setAuth(
        {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        accessToken,
        refreshToken,
      );

      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Server connection error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      Toast.show({ type: "error", text1: "Error", text2: "Please enter your email" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();
      const result = data?.data ?? data;

      if (!response.ok) throw new Error(result?.message || "Could not send reset code");

      Toast.show({
        type: "success",
        text1: "Code Sent",
        text2: `Reset code: ${result.resetCode} (Demo)`,
      });

      setStage("code");
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to send reset code",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Toast.show({ type: "error", text1: "Error", text2: "Please fill all fields" });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({ type: "error", text1: "Error", text2: "Passwords do not match" });
      return;
    }

    if (newPassword.length < 6) {
      Toast.show({ type: "error", text1: "Error", text2: "Password must be at least 6 characters" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, resetCode, newPassword }),
      });

      const data = await response.json();
      const result = data?.data ?? data;

      if (!response.ok) throw new Error(result?.message || "Could not reset password");

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Password changed successfully",
      });

      setIsForgotMode(false);
      setStage("email");
      setResetEmail("");
      setResetCode("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to reset password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (resetCode.length < 4) {
      Toast.show({ type: "error", text1: "Error", text2: "Please enter valid code" });
      return;
    }
    setStage("password");
  };

  const toggleForgotMode = (val: boolean) => {
    setIsForgotMode(val);
    if (!val) setStage("email");
  };

  return {
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
  };
}
