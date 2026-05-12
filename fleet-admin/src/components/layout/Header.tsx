'use client';

import React from 'react';
import { 
  Bell, 
  Search, 
  User as UserIcon,
  ChevronDown,
  Globe,
  LogOut,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Dropdown } from '@/components/ui/Dropdown';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-header px-xl flex items-center justify-between sticky top-0 z-90 border-b border-border glass">
      <div className="flex items-center bg-surface-low border border-outline-variant rounded-default px-md w-[400px] transition-all focus-within:border-primary focus-within:bg-surface-high focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]">
        <Search size={18} className="text-text-dim" />
        <input 
          type="text" 
          placeholder="Search for vehicles, drivers or orders..." 
          className="border-none bg-transparent text-text p-md w-[400px] outline-none font-body-md"
        />
      </div>

      <div className="flex items-center gap-lg">
        <Dropdown 
          align="right"
          trigger={
            <button className="bg-transparent border-none text-text-muted flex items-center gap-xs cursor-pointer p-md rounded-sm transition-all hover:bg-surface-high hover:text-text font-label-sm" aria-label="Language">
              <Globe size={20} />
              <span>EN</span>
            </button>
          }
        >
          <button className="dropdown-item" onClick={() => console.log('Set language: EN')}>English (US)</button>
          <button className="dropdown-item" onClick={() => console.log('Set language: VN')}>Tiếng Việt</button>
        </Dropdown>
        
        <button className="bg-transparent border-none text-text-muted flex items-center gap-xs cursor-pointer p-md rounded-sm transition-all hover:bg-surface-high hover:text-text relative" aria-label="Notifications" onClick={() => console.log('Open Notifications')}>
          <Bell size={20} />
          <span className="absolute top-xs right-xs bg-danger text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-surface">3</span>
        </button>

        <div className="flex items-center gap-sm bg-surface-low p-xs rounded-default border border-border">
          <Dropdown
            align="right"
            trigger={
              <div className="flex items-center gap-md p-[4px_8px] rounded-sm cursor-pointer transition-colors hover:bg-surface-high">
                <div className="w-[36px] h-[36px] bg-surface-highest rounded-full flex items-center justify-center border border-border">
                  <UserIcon size={20} className="text-primary-light" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-semibold text-text leading-tight">{user?.fullName || 'Admin User'}</span>
                  <span className="text-[12px] text-text-dim leading-tight">{user?.role || 'Fleet Manager'}</span>
                </div>
                <ChevronDown size={16} className="text-text-dim" />
              </div>
            }
          >
            <button className="dropdown-item" onClick={() => console.log('Go to profile')}>
              <UserIcon size={18} /> Profile Settings
            </button>
            <button className="dropdown-item" onClick={() => console.log('Go to system config')}>
              <Settings size={18} /> System Config
            </button>
            <div className="dropdown-divider" />
            <button className="dropdown-item danger" onClick={logout}>
              <LogOut size={18} /> Logout
            </button>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
