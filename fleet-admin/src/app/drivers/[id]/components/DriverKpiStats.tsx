'use client';

import React from 'react';
import { 
  Navigation, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp 
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { DriverKpi } from '@/types';

interface DriverKpiStatsProps {
  kpi?: DriverKpi;
}

export function DriverKpiStats({ kpi }: DriverKpiStatsProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-xl">
      <StatCard 
        label="Total Trips" 
        value={kpi?.totalTrips || 0} 
        icon={Navigation} 
        color="var(--color-primary)" 
        trend={{ value: 8, isUp: true }}
      />
      <StatCard 
        label="Completion Rate" 
        value={`${kpi?.completionRate || 0}%`} 
        icon={CheckCircle} 
        color="var(--color-success)" 
        trend={{ value: 2.4, isUp: true }}
      />
      <StatCard 
        label="Safety Violations" 
        value={kpi?.totalViolations || 0} 
        icon={AlertTriangle} 
        color="var(--color-danger)" 
        trend={{ value: 12, isUp: false }}
      />
      <StatCard 
        label="Performance Score" 
        value={`${kpi?.kpiScore != null ? Number(kpi.kpiScore).toFixed(1) : 0}`} 
        icon={TrendingUp} 
        color="var(--color-warning)" 
        trend={{ value: 1.2, isUp: true }}
      />
    </section>
  );
}
