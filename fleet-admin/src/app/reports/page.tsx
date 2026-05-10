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
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Truck, Navigation, Fuel, CheckCircle } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { DateRangeFilter } from './components/DateRangeFilter';
import { ExportActions } from './components/ExportActions';
import { ReportChartWrapper } from './components/ReportChartWrapper';
import { api } from '@/lib/api';
import { FleetPerformanceData } from '@/types/reports';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function FleetPerformancePage() {
  const [data, setData] = useState<FleetPerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<FleetPerformanceData>('/reports/fleet-performance', {
        params: dateRange
      });
      setData(response);
    } catch (error) {
      console.error('Error fetching fleet performance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  return (
    <div className="reports-overview">
      <div className="action-bar">
        <DateRangeFilter onRangeChange={setDateRange} />
        <ExportActions reportName="fleet_performance" params={dateRange} />
      </div>

      <div className="stats-grid">
        <StatCard 
          label="Total Trips" 
          value={data?.totalTrips || 0} 
          icon={Navigation} 
          color="var(--color-primary)"
        />
        <StatCard 
          label="Total Distance" 
          value={`${(data?.totalDistance || 0).toLocaleString()} km`} 
          icon={Truck} 
          color="var(--color-secondary)"
        />
        <StatCard 
          label="Fuel Cost" 
          value={`$${(data?.totalFuelCost || 0).toLocaleString()}`} 
          icon={Fuel} 
          color="var(--color-warning)"
        />
        <StatCard 
          label="Completion Rate" 
          value={`${data?.completionRate || 0}%`} 
          icon={CheckCircle} 
          color="var(--color-success)"
        />
      </div>

      <div className="charts-grid">
        <div className="chart-large">
          <ReportChartWrapper 
            title="Performance Trend" 
            subtitle="Trips vs Distance covered"
            isLoading={isLoading}
            isEmpty={!data?.performanceTrend?.length}
            height={400}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.performanceTrend}>
                <defs>
                  <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--color-surface)', 
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Area type="monotone" dataKey="trips" stroke="#6366f1" fillOpacity={1} fill="url(#colorTrips)" />
                <Area type="monotone" dataKey="distance" stroke="#10b981" fillOpacity={1} fill="url(#colorDist)" />
              </AreaChart>
            </ResponsiveContainer>
          </ReportChartWrapper>
        </div>

        <div className="chart-small">
          <ReportChartWrapper 
            title="Trip Status" 
            subtitle="Distribution by status"
            isLoading={isLoading}
            isEmpty={!data?.statusDistribution?.length}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="status"
                >
                  {(data?.statusDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </ReportChartWrapper>
        </div>

        <div className="chart-full">
          <ReportChartWrapper 
            title="Trips by Vehicle" 
            subtitle="Volume of trips per vehicle plate"
            isLoading={isLoading}
            isEmpty={!data?.tripsByVehicle?.length}
            height={300}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.tripsByVehicle}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="vehiclePlate" stroke="var(--color-text-muted)" fontSize={12} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--color-surface)', 
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ReportChartWrapper>
        </div>
      </div>

      <style jsx>{`
        .reports-overview {
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
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: var(--space-lg);
        }

        .chart-full {
          grid-column: span 2;
        }

        @media (max-width: 1024px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
          .chart-full {
            grid-column: span 1;
          }
        }
      `}</style>
    </div>
  );
}
