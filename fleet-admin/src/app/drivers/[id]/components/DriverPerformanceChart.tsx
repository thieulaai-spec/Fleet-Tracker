'use client';

import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { ReportChartWrapper } from '@/app/reports/components/ReportChartWrapper';

// Mock performance trend data
const performanceData = [
  { day: 'Mon', score: 85 },
  { day: 'Tue', score: 88 },
  { day: 'Wed', score: 92 },
  { day: 'Thu', score: 90 },
  { day: 'Fri', score: 94 },
  { day: 'Sat', score: 95 },
  { day: 'Sun', score: 96 },
];

export function DriverPerformanceChart() {
  return (
    <ReportChartWrapper 
      title="Performance Trend" 
      subtitle="KPI score over the last 7 days"
      height={380}
    >
      <div className="w-full h-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={performanceData}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis 
              dataKey="day" 
              stroke="var(--color-text-dim)" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="var(--color-text-dim)" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              domain={[60, 100]}
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ 
                background: 'var(--color-surface-high)', 
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }} 
            />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="var(--color-primary)" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorScore)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ReportChartWrapper>
  );
}
