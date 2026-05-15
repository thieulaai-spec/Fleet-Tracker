import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const DashboardHeader: React.FC = () => {
  return (
    <header className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-text">Dashboard Overview</h1>
        <p className="text-text-dim">Welcome back, here&apos;s what&apos;s happening with your fleet today.</p>
      </div>
      <Button 
        variant="primary" 
        icon={<TrendingUp size={18} />}
        href="/reports"
      >
        View Reports
      </Button>
    </header>
  );
};
