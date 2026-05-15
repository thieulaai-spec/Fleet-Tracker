'use client';

import React from 'react';
import { Truck, Users, MapPin, CheckCircle2, AlertTriangle, Scale } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Vehicle, Order, DispatchSuggestion } from '@/types';

interface VehicleDispatchCardProps {
  vehicle: Vehicle;
  suggestion?: DispatchSuggestion;
  selectedOrder: string | null;
  selectedOrderData?: Order | null;
  isSelected: boolean;
  isAssigning: boolean;
  onSelect: (id: string) => void;
  onAssign: (id: string) => void;
}

export function VehicleDispatchCard({
  vehicle,
  suggestion,
  selectedOrder,
  selectedOrderData,
  isSelected,
  isAssigning,
  onSelect,
  onAssign,
}: VehicleDispatchCardProps) {
  // Kiểm tra xe có đủ tải trọng cho đơn hàng không
  const checkCapacity = (v: Vehicle): { ok: boolean; freeKg: number; needed: number } => {
    const freeKg = (v.maxCapacityKg || 0) - (v.currentLoadKg || 0);
    const needed = selectedOrderData?.weightKg || 0;
    return { ok: needed === 0 || freeKg >= needed, freeKg, needed };
  };

  // Kiểm tra bằng lái hết hạn
  const checkLicense = (v: Vehicle): boolean => {
    const expiry = v.driver?.licenseExpiry;
    if (!expiry) return true;
    return new Date(expiry) > new Date();
  };

  const capacity = checkCapacity(vehicle);
  const licenseOk = checkLicense(vehicle);
  const canAssign = selectedOrder && capacity.ok && licenseOk;

  return (
    <div
      className={`bg-surface-low border rounded-md p-md transition-all hover:border-primary-light hover:bg-surface-high cursor-pointer ${
        isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border'
      } ${!capacity.ok ? 'border-danger/40 bg-danger/5' : ''}`}
      onClick={() => onSelect(vehicle.id)}
    >
      {/* Header: Biển số + badge trạng thái */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1.5">
          <Truck size={16} className="text-text-muted" />
          <span className="font-bold text-primary-light">{vehicle.plateNumber}</span>
          <span className="text-[11px] text-text-muted capitalize bg-surface-high px-1.5 py-0.5 rounded-full">
            {vehicle.type}
          </span>
        </div>
        <Badge variant={capacity.ok ? 'success' : 'danger'}>{vehicle.status}</Badge>
      </div>

      {/* Tài xế */}
      <div className="flex items-center gap-1.5 text-xs text-text-dim mt-1.5">
        <Users size={13} className="text-text-muted shrink-0" />
        <span>{vehicle.driver?.fullName || 'Chưa gán tài xế'}</span>
        {!licenseOk && (
          <span className="flex items-center gap-1 text-[11px] text-danger font-semibold ml-auto">
            <AlertTriangle size={12} /> Bằng lái hết hạn
          </span>
        )}
      </div>

      {/* Tải trọng */}
      <div className={`flex items-center gap-1.5 text-xs mt-1.5 ${!capacity.ok ? 'text-danger' : 'text-text-dim'}`}>
        <Scale size={13} className="text-text-muted shrink-0" />
        <span>
          Tải trọng còn: <strong>{capacity.freeKg.toFixed(0)} kg</strong>
          {selectedOrderData && (
            <> / cần <strong>{capacity.needed} kg</strong></>
          )}
        </span>
        {!capacity.ok && (
          <span className="flex items-center gap-1 text-[11px] text-danger font-semibold ml-auto">
            <AlertTriangle size={12} /> Quá tải
          </span>
        )}
      </div>

      {/* Khoảng cách (Smart Mode) */}
      {suggestion && (
        <div className="flex items-center gap-1.5 text-xs text-success mt-1.5">
          <MapPin size={13} className="text-text-muted shrink-0" />
          <span>Cách điểm lấy: <strong>{suggestion.distanceKm.toFixed(1)} km</strong></span>
          {suggestion.kpiScore > 0 && (
            <span className="ml-auto text-[11px] font-bold text-primary-light bg-primary/10 px-2 py-0.5 rounded-full">
              KPI {suggestion.kpiScore.toFixed(0)}
            </span>
          )}
        </div>
      )}

      {/* Footer: nút Assign */}
      <div className="mt-2 border-t border-border pt-2">
        <Button
          variant="primary"
          size="sm"
          fullWidth
          disabled={!canAssign || isAssigning}
          isLoading={isAssigning}
          icon={<CheckCircle2 size={16} />}
          onClick={(e) => {
            e.stopPropagation();
            onAssign(vehicle.id);
          }}
        >
          {!selectedOrder ? 'Chọn đơn hàng trước' : !capacity.ok ? 'Quá tải trọng' : !licenseOk ? 'Bằng lái hết hạn' : 'Gán đơn hàng'}
        </Button>
      </div>
    </div>
  );
}
