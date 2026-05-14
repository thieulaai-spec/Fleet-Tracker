'use client';

import React from 'react';
import { Truck, Users, MapPin, CheckCircle2, Zap, AlertTriangle, Scale } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Vehicle, Order, DispatchSuggestion } from '@/types';

interface DispatchVehiclesSidebarProps {
  availableVehicles: Vehicle[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  isLoading: boolean;
  isAssigning: boolean;
  selectedOrder: string | null;
  selectedOrderData?: Order | null; // order object để kiểm tra weight
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicleId: string) => void;
  onAssignVehicle: (vehicleId: string) => void;
  // Suggestions từ API /dispatch/suggest (sorted by distance)
  suggestions?: DispatchSuggestion[];
  isSuggestLoading?: boolean;
}

export function DispatchVehiclesSidebar({
  availableVehicles,
  searchQuery,
  onSearchQueryChange,
  isLoading,
  isAssigning,
  selectedOrder,
  selectedOrderData,
  selectedVehicleId,
  onSelectVehicle,
  onAssignVehicle,
  suggestions,
  isSuggestLoading,
}: DispatchVehiclesSidebarProps) {
  // Khi đang chọn đơn hàng + có suggestions → hiển thị chế độ Smart Suggest
  const isSmartMode = !!selectedOrder && !!suggestions && suggestions.length > 0;

  // Kiểm tra xe có đủ tải trọng cho đơn hàng không (AC-DIS-01: Xe không đủ tải → không cho gán)
  const checkCapacity = (vehicle: Vehicle): { ok: boolean; freeKg: number; needed: number } => {
    const freeKg = (vehicle.maxCapacityKg || 0) - (vehicle.currentLoadKg || 0);
    const needed = selectedOrderData?.weightKg || 0;
    return { ok: needed === 0 || freeKg >= needed, freeKg, needed };
  };

  // Kiểm tra bằng lái hết hạn (AC-DIS-01)
  const checkLicense = (vehicle: Vehicle): boolean => {
    const expiry = vehicle.driver?.licenseExpiry;
    if (!expiry) return true; // Không có data → không block
    return new Date(expiry) > new Date();
  };

  const renderVehicleCard = (vehicle: Vehicle, suggestion?: DispatchSuggestion) => {
    const capacity = checkCapacity(vehicle);
    const licenseOk = checkLicense(vehicle);
    const isSelected = selectedVehicleId === vehicle.id;
    const canAssign = selectedOrder && capacity.ok && licenseOk;

    return (
      <div
        key={vehicle.id}
        className={`bg-surface-low border rounded-md p-md transition-all hover:border-primary-light hover:bg-surface-high cursor-pointer ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border'} ${!capacity.ok ? 'border-danger/40 bg-danger/5' : ''}`}
        onClick={() => onSelectVehicle(vehicle.id)}
      >
        {/* Header: Biển số + badge trạng thái */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1.5">
            <Truck size={16} className="text-text-muted" />
            <span className="font-bold text-primary-light">{vehicle.plateNumber}</span>
            <span className="text-[11px] text-text-muted capitalize bg-surface-high px-1.5 py-0.5 rounded-full">{vehicle.type}</span>
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

        {/* Tải trọng — cảnh báo nếu không đủ */}
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

        {/* Khoảng cách (chỉ hiện trong Smart Mode) */}
        {suggestion && (
          <div className="flex items-center gap-1.5 text-xs text-success mt-1.5">
            <MapPin size={13} className="text-text-muted shrink-0" />
            <span>Cách điểm lấy: <strong>{suggestion.distanceKm.toFixed(1)} km</strong></span>
            {suggestion.kpiScore > 0 && (
              <span className="ml-auto text-[11px] font-bold text-primary-light bg-primary/10 px-2 py-0.5 rounded-full">KPI {suggestion.kpiScore.toFixed(0)}</span>
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
              onAssignVehicle(vehicle.id);
            }}
          >
            {!selectedOrder ? 'Chọn đơn hàng trước' : !capacity.ok ? 'Quá tải trọng' : !licenseOk ? 'Bằng lái hết hạn' : 'Gán đơn hàng'}
          </Button>
        </div>
      </div>
    );
  };

  const matchesSearch = (v: Vehicle) => {
    if (!searchQuery) return true;
    const searchStr = [v.id, v.plateNumber, v.type, v.driver?.fullName]
      .join(' ')
      .toLowerCase();
    return searchStr.includes(searchQuery.toLowerCase());
  };

  // ===== Search & Grouping Logic (Unified) =====
  
  // 1. Unified list of all vehicles to display (Suggestions + Available)
  // Ensures consistency between badge count and rendered cards
  const combinedList = React.useMemo(() => {
    const result: { vehicle: Vehicle; suggestion?: DispatchSuggestion }[] = [];
    const seenIds = new Set<string>();

    // A. Add suggestions first (they match the search and have extra metadata)
    if (suggestions) {
      suggestions.forEach(s => {
        if (matchesSearch(s.vehicle)) {
          result.push({ vehicle: s.vehicle, suggestion: s });
          seenIds.add(s.vehicle.id);
        }
      });
    }

    // B. Add other available vehicles that are not already in suggestions
    availableVehicles.forEach(v => {
      if (!seenIds.has(v.id) && matchesSearch(v)) {
        result.push({ vehicle: v });
        seenIds.add(v.id);
      }
    });

    return result;
  }, [availableVehicles, suggestions, searchQuery]);

  // Derived lists for sections
  const filteredSuggestions = combinedList.filter(item => !!item.suggestion);
  const filteredOthers = combinedList.filter(item => !item.suggestion);

  const totalVisibleCount = combinedList.length;

  return (
    <aside className="flex flex-col glass rounded-md overflow-hidden h-full">
      <div className="p-md border-b border-border shrink-0 flex justify-between items-center">
        <h3 className="font-bold text-text">Available Fleet</h3>
        <Badge variant="success">{totalVisibleCount}</Badge>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 p-md flex flex-col gap-md">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size={24} />
          </div>
        ) : (
          <>
            <div className="sticky top-0 bg-surface pb-md -mt-md pt-md z-10">
              <SearchInput
                placeholder="Search vehicles..."
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
              />
            </div>

            {/* === Smart Suggest Mode: hiện khi đã chọn đơn hàng === */}
            {selectedOrder && (
              <div className="sticky top-[54px] z-9 flex items-center gap-xs p-xs px-sm glass border border-primary/30 rounded-md text-xs text-primary-light mb-sm shadow-sm">
                <Zap size={14} className="text-primary" />
                <span>
                  {isSuggestLoading
                    ? 'Đang tìm xe phù hợp...'
                    : isSmartMode
                    ? `Top ${filteredSuggestions.length} xe phù hợp nhất (gần nhất + đủ tải)`
                    : 'Sắp xếp theo khoảng cách & tải trọng'}
                </span>
                {isSuggestLoading && <LoadingSpinner size={14} />}
              </div>
            )}

            {totalVisibleCount === 0 ? (
              <div className="text-center py-8 text-text-dim">
                {searchQuery ? (
                  <>No vehicles matching "<strong>{searchQuery}</strong>"</>
                ) : (
                  'No available vehicles'
                )}
              </div>
            ) : isSmartMode ? (
              <>
                {/* Section: Gợi ý thông minh (Top suggestions) */}
                {filteredSuggestions.length > 0 && (
                  <>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mt-2 mb-1">Gợi ý thông minh</div>
                    {filteredSuggestions.map((item) => renderVehicleCard(item.vehicle, item.suggestion))}
                  </>
                )}

                {/* Section: Xe khác (Remaining available fleet) */}
                {filteredOthers.length > 0 && (
                  <>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mt-4 pt-2 border-t border-border mb-1">
                      {filteredSuggestions.length > 0 ? 'Xe khác' : 'Danh sách xe'}
                    </div>
                    {filteredOthers
                      .sort((a, b) => {
                        const capA = checkCapacity(a.vehicle).ok ? 0 : 1;
                        const capB = checkCapacity(b.vehicle).ok ? 0 : 1;
                        return capA - capB;
                      })
                      .map((item) => renderVehicleCard(item.vehicle))}
                  </>
                )}
              </>
            ) : (
              // Normal mode: Show all matching available vehicles sorted by capacity
              combinedList
                .sort((a, b) => {
                  const capA = checkCapacity(a.vehicle).ok ? 0 : 1;
                  const capB = checkCapacity(b.vehicle).ok ? 0 : 1;
                  return capA - capB;
                })
                .map((item) => renderVehicleCard(item.vehicle))
            )}
          </>
        )}
      </div>
    </aside>
  );
}
