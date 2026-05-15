import React from 'react';
import { Truck, Users, ClipboardList, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Vehicle, Driver, Order } from '@/types';

interface DashboardStatsProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  orders: Order[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  vehicles,
  drivers,
  orders,
}) => {
  const currency = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });

  const todayRevenue = orders.reduce((sum, order) => {
    const isToday = new Date(order.createdAt).toDateString() === new Date().toDateString();
    return isToday && order.status === 'delivered' ? sum + 1250000 : sum;
  }, 0);

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

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-lg">
      {stats.map((stat, idx) => (
        <StatCard 
          key={idx} 
          {...stat} 
          href={stat.path}
        />
      ))}
    </section>
  );
};
