'use client';

import React from 'react';
import { format } from 'date-fns';
import { 
  AlertTriangle, 
  CheckCircle, 
  ChevronRight 
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/types';

interface DriverViolationsListProps {
  alerts: Alert[];
}

export function DriverViolationsList({ alerts }: DriverViolationsListProps) {
  return (
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
  );
}
