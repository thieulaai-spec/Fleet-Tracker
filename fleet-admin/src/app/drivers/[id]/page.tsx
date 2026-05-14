'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  CreditCard,
  Navigation,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Clock,
  ExternalLink,
  ChevronRight,
  Truck
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

import { useDriver, useDriverKpi } from '@/hooks/use-drivers';
import { useAlerts } from '@/hooks/use-alerts';
import { useTrips } from '@/hooks/use-trips';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, Column } from '@/components/ui/DataTable';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ReportChartWrapper } from '@/app/reports/components/ReportChartWrapper';
import { Trip, Alert } from '@/types';
import { Modal } from '@/components/ui/Modal';

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

export default function DriverKpiDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const { data: driver, isLoading: driverLoading } = useDriver(id);
  const { data: kpi, isLoading: kpiLoading } = useDriverKpi(id);
  const { alerts, isLoading: alertsLoading } = useAlerts({ driverId: id });
  const { data: trips, isLoading: tripsLoading } = useTrips({ driverId: id });

  const [selectedTrip, setSelectedTrip] = React.useState<Trip | null>(null);

  const isLoading = driverLoading || kpiLoading || alertsLoading || tripsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-lg">
        <p className="text-xl font-semibold text-text-dim">Driver not found</p>
        <Button variant="primary" onClick={() => router.push('/drivers')}>
          Back to Drivers
        </Button>
      </div>
    );
  }

  const tripColumns: Column<Trip>[] = [
    {
      header: 'Trip ID',
      accessor: (trip) => (
        <span className="font-mono font-bold text-primary">
          #TR-{trip.id.substring(0, 6).toUpperCase()}
        </span>
      )
    },
    {
      header: 'Date',
      accessor: (trip) => format(new Date(trip.createdAt), 'MMM dd, yyyy')
    },
    {
      header: 'Status',
      accessor: (trip) => (
        <Badge variant={
          trip.status === 'completed' ? 'success' : 
          trip.status === 'in_progress' ? 'primary' : 
          trip.status === 'cancelled' ? 'danger' : 'warning'
        }>
          {trip.status.replace('_', ' ')}
        </Badge>
      )
    },
    {
      header: 'Distance',
      accessor: (trip) => `${trip.totalDistanceKm || 0} km`
    },
    {
      header: 'Actions',
      accessor: (trip) => (
        <Button 
          variant="ghost" 
          size="sm" 
          icon={<ExternalLink size={14} />}
          onClick={() => setSelectedTrip(trip)}
        >
          Details
        </Button>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-2xl pb-4xl animate-in fade-in duration-500">
      {/* Navigation & Header */}
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
                {driver.user?.avatarUrl ? (
                  <img src={driver.user?.avatarUrl} alt={driver.user?.fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-2xl font-bold text-primary">
                    {driver.user?.fullName?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-surface flex items-center justify-center
                ${driver.status === 'on_trip' ? 'bg-success' : driver.status === 'available' ? 'bg-primary' : 'bg-dim'}
              `} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-md">
                <h1 className="text-3xl font-bold tracking-tight">{driver.user?.fullName}</h1>
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
                  {driver.user?.phone}
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

      {/* KPI Stats */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2xl">
        {/* Performance Chart */}
        <div className="lg:col-span-2">
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
        </div>

        {/* Recent Violations */}
        <div className="lg:col-span-1">
          <div className="card h-full flex flex-col gap-xl p-xl transition-all duration-300 hover:shadow-glow hover:border-primary/30">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Recent Violations</h3>
              <Badge variant="danger">{alerts.length} New</Badge>
            </div>
            
            <div className="flex-1 flex flex-col gap-lg">
              {alerts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-xl bg-surface-low rounded-xl border border-dashed border-border">
                  <CheckCircle size={32} className="text-success mb-md opacity-50" />
                  <p className="text-sm text-text-dim">No recent violations found. Great job!</p>
                </div>
              ) : (
                alerts.slice(0, 5).map((alert: Alert) => (
                  <div key={alert.id} className="flex flex-col gap-md p-lg bg-surface-low rounded-xl border border-border group hover:shadow-glow hover:border-primary/50 transition-all duration-300 cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-md text-danger">
                        <AlertTriangle size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">{alert.type.replace('_', ' ')}</span>
                      </div>
                      <span className="text-[10px] text-text-dim font-medium">
                        {format(new Date(alert.createdAt), 'HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm font-medium line-clamp-2">{alert.message}</p>
                    <div className="flex justify-between items-center mt-sm pt-md border-t border-border">
                      <span className="text-xs text-primary font-bold">View Trip #TR-{alert.tripId?.substring(0, 4)}</span>
                      <ChevronRight size={14} className="text-dim group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <Button variant="ghost" className="w-full mt-auto">View All Incidents</Button>
          </div>
        </div>
      </div>

      {/* Trip History */}
      <section className="flex flex-col gap-xl">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h3 className="text-xl font-bold">Trip History</h3>
            <p className="text-sm text-text-dim">Complete log of all trips assigned to this driver.</p>
          </div>
          <div className="flex items-center gap-md">
            <Button variant="secondary" size="sm">Download Log</Button>
          </div>
        </div>
        
        <DataTable 
          data={trips || []} 
          columns={tripColumns} 
          isLoading={tripsLoading}
        />
      </section>

      {/* Trip Details Modal */}
      <Modal
        isOpen={Boolean(selectedTrip)}
        onClose={() => setSelectedTrip(null)}
        title="Trip Details"
      >
        {selectedTrip && (
          <div className="flex flex-col gap-xl">
            <div className="flex justify-between items-center">
              <Badge variant={
                selectedTrip.status === 'completed' ? 'success' : 
                selectedTrip.status === 'in_progress' ? 'primary' : 'warning'
              }>
                {selectedTrip.status.toUpperCase()}
              </Badge>
              <span className="font-mono text-xs text-text-dim">ID: {selectedTrip.id}</span>
            </div>

            <div className="grid grid-cols-2 gap-xl">
              <div className="space-y-1">
                <p className="text-xs text-text-dim uppercase font-bold tracking-wider">Vehicle</p>
                <p className="font-semibold flex items-center gap-md">
                  <Truck size={16} className="text-primary" />
                  {selectedTrip.vehicle?.plateNumber || 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-text-dim uppercase font-bold tracking-wider">Distance</p>
                <p className="font-semibold flex items-center gap-md">
                  <Navigation size={16} className="text-primary" />
                  {selectedTrip.totalDistanceKm || 0} km
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-text-dim uppercase font-bold tracking-wider">Timeline</p>
              <div className="p-md bg-surface-low rounded-xl border border-border space-y-md transition-all duration-300 hover:shadow-glow hover:border-primary/30">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-dim">Created At</span>
                  <span className="text-sm font-medium">{format(new Date(selectedTrip.createdAt), 'MMM dd, HH:mm')}</span>
                </div>
                {selectedTrip.startedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-dim">Started At</span>
                    <span className="text-sm font-medium">{format(new Date(selectedTrip.startedAt), 'MMM dd, HH:mm')}</span>
                  </div>
                )}
                {selectedTrip.completedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-dim">Completed At</span>
                    <span className="text-sm font-medium">{format(new Date(selectedTrip.completedAt), 'MMM dd, HH:mm')}</span>
                  </div>
                )}
              </div>
            </div>

            {selectedTrip.orders && selectedTrip.orders.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-text-dim uppercase font-bold tracking-wider">Orders ({selectedTrip.orders.length})</p>
                <div className="max-h-[200px] overflow-y-auto space-y-md pr-md">
                  {selectedTrip.orders.map((order, i) => (
                    <div key={order.id} className="p-md bg-surface-low rounded-xl border border-border flex justify-between items-start transition-all duration-300 hover:shadow-glow hover:border-primary/30">
                      <div className="space-y-1">
                        <p className="text-sm font-bold">Order #{order.id.substring(0, 8)}</p>
                        <p className="text-xs text-text-dim">{order.deliveryAddress}</p>
                      </div>
                      <Badge variant="neutral">{order.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
