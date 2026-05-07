'use client';

import React from 'react';
import { 
  Bell, 
  Search, 
  User as UserIcon,
  ChevronDown,
  Globe,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="header glass">
      <div className="search-container">
        <Search size={18} className="search-icon" />
        <input 
          type="text" 
          placeholder="Search for vehicles, drivers or orders..." 
          className="search-input"
        />
      </div>

      <div className="header-actions">
        <button className="action-btn" aria-label="Language">
          <Globe size={20} />
          <span>EN</span>
        </button>
        
        <button className="action-btn notification-btn" aria-label="Notifications">
          <Bell size={20} />
          <span className="notification-badge">3</span>
        </button>

        <div className="user-profile-group">
          <div className="user-profile">
            <div className="avatar">
              <UserIcon size={20} />
            </div>
            <div className="user-info">
              <span className="user-name">{user?.fullName || 'Admin User'}</span>
              <span className="user-role">{user?.role || 'Fleet Manager'}</span>
            </div>
            <ChevronDown size={16} className="dropdown-icon" />
          </div>
          
          <button className="logout-btn" onClick={logout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <style jsx>{`
        .header {
          height: var(--header-height);
          padding: 0 var(--space-xl);
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 90;
          border-bottom: 1px solid var(--color-border);
        }

        .search-container {
          display: flex;
          align-items: center;
          background: var(--color-surface-low);
          border: 1px solid var(--color-outline-variant);
          border-radius: var(--radius-default);
          padding: 0 var(--space-md);
          width: 400px;
          transition: all var(--transition-fast);
        }

        .search-container:focus-within {
          border-color: var(--color-primary);
          background: var(--color-surface-high);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .search-icon {
          color: var(--color-text-dim);
        }

        .search-input {
          border: none;
          background: transparent;
          color: var(--color-text);
          padding: 10px;
          width: 100%;
          outline: none;
          font: var(--font-body-md);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: var(--space-lg);
        }

        .action-btn {
          background: transparent;
          border: none;
          color: var(--color-text-muted);
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          cursor: pointer;
          padding: 8px;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
          font: var(--font-label-sm);
        }

        .action-btn:hover {
          background: var(--color-surface-high);
          color: var(--color-text);
        }

        .notification-btn {
          position: relative;
        }

        .notification-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          background: var(--color-danger);
          color: white;
          font-size: 10px;
          font-weight: 700;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--color-surface);
        }

        .user-profile-group {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          background: var(--color-surface-low);
          padding: 4px;
          border-radius: var(--radius-default);
          border: 1px solid var(--color-border);
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background var(--transition-fast);
        }

        .user-profile:hover {
          background: var(--color-surface-high);
        }

        .logout-btn {
          background: transparent;
          border: none;
          color: var(--color-text-dim);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: var(--color-danger);
        }

        .avatar {
          width: 36px;
          height: 36px;
          background: var(--color-surface-highest);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-primary-light);
          border: 1px solid var(--color-border);
        }

        .user-info {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text);
        }

        .user-role {
          font-size: 12px;
          color: var(--color-text-dim);
        }

        .dropdown-icon {
          color: var(--color-text-dim);
        }
      `}</style>
    </header>
  );
}
