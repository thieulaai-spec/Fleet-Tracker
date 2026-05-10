'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Truck, Clock, Zap } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { ExportActions } from '../components/ExportActions';
import { ReportChartWrapper } from '../components/ReportChartWrapper';
import { api } from '@/lib/api';

interface VehicleUtilizationStats {
  plateNumber: string;
  utilization: number;
  status: string;
}

interface UtilizationData {
  activeCount: number;
  idleCount: number;
  averageUtilization: number;
  vehicleStats: VehicleUtilizationStats[];
}

export default function UtilizationPage() {
  const [data, setData] = useState<UtilizationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 7);
    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    };
  });

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get<UtilizationData>('/reports/vehicle-utilization', {
        params: dateRange
      });
      setData(response);
    } catch (error) {
      console.error('Error fetching utilization report:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="utilization-reports">
      <div className="action-bar">
        <DateRangeFilter onRangeChange={setDateRange} />
        <ExportActions reportName="vehicle-utilization" params={dateRange} />
      </div>

      <div className="stats-grid">
        <StatCard 
          label="Active Vehicles" 
          value={data?.activeCount || 0} 
          icon={Truck} 
          color="var(--color-primary)"
        />
        <StatCard 
          label="Idle Vehicles" 
          value={data?.idleCount || 0} 
          icon={Clock} 
          color="var(--color-text-muted)"
        />
        <StatCard 
          label="Avg. Utilization" 
          value={`${data?.averageUtilization || 0}%`} 
          icon={Zap} 
          color="var(--color-success)"
        />
      </div>

      <div className="charts-grid">
        <ReportChartWrapper 
          title="Utilization by Vehicle" 
          subtitle="Percentage of time spent on trips"
          isLoading={isLoading}
          isEmpty={!data?.vehicleStats?.length}
          height={400}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.vehicleStats} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} stroke="var(--color-text-muted)" fontSize={12} />
              <YAxis dataKey="plateNumber" type="category" stroke="var(--color-text-muted)" fontSize={12} width={100} />
              <Tooltip 
                contentStyle={{ 
                  background: 'var(--color-surface)', 
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="utilization" fill="var(--color-primary)" radius={[0, 4, 4, 0]}>
                {(data?.vehicleStats || []).map((entry: VehicleUtilizationStats, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.utilization > 80 ? 'var(--color-success)' : entry.utilization > 40 ? 'var(--color-primary)' : 'var(--color-warning)'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ReportChartWrapper>
      </div>

      <style jsx>{`
        .utilization-reports {
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
        }

        .action-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: var(--space-lg);
        }

        .charts-grid {
          width: 100%;
        }
      `}</style>
    </div>
  );
}
