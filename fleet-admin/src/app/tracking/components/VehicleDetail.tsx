'use client';

import React from 'react';
import { Truck, Activity, RefreshCw, Navigation, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { VehiclePosition } from '../types';

interface VehicleDetailProps {
  vehicle: VehiclePosition | null;
  onClose: () => void;
}

export function VehicleDetail({ vehicle, onClose }: VehicleDetailProps) {
  if (!vehicle) return null;

  return (
    <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-[320px] bg-surface/90 backdrop-blur-xl rounded-2xl border border-white/10 p-5 border-t-4 border-t-primary shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-5 duration-300 z-20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] font-bold text-text-dim m-0 uppercase tracking-[0.2em]">
          Chi tiết phương tiện
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-lg text-text-dim transition-colors"
        >
          <RefreshCw size={14} className="rotate-45" />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
              vehicle.status === "active"
                ? "bg-success/20 text-success"
                : vehicle.status === "idle"
                  ? "bg-warning/20 text-warning"
                  : "bg-text-dim/20 text-text-dim"
            }`}
          >
            <Truck size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-black text-text leading-tight tracking-tight truncate">
              {vehicle.licensePlate}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  vehicle.status === "active"
                    ? "bg-success animate-pulse"
                    : vehicle.status === "idle"
                      ? "bg-warning"
                      : "bg-text-dim"
                }`}
              />
              <span className="text-[10px] font-bold text-text-dim uppercase">
                {vehicle.status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          <DetailItem
            label="Tài xế"
            value={vehicle.driverName}
            icon={<Activity size={14} />}
          />
          <DetailItem
            label="Tốc độ"
            value={`${vehicle.speed.toFixed(0)} km/h`}
            icon={<Navigation size={14} />}
          />
          <DetailItem
            label="Cập nhật"
            value={formatDistanceToNow(
              new Date(vehicle.lastUpdate),
              { addSuffix: false },
            )}
            icon={<Clock size={14} />}
          />
        </div>

        <div className="flex gap-2 mt-1">
          <button className="flex-1 bg-primary text-white text-[11px] font-bold py-2.5 rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20">
            Liên hệ
          </button>
          <button className="px-3 bg-surface-high text-text text-[11px] font-bold py-2.5 rounded-xl border border-border hover:border-primary transition-all">
            Lịch sử
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-surface-low rounded-xl border border-white/5 transition-colors hover:bg-surface-high">
      <div className="flex items-center gap-2 text-text-dim">
        <span className="text-primary-light/50">{icon}</span>
        <span className="text-[11px] font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span
        className={`text-xs font-bold tabular-nums ${highlight ? "text-primary" : "text-text"}`}
      >
        {value}
      </span>
    </div>
  );
}
