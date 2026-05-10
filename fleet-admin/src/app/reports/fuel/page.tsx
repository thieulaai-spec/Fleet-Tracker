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
  LineChart,
  Line
} from 'recharts';
import { Fuel, TrendingUp, DollarSign, Truck } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, Column } from '@/components/ui/DataTable';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { ExportActions } from '../components/ExportActions';
import { ReportChartWrapper } from '../components/ReportChartWrapper';
import { api } from '@/lib/api';
import { FuelCostReport } from '@/types/reports';

export default function FuelCostPage() {
  const [data, setData] = useState<FuelCostReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<FuelCostReport>('/reports/fuel-cost', {
        params: dateRange
      });
      setData(response);
    } catch (error) {
      console.error('Error fetching fuel cost report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const columns: Column<any>[] = [
    { header: 'Vehicle Plate', accessor: 'vehiclePlate' },
    { header: 'Type', accessor: 'type' },
    { 
      header: 'Total Cost', 
      accessor: (item) => `$${item.cost.toLocaleString()}` 
    },
    { 
      header: 'Distance', 
      accessor: (item) => `${item.distance.toLocaleString()} km` 
    },
    { 
      header: 'Efficiency', 
      accessor: (item) => `${item.efficiency.toFixed(2)} L/100km` 
    },
  ];

  return (
    <div className="fuel-reports">
      <div className="action-bar">
        <DateRangeFilter onRangeChange={setDateRange} />
        <ExportActions reportName="fuel_cost" params={dateRange} />
      </div>

      <div className="stats-grid">
        <StatCard 
          label="Total Fuel Cost" 
          value={`$${(data?.totalCost || 0).toLocaleString()}`} 
          icon={Fuel} 
          color="var(--color-warning)"
        />
        <StatCard 
          label="Avg. Cost per Trip" 
          value={`$${(data?.averageCostPerTrip || 0).toFixed(2)}`} 
          icon={DollarSign} 
          color="var(--color-primary)"
        />
        <StatCard 
          label="Cost Trend" 
          value="+5.2%" 
          icon={TrendingUp} 
          trend={{ value: 5.2, isUp: true }}
          color="var(--color-danger)"
        />
      </div>

      <div className="charts-grid">
        <div className="chart-item">
          <ReportChartWrapper 
            title="Fuel Cost by Vehicle Type" 
            isLoading={isLoading}
            isEmpty={!data?.costByVehicleType?.length}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.costByVehicleType}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="type" stroke="var(--color-text-muted)" fontSize={12} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--color-surface)', 
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="cost" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ReportChartWrapper>
        </div>

        <div className="chart-item">
          <ReportChartWrapper 
            title="Cost Trend" 
            isLoading={isLoading}
            isEmpty={!data?.costTrend?.length}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.costTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={12} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--color-surface)', 
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="cost" 
                  stroke="var(--color-warning)" 
                  strokeWidth={3} 
                  dot={{ fill: 'var(--color-warning)', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ReportChartWrapper>
        </div>
      </div>

      <div className="table-section">
        <header className="section-header">
          <h2>Vehicle Fuel Efficiency</h2>
          <p>Detailed cost and consumption per vehicle</p>
        </header>
        <DataTable 
          data={data?.vehicleFuelStats || []} 
          isLoading={isLoading}
          columns={columns}
        />
      </div>

      <style jsx>{`
        .fuel-reports {
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
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: var(--space-lg);
        }

        .table-section {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
        }

        .section-header h2 {
          font: var(--font-h3);
          color: var(--color-text);
        }

        .section-header p {
          font: var(--font-body-sm);
          color: var(--color-text-dim);
        }
      `}</style>
    </div>
  );
}
