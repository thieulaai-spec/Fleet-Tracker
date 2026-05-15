'use client';

import React from 'react';
import { Truck, Activity, MapPin, Eye } from 'lucide-react';
import { VehiclePosition } from '../types';

interface VehicleListProps {
  vehicles: VehiclePosition[];
  selectedVehicleId?: string;
  onSelect: (vehicle: VehiclePosition | null) => void;
}

export function VehicleList({
  vehicles,
  selectedVehicleId,
  onSelect
}: VehicleListProps) {
  return (
    <div className="bg-surface rounded-2xl border border-border flex flex-col min-h-0 shadow-md flex-1">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-text m-0">
          <Truck size={18} className="text-primary" />
          Đội xe trực tuyến
        </h3>
        <span className="text-[11px] font-bold text-text-dim px-2 py-0.5 bg-surface-low rounded-full">
          {vehicles.length} phương tiện
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 custom-scrollbar">
        {vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
            <div className="w-12 h-12 bg-surface-low rounded-full flex items-center justify-center mb-3 text-text-dim">
              <Truck size={24} />
            </div>
            <div className="text-sm font-medium text-text">
              Không tìm thấy xe
            </div>
            <div className="text-xs text-text-dim mt-1">
              Thay đổi bộ lọc để xem thêm
            </div>
          </div>
        ) : (
          vehicles.map((vehicle) => {
            const isSelected = selectedVehicleId === vehicle.vehicleId;
            return (
              <div
                key={vehicle.vehicleId}
                className={`group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 cursor-pointer ${
                  isSelected
                    ? "bg-primary/10 border-primary/40 shadow-[0_20px_40px_rgba(59,130,246,0.15)] translate-x-1 ring-1 ring-primary/20"
                    : "bg-surface-low/30 border-white/5 hover:bg-surface-high/60 hover:border-border/50 hover:-translate-y-1 shadow-sm"
                }`}
                onClick={() => onSelect(isSelected ? null : vehicle)}
              >
                {/* Status accent strip */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-500 ${
                    vehicle.status === "active"
                      ? "bg-success shadow-[2px_0_10px_rgba(34,197,94,0.5)]"
                      : vehicle.status === "idle"
                        ? "bg-warning"
                        : "bg-text-dim/30"
                  } ${isSelected ? "w-1.5" : "group-hover:w-1.5"}`}
                />

                <div className="relative shrink-0">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center relative z-10 transition-all duration-700 group-hover:rotate-3 group-hover:scale-105 shadow-2xl ${
                      vehicle.status === "active"
                        ? "bg-linear-to-br from-success to-success-dark text-white"
                        : vehicle.status === "idle"
                          ? "bg-warning/20 text-warning border border-warning/20"
                          : "bg-surface-highest/50 text-text-dim border border-white/5"
                    }`}
                  >
                    <Truck size={28} strokeWidth={2.5} />
                  </div>

                  {/* Live pulse for active */}
                  {vehicle.status === "active" && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-background rounded-full p-0.5 z-20">
                      <div className="w-full h-full bg-success rounded-full flex items-center justify-center">
                        <Activity
                          size={10}
                          className="text-white animate-pulse"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 py-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="text-[17px] font-black text-text truncate tracking-tight group-hover:text-primary-light transition-colors">
                      {vehicle.licensePlate}
                    </div>
                    {vehicle.speed > 0 ? (
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-success bg-success/10 px-2.5 py-1 rounded-full border border-success/20">
                        <div className="w-1 h-1 bg-success rounded-full animate-ping" />
                        {vehicle.speed.toFixed(0)} KM/H
                      </div>
                    ) : (
                      <div className="text-[10px] font-bold text-text-dim bg-surface-highest/40 px-2 py-0.5 rounded-md border border-white/5 uppercase tracking-tighter">
                        Static
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] font-bold text-text-dim/80 truncate uppercase tracking-widest flex items-center gap-2">
                    <span>{vehicle.driverName}</span>
                    <span className="w-1 h-1 bg-white/10 rounded-full" />
                    <span
                      className={`capitalize ${
                        vehicle.status === "active"
                          ? "text-success"
                          : vehicle.status === "idle"
                            ? "text-warning"
                            : "text-text-dim"
                      }`}
                    >
                      {vehicle.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-text-dim/60 font-medium">
                      <MapPin size={12} className="text-primary/50" />
                      <span className="truncate">HCMC Zone 1</span>
                    </div>
                    {vehicle.ordersCount !== undefined && (
                      <div className="text-[10px] text-primary-light font-black flex items-center gap-1">
                        <div className="w-1 h-1 bg-primary-light rounded-full" />
                        {vehicle.ordersCount} ORDERS
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className={`transition-all duration-500 ease-out ${
                    isSelected
                      ? "opacity-100 translate-x-0 scale-100"
                      : "opacity-0 translate-x-4 scale-75 group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100"
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-primary text-white shadow-xl shadow-primary/40 flex items-center justify-center">
                    <Eye size={18} strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
