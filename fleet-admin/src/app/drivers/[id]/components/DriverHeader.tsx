'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Star, 
  Phone, 
  Calendar, 
  CreditCard 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Driver, DriverKpi } from '@/types';

interface DriverHeaderProps {
  driver: Driver;
  kpi?: DriverKpi;
}

export function DriverHeader({ driver, kpi }: DriverHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-xl">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-md text-sm font-semibold text-text-dim hover:text-text transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Fleet Drivers
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-xl">
        <div className="flex items-center gap-xl">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-surface-high border border-border flex items-center justify-center overflow-hidden shadow-glow/10">
              {driver.avatarUrl ? (
                <img src={driver.avatarUrl} alt={driver.fullName || 'Driver'} className="w-full h-full object-cover" />
              ) : (
                <div className="text-2xl font-bold text-primary">
                  {driver.fullName?.charAt(0) || 'D'}
                </div>
              )}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-surface flex items-center justify-center
              ${driver.status === 'on_trip' ? 'bg-success' : driver.status === 'available' ? 'bg-primary' : 'bg-dim'}
            `} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-md">
              <h1 className="text-3xl font-bold tracking-tight">{driver.fullName || 'Unnamed Driver'}</h1>
              <Badge variant={driver.status === 'on_trip' ? 'success' : driver.status === 'available' ? 'primary' : 'neutral'}>
                {driver.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-xl gap-y-md text-sm text-text-dim font-medium">
              <span className="flex items-center gap-md">
                <CreditCard size={14} />
                ID: {driver.id.substring(0, 8)}
              </span>
              <span className="flex items-center gap-md">
                <Star size={14} className="text-warning fill-warning" />
                {kpi?.kpiScore != null ? Number(kpi.kpiScore).toFixed(1) : 'N/A'} Performance Rating
              </span>
              <span className="flex items-center gap-md">
                <Phone size={14} />
                {driver.phone}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-md">
          <Button variant="secondary" icon={<Calendar size={18} />}>Schedule</Button>
          <Button variant="primary">Message Driver</Button>
        </div>
      </div>
    </div>
  );
}
