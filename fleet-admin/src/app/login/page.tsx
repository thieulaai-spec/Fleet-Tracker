'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/Button';
import { Truck, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

import { toast } from 'sonner';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back, Admin');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(circle_at_top_right,#1e1b4b,#020617)] p-xl">
      <div className="w-full max-w-[420px] bg-surface/50 backdrop-blur-md border border-white/10 rounded-lg p-2xl shadow-2xl">
        <div className="text-center mb-2xl">
          <div className="w-16 h-16 bg-linear-to-br from-primary to-primary-hover rounded-xl flex items-center justify-center mx-auto mb-lg shadow-lg shadow-primary/30">
            <Truck size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Fleet Tracker</h1>
          <p className="text-text-dim text-sm">Admin Control Center</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-xl">
          {error && (
            <div className="flex items-center gap-sm p-md bg-danger/10 border border-danger/20 rounded-xl text-red-300 text-sm">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-sm">
            <label htmlFor="email" className="text-xs font-semibold text-text-dim uppercase tracking-wider">Email Address</label>
            <div className="relative flex items-center">
              <Mail size={18} className="absolute left-[14px] text-text-dim" />
              <input
                id="email"
                type="email"
                placeholder="admin@fleettracker.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-surface-low/60 border border-white/10 rounded-xl py-3 pl-[42px] pr-4 text-white text-[15px] outline-none transition-all focus:border-primary focus:bg-surface-low/80 focus:ring-4 focus:ring-primary/15"
              />
            </div>
          </div>

          <div className="flex flex-col gap-sm">
            <label htmlFor="password" className="text-xs font-semibold text-text-dim uppercase tracking-wider">Password</label>
            <div className="relative flex items-center">
              <Lock size={18} className="absolute left-[14px] text-text-dim" />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-surface-low/60 border border-white/10 rounded-xl py-3 pl-[42px] pr-4 text-white text-[15px] outline-none transition-all focus:border-primary focus:bg-surface-low/80 focus:ring-4 focus:ring-primary/15"
              />
            </div>
          </div>

          <Button 
            variant="primary" 
            type="submit" 
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="mt-2xl text-center">
          <p className="text-[11px] text-text-dim">&copy; 2024 Fleet Tracker Systems. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
