'use client';

import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/change-password', {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword
      });
      toast.success('Password updated successfully');
      onClose();
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-2000 flex items-center justify-center p-md sm:p-lg">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-[480px] min-w-[320px] bg-surface border border-outline-variant rounded-2xl shadow-3xl overflow-hidden glass-strong animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between p-xl border-b border-outline-variant bg-surface-low/50">
          <div className="flex items-center gap-md">
            <div className="w-12 h-12 bg-primary/15 text-primary rounded-xl flex items-center justify-center shadow-inner">
              <Lock size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text mb-0.5">Security Settings</h3>
              <p className="text-xs text-text-dim">Update your account password</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-md text-text-dim hover:text-text hover:bg-surface-high rounded-full transition-all active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-xl flex flex-col gap-xl">
          <div className="space-y-lg">
            <div className="relative group">
              <Input
                label="Current Password"
                name="oldPassword"
                type={showOld ? "text" : "password"}
                value={formData.oldPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="pr-[52px]"
              />
              <button 
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-4 top-[38px] text-text-dim hover:text-primary transition-colors p-xs rounded-md"
              >
                {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative group">
              <Input
                label="New Password"
                name="newPassword"
                type={showNew ? "text" : "password"}
                value={formData.newPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
                helpText="Choose a strong password (min. 6 characters)"
                className="pr-[52px]"
              />
              <button 
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-4 top-[38px] text-text-dim hover:text-primary transition-colors p-xs rounded-md"
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative group">
              <Input
                label="Confirm New Password"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="pr-[52px]"
              />
              <button 
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-[38px] text-text-dim hover:text-primary transition-colors p-xs rounded-md"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-md pt-lg border-t border-outline-variant/30">
            <Button 
              variant="ghost" 
              fullWidth 
              onClick={onClose}
              className="order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              fullWidth 
              isLoading={isLoading}
              className="order-1 sm:order-2 shadow-glow-primary"
            >
              Save New Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
