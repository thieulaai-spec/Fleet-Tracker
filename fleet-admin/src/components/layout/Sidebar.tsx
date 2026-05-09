'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  ClipboardList, 
  Map as MapIcon, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Vehicles', href: '/vehicles', icon: Truck },
  { name: 'Drivers', href: '/drivers', icon: Users },
  { name: 'Orders', href: '/orders', icon: ClipboardList },
  { name: 'Dispatch Center', href: '/dispatch', icon: MapIcon },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = React.useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">FT</div>
          {!collapsed && <span className="logo-text">Fleet<span>Tracker</span></span>}
        </div>
        <button 
          className="collapse-btn" 
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.name : undefined}
            >
              <Icon size={20} />
              {!collapsed && <span>{item.name}</span>}
              {isActive && <div className="active-indicator" />}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <Link href="/settings" className="nav-item">
          <Settings size={20} />
          {!collapsed && <span>Settings</span>}
        </Link>
        <button className="nav-item logout-btn" onClick={logout}>
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      <style jsx>{`
        .sidebar {
          width: var(--sidebar-width);
          height: 100vh;
          background: var(--color-surface);
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          transition: width var(--transition-normal);
          position: fixed;
          left: 0;
          top: 0;
          z-index: 100;
        }

        .sidebar.collapsed {
          width: 80px;
        }

        .sidebar-header {
          height: var(--header-height);
          padding: 0 var(--space-lg);
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--color-border);
        }

        .collapsed .sidebar-header {
          padding: 0 var(--space-md);
          justify-content: center;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .logo-icon {
          width: 32px;
          height: 32px;
          background: var(--color-primary);
          color: white;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }

        .logo-text {
          font-weight: 700;
          font-size: 18px;
          color: var(--color-text);
        }

        .logo-text span {
          color: var(--color-primary-light);
        }

        .collapse-btn {
          background: var(--color-surface-high);
          border: 1px solid var(--color-border);
          color: var(--color-text-muted);
          width: 24px;
          height: 24px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .collapse-btn:hover {
          color: var(--color-primary-light);
          border-color: var(--color-primary);
        }

        .collapsed .collapse-btn {
          position: absolute;
          right: -12px;
          top: 72px;
          background: var(--color-primary);
          color: white;
          border-radius: 50%;
          border: none;
          box-shadow: var(--shadow-sm);
        }

        .sidebar-nav {
          flex: 1;
          padding: var(--space-lg) var(--space-sm);
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: 12px var(--space-md);
          color: var(--color-text-muted);
          text-decoration: none;
          border-radius: var(--radius-default);
          transition: all var(--transition-fast);
          position: relative;
          background: transparent;
          border: none;
          width: 100%;
          cursor: pointer;
          font: var(--font-body-md);
          font-weight: 500;
        }

        .collapsed .nav-item {
          justify-content: center;
          padding: 12px;
        }

        .nav-item:hover {
          background: var(--color-surface-high);
          color: var(--color-text);
        }

        .nav-item.active {
          background: rgba(99, 102, 241, 0.1);
          color: var(--color-primary-light);
        }

        .active-indicator {
          position: absolute;
          left: 0;
          top: 20%;
          bottom: 20%;
          width: 3px;
          background: var(--color-primary);
          border-radius: 0 4px 4px 0;
        }

        .sidebar-footer {
          padding: var(--space-lg) var(--space-sm);
          border-top: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .logout-btn {
          color: var(--color-danger);
          opacity: 0.8;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: var(--color-danger);
          opacity: 1;
        }
      `}</style>
    </aside>
  );
}
