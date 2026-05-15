'use client';

import React from 'react';
import { Navigation } from 'lucide-react';

interface TrackingHeaderProps {
  isConnected: boolean;
  totalVehicles: number;
  filter: string;
  onFilterChange: (filter: any) => void;
  stats: {
    total: number;
    active: number;
    idle: number;
    offline: number;
  };
}

export function TrackingHeader({
  isConnected,
  totalVehicles,
  filter,
  onFilterChange,
  stats
}: TrackingHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-3 text-text">
        <div className="p-2.5 bg-primary/10 rounded-xl">
          <Navigation size={24} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold m-0 tracking-tight">
            Giám sát hành trình
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isConnected ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-success animate-pulse" : "bg-danger"}`}
              />
              {isConnected ? "Live" : "Offline"}
            </div>
            <span className="text-text-dim text-xs">•</span>
            <span className="text-text-dim text-xs">
              {totalVehicles} phương tiện
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 bg-surface-low p-1 rounded-xl border border-border">
        {(["all", "active", "idle", "offline"] as const).map((f) => (
          <button
            key={f}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg cursor-pointer text-xs sm:text-sm font-medium transition-all ${filter === f ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-text-dim hover:text-text hover:bg-surface-high"}`}
            onClick={() => onFilterChange(f)}
          >
            <span className="truncate">
              {f === "all"
                ? "Tất cả"
                : f === "active"
                  ? "Đang chạy"
                  : f === "idle"
                    ? "Sẵn sàng"
                    : "Ngoại tuyến"}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${filter === f ? "bg-white/20" : "bg-surface-highest"}`}
            >
              {f === "all" ? stats.total : stats[f]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
