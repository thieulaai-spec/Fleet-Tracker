import { Platform } from 'react-native';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
  phone?: string;
  driver?: {
    id: string;
    status: string;
    licenseClass?: string;
    licenseExpiry?: string;
    fingerprintId?: string | null;
  } | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string, refreshToken: string) => void;
  updateUser: (user: Partial<User>) => void;
  updateTokens: (token: string, refreshToken: string) => void;
  logout: () => void;
}

// Custom storage handler that uses SecureStore for native and AsyncStorage for web
const persistentStorage = {
  getItem: async (name: string) => {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(name);
    }
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string) => {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(name, value);
    } else {
      await SecureStore.setItemAsync(name, value);
    }
  },
  removeItem: async (name: string) => {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(name);
    } else {
      await SecureStore.deleteItemAsync(name);
    }
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, token, refreshToken) =>
        set({ user, token, refreshToken, isAuthenticated: true }),
      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        })),
      updateTokens: (token, refreshToken) => set({ token, refreshToken }),
      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => persistentStorage),
    }
  )
);
