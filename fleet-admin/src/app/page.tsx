'use client';

import React from 'react';
import { 
  Truck, 
  Users, 
  ClipboardList, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  ArrowRight,
  Loader2,
  MoreVertical,
  Navigation,
  CheckCircle,
  MapPin
} from 'lucide-react';
import { Vehicle } from '@/types';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { useVehicles } from '@/hooks/use-vehicles';
import { useDrivers } from '@/hooks/use-drivers';
import { useOrders } from '@/hooks/use-orders';
import { useAlerts } from '@/hooks/use-alerts';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const { vehicles, isLoading: vehiclesLoading } = useVehicles();
  const { drivers, isLoading: driversLoading } = useDrivers();
  const { orders, isLoading: ordersLoading } = useOrders();
  const { alerts, isLoading: alertsLoading, resolveAlert } = useAlerts();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currency = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });

  const todayRevenue = orders.reduce((sum, order) => {
    const isToday = new Date(order.createdAt).toDateString() === new Date().toDateString();
    return isToday && order.status === 'delivered' ? sum + 1250000 : sum;
  }, 0);

  // Real statistics based on fetched data
  const stats = [
    { 
      label: 'Total Vehicles', 
      value: vehicles.length, 
      icon: Truck, 
      trend: { value: 12, isUp: true }, 
      color: '#6366f1',
      path: '/vehicles'
    },
    { 
      label: 'Active Drivers', 
      value: drivers.filter(d => d.status === 'available').length, 
      icon: Users, 
      trend: { value: 5, isUp: true }, 
      color: '#0ea5e9',
      path: '/drivers'
    },
    { 
      label: 'Pending Orders', 
      value: orders.filter(o => o.status === 'pending').length, 
      icon: ClipboardList, 
      trend: { value: 2, isUp: false }, 
      color: '#f59e0b',
      path: '/orders'
    },
    { 
      label: 'Today Revenue', 
      value: currency.format(todayRevenue), 
      icon: TrendingUp, 
      trend: { value: 8, isUp: true }, 
      color: '#10b981',
      path: '/reports'
    },
  ];

  const recentOrders = orders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const isLoading = vehiclesLoading || driversLoading || ordersLoading || alertsLoading;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" size={32} /></div>;
  }

  return (
    <div className="dashboard-container">
      <header className="page-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p className="text-dim">Welcome back, here&apos;s what&apos;s happening with your fleet today.</p>
        </div>
        <Button 
          variant="primary" 
          icon={<TrendingUp size={18} />}
          href="/reports"
        >
          View Reports
        </Button>
      </header>

      <section className="stats-grid">
        {stats.map((stat, idx) => (
          <StatCard 
            key={idx} 
            {...stat} 
            href={stat.path}
          />
        ))}
      </section>

      <div className="dashboard-grid">
        <section className="card recent-activity">
          <div className="card-header">
            <h3>Recent Orders</h3>
            <Button 
              variant="ghost" 
              size="sm"
              href="/orders"
            >
              View All <ArrowRight size={14} />
            </Button>
          </div>
          <div className="activity-list">
            {recentOrders.map((order) => (
              <div 
                key={order.id} 
                className="activity-item clickable"
                onClick={() => router.push(`/dispatch?orderId=${order.id}`)}
              >
                <div className="activity-icon">
                  <ClipboardList size={18} />
                </div>
                <div className="activity-info">
                  <div className="activity-title">
                    <span className="order-id">ORD-{order.id.substring(0, 4)}</span>
                    <span className="text-dim">to</span>
                    <span className="customer-name">{order.deliveryAddress}</span>
                  </div>
                  <span className="activity-time">
                    {mounted ? `${formatDistanceToNow(new Date(order.createdAt))} ago` : '...'}
                  </span>
                </div>
                <Badge variant={order.status === 'delivering' ? 'primary' : order.status === 'assigned' ? 'success' : 'warning'}>
                  {order.status}
                </Badge>
              </div>
            ))}
          </div>
        </section>

        <section className="card alerts-feed">
          <div className="card-header">
            <h3>Live Alerts</h3>
            <Badge variant="danger">Live</Badge>
          </div>
          <div className="alerts-list">
            {alerts.length === 0 ? (
              <div className="text-dim text-center py-8">No active alerts</div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className={`alert-item alert-${alert.type}`}>
                  <div className="alert-content">
                    <div className="alert-header">
                      <AlertTriangle size={16} />
                      <span className="alert-type">{alert.type.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    <p className="alert-message">{alert.message}</p>
                    <span className="alert-time">
                      <Clock size={12} /> 
                      {mounted ? `${formatDistanceToNow(new Date(alert.createdAt))} ago` : '...'}
                    </span>
                  </div>
                  <Dropdown align="right" trigger={
                    <Button variant="secondary" size="sm">
                      Action
                    </Button>
                  }>
                    <button className="dropdown-item" onClick={() => router.push(`/dispatch?vehicleId=${alert.vehicleId}`)}>
                      <Navigation size={16} /> Track Location
                    </button>
                    <button className="dropdown-item" onClick={() => router.push(`/vehicles?search=${alert.vehicle?.plateNumber}`)}>
                      <AlertTriangle size={16} /> View Vehicle
                    </button>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item" onClick={() => resolveAlert(alert.id)}>
                      <CheckCircle size={16} /> Dismiss Alert
                    </button>
                  </Dropdown>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <style jsx>{`
        .dashboard-container {
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
        }

        .clickable {
          cursor: pointer;
          transition: transform var(--transition-fast), background var(--transition-fast);
        }

        .clickable:hover {
          background: var(--color-surface-high);
          transform: translateY(-2px);
          border-color: var(--color-primary-light);
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: var(--space-lg);
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: var(--space-lg);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-lg);
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-md);
          background: var(--color-surface-low);
          border-radius: var(--radius-default);
          border: 1px solid var(--color-border);
        }

        .activity-icon {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-primary-light);
        }

        .activity-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .activity-title {
          display: flex;
          gap: 6px;
          font-weight: 500;
        }

        .order-id { color: var(--color-primary-light); }
        .customer-name { color: var(--color-text); }
        .activity-time { font-size: 12px; color: var(--color-text-dim); }

        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .alert-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-md);
          background: var(--color-surface-low);
          border-radius: var(--radius-default);
          border-left: 4px solid var(--color-primary);
        }

        .alert-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .alert-speed_violation { border-left-color: var(--color-danger); }
        .alert-speed_violation .alert-type { color: var(--color-danger); }
        
        .alert-route_deviation { border-left-color: var(--color-warning); }
        .alert-route_deviation .alert-type { color: var(--color-warning); }
        
        .alert-abnormal_stop { border-left-color: #f97316; }
        .alert-abnormal_stop .alert-type { color: #f97316; }

        .alert-incident { border-left-color: #ef4444; }
        .alert-incident .alert-type { color: #ef4444; }

        .alert-message {
          font-size: 13px;
          color: var(--color-text);
          margin-bottom: 4px;
        }

        .alert-time {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--color-text-dim);
        }
      `}</style>
    </div>
  );
}
