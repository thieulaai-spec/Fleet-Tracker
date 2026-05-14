'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  role: 'admin' | 'dispatcher' | 'driver' | 'ADMIN' | 'DISPATCHER' | 'DRIVER';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Just try to get profile - cookies will be sent automatically
        const userData = await api.get<User>('/auth/me');
        setUser(userData);
      } catch (error) {
        // Not logged in or session expired - quiet fail
        console.log('Not logged in or session expired');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post<{ user: User }>('/auth/login', {
        email,
        password,
      });
      
      setUser(response.user);
      router.push('/');
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout request failed', error);
    }
    setUser(null);
    router.push('/login');
  };

  const updateUser = (data: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
