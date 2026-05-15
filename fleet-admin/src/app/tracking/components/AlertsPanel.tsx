'use client';

import React from 'react';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Alert } from '../types';

interface AlertsPanelProps {
  alerts: Alert[];
  onResolve: (id: string) => void;
}

export function AlertsPanel({ alerts, onResolve }: AlertsPanelProps) {
  const activeAlerts = alerts.filter((a) => !a.resolved);

  if (activeAlerts.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-4 border-l-4 border-l-danger shadow-xl animate-in slide-in-from-right duration-300">
      <h3 className="flex items-center justify-between text-sm font-bold text-text mb-4 mt-0">
        <span className="flex items-center gap-2">
          <AlertTriangle
            size={18}
            className="text-danger animate-pulse"
          />
          SỰ CỐ KHẨN CẤP
        </span>
        <span className="bg-danger text-white text-[10px] px-2 py-0.5 rounded-full">
          NEW
        </span>
      </h3>
      <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
        {activeAlerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-start gap-3 p-3 bg-surface-highest/40 backdrop-blur-md rounded-xl border border-white/5 group"
          >
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-text text-xs leading-relaxed font-medium">
                {alert.message}
              </span>
              <span className="text-text-dim text-[10px] flex items-center gap-1">
                <Clock size={10} />
                {formatDistanceToNow(new Date(alert.timestamp), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <button
              className="bg-success/20 text-success hover:bg-success hover:text-white transition-all p-1.5 rounded-lg opacity-0 group-hover:opacity-100"
              onClick={() => onResolve(alert.id)}
            >
              <CheckCircle size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
