import { User as UserIcon, Star } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { DriverStats as DriverStatsType } from '../types';

interface DriverStatsProps {
  stats: DriverStatsType;
  isLoading: boolean;
}

export function DriverStats({ stats, isLoading }: DriverStatsProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-xl mb-2xl">
      <StatCard 
        label="Total Drivers" 
        value={isLoading ? '...' : stats.total.toLocaleString()} 
        icon={UserIcon}
        color="var(--color-primary)"
      />
      <StatCard 
        label="Active Now" 
        value={isLoading ? '...' : stats.active.toLocaleString()} 
        icon={UserIcon}
        color="var(--color-success)"
        trend={{ value: 12, isUp: true }}
      />
      <StatCard 
        label="Avg Performance" 
        value={stats.avgPerformance} 
        icon={Star}
        color="var(--color-warning)"
        trend={{ value: 2.1, isUp: true }}
      />
    </section>
  );
}
