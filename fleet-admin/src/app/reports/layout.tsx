'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Trophy, 
  Fuel, 
  MapPin,
  Calendar
} from 'lucide-react';

const reportTabs = [
  { name: 'Overview', href: '/reports', icon: BarChart3 },
  { name: 'KPI Leaderboard', href: '/reports/kpi', icon: Trophy },
  { name: 'Fuel Analysis', href: '/reports/fuel', icon: Fuel },
  { name: 'Utilization', href: '/reports/utilization', icon: MapPin },
  { name: 'Trip Summary', href: '/reports/trips', icon: Calendar },
];

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="reports-container">
      <header className="reports-header">
        <div className="header-title">
          <h1>Reports & Analytics</h1>
          <p>Monitor fleet performance and driver KPIs</p>
        </div>
        
        <nav className="reports-nav">
          {reportTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;
            
            return (
              <Link 
                key={tab.name} 
                href={tab.href}
                className={`report-tab ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{tab.name}</span>
                {isActive && <div className="tab-indicator" />}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="reports-content">
        {children}
      </div>

      <style jsx>{`
        .reports-container {
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
        }

        .reports-header {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .header-title h1 {
          font: var(--font-h1);
          color: var(--color-text);
        }

        .header-title p {
          font: var(--font-body-md);
          color: var(--color-text-dim);
        }

        .reports-nav {
          display: flex;
          gap: var(--space-md);
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 1px;
        }

        .report-tab {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: 12px var(--space-md);
          color: var(--color-text-dim);
          text-decoration: none;
          font-weight: 500;
          position: relative;
          transition: all var(--transition-fast);
        }

        .report-tab:hover {
          color: var(--color-text);
        }

        .report-tab.active {
          color: var(--color-primary-light);
        }

        .tab-indicator {
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--color-primary);
          border-radius: 2px 2px 0 0;
        }

        .reports-content {
          min-height: 400px;
        }
      `}</style>
    </div>
  );
}
