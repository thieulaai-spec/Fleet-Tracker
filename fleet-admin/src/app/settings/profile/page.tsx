'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Camera, 
  Shield, 
  Bell,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ChangePasswordModal } from '@/components/profile/ChangePasswordModal';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    avatarUrl: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        avatarUrl: user.avatarUrl || ''
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.patch('/users/profile', formData);
      updateUser(formData);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="max-w-[1000px] mx-auto py-xl px-lg animate-fade-in">
        <div className="flex flex-col gap-xl">
          {/* Header Section */}
          <div className="flex items-end justify-between gap-lg mb-md">
            <div className="flex items-center gap-xl">
              <div className="relative group">
                <div className="w-[120px] h-[120px] rounded-full overflow-hidden border-4 border-surface-high shadow-xl bg-surface-lowest flex items-center justify-center transition-all group-hover:border-primary-light">
                  {formData.avatarUrl ? (
                    <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={60} className="text-primary-light opacity-50" />
                  )}
                </div>
                <button className="absolute bottom-1 right-1 bg-primary text-white p-md rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95" title="Change Avatar">
                  <Camera size={18} />
                </button>
              </div>
              <div className="flex flex-col gap-xs pb-sm">
                <h1 className="text-display-sm font-bold text-text mb-0">{formData.fullName || 'Admin User'}</h1>
                <p className="text-text-dim font-body-md flex items-center gap-sm">
                  <Shield size={16} className="text-primary-light" />
                  <span>{user?.role?.toUpperCase()} Account</span>
                </p>
              </div>
            </div>
            <Button 
              onClick={handleSave} 
              isLoading={isSaving}
              className="px-xl py-lg rounded-default shadow-glow-primary"
            >
              Save Changes
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-xl">
            {/* Main Content - Personal Info */}
            <div className="md:col-span-2 flex flex-col gap-lg">
              <div className="glass border border-outline-variant p-xl rounded-xl shadow-sm">
                <h3 className="text-title-md font-semibold mb-xl flex items-center gap-md">
                  <UserIcon size={20} className="text-primary" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
                  <div className="flex flex-col gap-sm">
                    <label className="text-label-md font-medium text-text-muted">Full Name</label>
                    <div className="relative">
                      <UserIcon size={18} className="absolute left-md top-1/2 -translate-y-1/2 text-text-dim" />
                      <Input 
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="pl-[42px] bg-surface-high border-outline-variant focus:border-primary transition-all"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-sm">
                    <label className="text-label-md font-medium text-text-muted">Email Address</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-md top-1/2 -translate-y-1/2 text-text-dim" />
                      <Input 
                        name="email"
                        type="email"
                        value={formData.email}
                        readOnly
                        className="pl-[42px] bg-surface-lowest border-outline-variant text-text-dim cursor-not-allowed opacity-80"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-sm">
                    <label className="text-label-md font-medium text-text-muted">Phone Number</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-md top-1/2 -translate-y-1/2 text-text-dim" />
                      <Input 
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="pl-[42px] bg-surface-high border-outline-variant focus:border-primary transition-all"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-sm">
                    <label className="text-label-md font-medium text-text-muted">Avatar URL</label>
                    <div className="relative">
                      <Camera size={18} className="absolute left-md top-1/2 -translate-y-1/2 text-text-dim" />
                      <Input 
                        name="avatarUrl"
                        value={formData.avatarUrl}
                        onChange={handleChange}
                        className="pl-[42px] bg-surface-high border-outline-variant focus:border-primary transition-all"
                        placeholder="https://example.com/avatar.jpg"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass border border-outline-variant p-xl rounded-xl shadow-sm">
                <h3 className="text-title-md font-semibold mb-xl flex items-center gap-md text-danger">
                  <AlertCircle size={20} />
                  Security
                </h3>
                <div className="flex flex-col gap-lg">
                  <div className="flex items-center justify-between p-lg bg-surface-high border border-outline-variant rounded-default">
                    <div className="flex flex-col gap-xs">
                      <span className="font-semibold text-text">Two-Factor Authentication</span>
                      <span className="text-sm text-text-dim">Secure your account with an extra layer of security.</span>
                    </div>
                    <Button 
                      variant="secondary" 
                      className="text-primary border-primary hover:bg-primary-light/10"
                      onClick={() => toast.info('Two-Factor Authentication is coming soon!')}
                    >
                      Enable 2FA
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-lg bg-surface-high border border-outline-variant rounded-default">
                    <div className="flex flex-col gap-xs">
                      <span className="font-semibold text-text">Change Password</span>
                      <span className="text-sm text-text-dim">Update your password to keep your account safe.</span>
                    </div>
                    <Button variant="secondary" onClick={() => setIsPasswordModalOpen(true)}>Update</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Preferences */}
            <div className="flex flex-col gap-lg">
              <div className="glass border border-outline-variant p-xl rounded-xl shadow-sm">
                <h3 className="text-title-md font-semibold mb-xl flex items-center gap-md">
                  <Bell size={20} className="text-warning" />
                  Notifications
                </h3>
                <div className="flex flex-col gap-lg">
                  {[
                    { label: 'Email Alerts', desc: 'Get trip updates via email' },
                    { label: 'Push Notifications', desc: 'Real-time fleet alerts' },
                    { label: 'SMS Notifications', desc: 'Critical incidents only' }
                  ].map((pref, i) => (
                    <div key={i} className="flex items-start gap-md">
                      <div className="mt-xs">
                        <div className="w-10 h-5 bg-primary rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-xs">
                        <span className="text-sm font-semibold text-text">{pref.label}</span>
                        <span className="text-xs text-text-dim">{pref.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface-high border border-outline-variant p-xl rounded-xl shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent pointer-events-none" />
                <div className="flex flex-col gap-md relative z-1">
                  <div className="w-12 h-12 bg-primary/10 rounded-default flex items-center justify-center text-primary mb-md">
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 className="text-title-sm font-bold text-text">Account Status</h4>
                  <p className="text-sm text-text-dim leading-relaxed">
                    Your account is verified and active. You have full access to all fleet management tools.
                  </p>
                  <div className="mt-md pt-md border-t border-outline-variant flex items-center justify-between">
                    <span className="text-xs font-bold text-primary-light uppercase tracking-wider">Verified</span>
                    <span className="text-xs text-text-muted italic">Joined May 2024</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
    </>
  );
}
