'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Alert } from '@/types';
import { AlertTriangle, Bell, X, ChevronUp, ChevronDown, MapPin, Gauge, ShieldAlert, Clock, Info } from 'lucide-react';

interface AlertsPanelProps {
  alerts: Alert[];
  onAlertClick?: (lat: number, lng: number) => void;
}

export function AlertsPanel({ alerts, onAlertClick }: AlertsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const lastAlertIdRef = useRef<string | null>(null);

  const visibleAlerts = alerts.filter(a => !dismissedIds.has(a.id));

  // Sound notification logic
  useEffect(() => {
    if (alerts.length > 0 && alerts[0].id !== lastAlertIdRef.current) {
      lastAlertIdRef.current = alerts[0].id;
      // Play sound (mocked for now, but would use new Audio('/alert.mp3').play())
      console.log('🔔 New Alert:', alerts[0].message);
    }
  }, [alerts]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'overspeed': return <Gauge className="w-4 h-4" />;
      case 'route_deviation': return <ShieldAlert className="w-4 h-4" />;
      case 'idle_timeout': return <Clock className="w-4 h-4" />;
      case 'incident': return <AlertTriangle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const dismissAlert = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds(prev => new Set([...prev, id]));
  };

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="absolute bottom-6 right-6 z-20 w-80">
      <div className={`bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 flex flex-col ${isExpanded ? 'h-96' : 'h-14'}`}>
        {/* Header */}
        <div 
          className="h-14 px-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors shrink-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="w-5 h-5 text-blue-400" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white animate-pulse">
                {visibleAlerts.length}
              </div>
            </div>
            <span className="text-sm font-bold text-white">System Alerts</span>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
          </div>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800 bg-slate-950/50">
          {visibleAlerts.map((alert) => (
            <div 
              key={alert.id} 
              className="group relative p-4 hover:bg-slate-800/30 transition-colors cursor-pointer"
              onClick={() => alert.location && onAlertClick?.(alert.location.lat, alert.location.lng)}
            >
              <div className="flex gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${
                  alert.severity === 'critical' ? 'bg-rose-500/20 text-rose-500' :
                  alert.severity === 'high' ? 'bg-orange-500/20 text-orange-500' :
                  'bg-amber-500/20 text-amber-500'
                }`}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className="min-w-0 pr-6">
                  <div className="text-xs font-bold text-slate-200 mb-1 leading-relaxed">{alert.message}</div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="uppercase font-bold tracking-wider">{alert.type.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>{new Date(alert.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => dismissAlert(alert.id, e)}
                  className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {alert.location && (
                  <div className="p-1 text-blue-400">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
