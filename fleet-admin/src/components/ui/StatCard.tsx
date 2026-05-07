'use client';

'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color?: string;
}

export function StatCard({ label, value, icon: Icon, trend, color = 'var(--color-primary)' }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <div className="stat-icon-wrapper" style={{ color: color }}>
          <Icon size={24} />
        </div>
        {trend && (
          <div className={`stat-trend ${trend.isUp ? 'up' : 'down'}`}>
            {trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <h3 className="stat-value">{value}</h3>
      </div>

      <style jsx>{`
        .stat-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
          transition: transform var(--transition-fast), border-color var(--transition-fast);
        }

        .stat-card:hover {
          transform: translateY(-2px);
          border-color: var(--color-outline-variant);
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .stat-icon-wrapper {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: var(--radius-default);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-trend {
          font-size: 12px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .stat-trend.up {
          background: rgba(34, 197, 94, 0.1);
          color: var(--color-success);
        }

        .stat-trend.down {
          background: rgba(239, 68, 68, 0.1);
          color: var(--color-danger);
        }

        .stat-content {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font: var(--font-label-sm);
          color: var(--color-text-dim);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-value {
          font: var(--font-h2);
          color: var(--color-text);
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
}
