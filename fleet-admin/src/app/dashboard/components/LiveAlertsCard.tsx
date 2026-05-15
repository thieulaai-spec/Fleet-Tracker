import React from 'react';
import { AlertTriangle, Clock, Navigation, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { Alert } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

interface LiveAlertsCardProps {
  alerts: Alert[];
  onResolve: (id: string) => Promise<void>;
}

export const LiveAlertsCard: React.FC<LiveAlertsCardProps> = ({ alerts, onResolve }) => {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="bg-surface p-lg rounded-xl border border-border shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-text">Live Alerts</h3>
        <Badge variant="danger" className="animate-pulse">Live</Badge>
      </div>
      <div className="flex flex-col gap-md">
        {alerts.length === 0 ? (
          <div className="text-text-dim text-center py-8 bg-surface-low rounded-lg border border-dashed border-border">
            No active alerts
          </div>
        ) : (
          alerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`
                flex justify-between items-center p-lg bg-surface-low rounded-lg border-l-4 
                ${alert.type === 'speed_violation' ? 'border-l-danger' : 
                  alert.type === 'route_deviation' ? 'border-l-warning' : 
                  alert.type === 'abnormal_stop' ? 'border-l-[#f97316]' : 'border-l-danger'}
              `}
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className={`flex items-center gap-1.5 text-[10px] font-bold mb-1 uppercase tracking-wider
                  ${alert.type === 'speed_violation' ? 'text-danger' : 
                    alert.type === 'route_deviation' ? 'text-warning' : 
                    alert.type === 'abnormal_stop' ? 'text-[#f97316]' : 'text-danger'}
                `}>
                  <AlertTriangle size={14} />
                  <span>{alert.type.replace('_', ' ')}</span>
                </div>
                <p className="text-[13px] text-text mb-1 line-clamp-2">{alert.message}</p>
                <span className="flex items-center gap-1 text-[11px] text-text-dim">
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
                <button className="dropdown-item text-danger hover:bg-danger/10" onClick={() => onResolve(alert.id)}>
                  <CheckCircle size={16} /> Dismiss Alert
                </button>
              </Dropdown>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
