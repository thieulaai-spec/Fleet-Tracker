'use client';

import React, { memo } from 'react';
import { Truck, Activity, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { TrackingStats } from '../types';

interface TrackingStatsCardsProps {
  stats: TrackingStats;
}

export const TrackingStatsCards = memo(({ stats }: TrackingStatsCardsProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 shrink-0">
      {/* ... cards ... */}
      <div className="flex flex-col gap-1 p-4 bg-surface rounded-2xl border border-border relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <Truck size={48} className="text-info" />
        </div>
        <span className="text-text-dim text-xs font-medium uppercase tracking-wider">
          Tổng đội xe
        </span>
        <div className="text-3xl font-bold text-text tabular-nums">
          {stats.total}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-info mt-1">
          <CheckCircle size={10} /> 100% khả dụng
        </div>
      </div>
      <div className="flex flex-col gap-1 p-4 bg-surface rounded-2xl border border-border border-l-4 border-l-success relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <Activity size={48} className="text-success" />
        </div>
        <span className="text-text-dim text-xs font-medium uppercase tracking-wider">
          Đang vận hành
        </span>
        <div className="text-3xl font-bold tabular-nums text-success">
          {stats.active}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-success mt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />{" "}
          Real-time active
        </div>
      </div>
      <div className="flex flex-col gap-1 p-4 bg-surface rounded-2xl border border-border border-l-4 border-l-warning relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <Clock size={48} className="text-warning" />
        </div>
        <span className="text-text-dim text-xs font-medium uppercase tracking-wider">
          Đang chờ việc
        </span>
        <div className="text-3xl font-bold tabular-nums text-warning">
          {stats.idle}
        </div>
        <div className="text-[10px] text-text-dim mt-1">
          Sẵn sàng điều động
        </div>
      </div>
      <div className="flex flex-col gap-1 p-4 bg-surface rounded-2xl border border-border border-l-4 border-l-danger relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <AlertTriangle size={48} className="text-danger" />
        </div>
        <span className="text-text-dim text-xs font-medium uppercase tracking-wider">
          Cảnh báo hệ thống
        </span>
        <div className="text-3xl font-bold tabular-nums text-danger">
          {stats.alerts}
        </div>
        <div className="text-[10px] text-danger/80 mt-1">
          Yêu cầu xử lý ngay
        </div>
      </div>
    </div>
  );
});

TrackingStatsCards.displayName = 'TrackingStatsCards';

