'use client';

import React from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ReportChartWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  height?: number | string;
}

export function ReportChartWrapper({ 
  title, 
  subtitle, 
  children, 
  isLoading, 
  isEmpty, 
  height = 300 
}: ReportChartWrapperProps) {
  return (
    <div className="chart-wrapper">
      <div className="chart-header">
        <div className="header-info">
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      <div className="chart-content" style={{ height }}>
        {isLoading ? (
          <div className="status-container">
            <LoadingSpinner size={32} />
            <p>Loading chart data...</p>
          </div>
        ) : isEmpty ? (
          <div className="status-container">
            <p className="empty-text">No data available for the selected range</p>
          </div>
        ) : (
          children
        )}
      </div>

      <style jsx>{`
        .chart-wrapper {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .header-info h3 {
          font: var(--font-h3);
          color: var(--color-text);
        }

        .header-info p {
          font: var(--font-label-sm);
          color: var(--color-text-dim);
          margin-top: 4px;
        }

        .chart-content {
          position: relative;
          width: 100%;
        }

        .status-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-md);
        }

        .empty-text {
          color: var(--color-text-muted);
          font: var(--font-body-sm);
        }
      `}</style>
    </div>
  );
}
