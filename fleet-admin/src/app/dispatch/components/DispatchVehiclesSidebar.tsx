'use client';

import React, { useMemo } from 'react';
import { Zap } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Vehicle, Order, DispatchSuggestion } from '@/types';
import { VehicleDispatchCard } from './VehicleDispatchCard';

interface DispatchVehiclesSidebarProps {
  availableVehicles: Vehicle[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  isLoading: boolean;
  isAssigning: boolean;
  selectedOrder: string | null;
  selectedOrderData?: Order | null;
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicleId: string) => void;
  onAssignVehicle: (vehicleId: string) => void;
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
  const isSmartMode = !!selectedOrder && !!suggestions && suggestions.length > 0;

  const matchesSearch = (v: Vehicle) => {
    if (!searchQuery) return true;
    const searchStr = [v.id, v.plateNumber, v.type, v.driver?.fullName]
      .join(' ')
      .toLowerCase();
    return searchStr.includes(searchQuery.toLowerCase());
  };

  const combinedList = useMemo(() => {
    const result: { vehicle: Vehicle; suggestion?: DispatchSuggestion }[] = [];
    const seenIds = new Set<string>();

    if (suggestions) {
      suggestions.forEach(s => {
        if (matchesSearch(s.vehicle)) {
          result.push({ vehicle: s.vehicle, suggestion: s });
          seenIds.add(s.vehicle.id);
        }
      });
    }

    availableVehicles.forEach(v => {
      if (!seenIds.has(v.id) && matchesSearch(v)) {
        result.push({ vehicle: v });
        seenIds.add(v.id);
      }
    });

    return result;
  }, [availableVehicles, suggestions, searchQuery]);

  const checkCapacity = (v: Vehicle): boolean => {
    const freeKg = (v.maxCapacityKg || 0) - (v.currentLoadKg || 0);
    const needed = selectedOrderData?.weightKg || 0;
    return needed === 0 || freeKg >= needed;
  };

  const filteredSuggestions = combinedList.filter(item => !!item.suggestion);
  const filteredOthers = combinedList.filter(item => !item.suggestion);
  const totalVisibleCount = combinedList.length;

  return (
    <aside className="flex flex-col glass rounded-md overflow-hidden h-full">
      <div className="p-md border-b border-border flex-none flex flex-col gap-md">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-text">Available Fleet</h3>
          <Badge variant="success">{totalVisibleCount}</Badge>
        </div>
        
        <SearchInput
          placeholder="Search vehicles..."
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
        />
        
        {selectedOrder && (
          <div className="flex items-center gap-xs p-xs px-sm glass border border-primary/30 rounded-md text-xs text-primary-light shadow-sm">
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
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 p-md flex flex-col gap-md">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size={24} />
          </div>
        ) : (
          <>
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
                {filteredSuggestions.length > 0 && (
                  <>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mt-2 mb-1">Gợi ý thông minh</div>
                    {filteredSuggestions.map((item) => (
                      <VehicleDispatchCard 
                        key={item.vehicle.id}
                        vehicle={item.vehicle}
                        suggestion={item.suggestion}
                        selectedOrder={selectedOrder}
                        selectedOrderData={selectedOrderData}
                        isSelected={selectedVehicleId === item.vehicle.id}
                        isAssigning={isAssigning}
                        onSelect={onSelectVehicle}
                        onAssign={onAssignVehicle}
                      />
                    ))}
                  </>
                )}

                {filteredOthers.length > 0 && (
                  <>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mt-4 pt-2 border-t border-border mb-1">
                      {filteredSuggestions.length > 0 ? 'Xe khác' : 'Danh sách xe'}
                    </div>
                    {filteredOthers
                      .sort((a, b) => (checkCapacity(a.vehicle) ? 0 : 1) - (checkCapacity(b.vehicle) ? 0 : 1))
                      .map((item) => (
                        <VehicleDispatchCard 
                          key={item.vehicle.id}
                          vehicle={item.vehicle}
                          selectedOrder={selectedOrder}
                          selectedOrderData={selectedOrderData}
                          isSelected={selectedVehicleId === item.vehicle.id}
                          isAssigning={isAssigning}
                          onSelect={onSelectVehicle}
                          onAssign={onAssignVehicle}
                        />
                      ))}
                  </>
                )}
              </>
            ) : (
              combinedList
                .sort((a, b) => (checkCapacity(a.vehicle) ? 0 : 1) - (checkCapacity(b.vehicle) ? 0 : 1))
                .map((item) => (
                  <VehicleDispatchCard 
                    key={item.vehicle.id}
                    vehicle={item.vehicle}
                    selectedOrder={selectedOrder}
                    selectedOrderData={selectedOrderData}
                    isSelected={selectedVehicleId === item.vehicle.id}
                    isAssigning={isAssigning}
                    onSelect={onSelectVehicle}
                    onAssign={onAssignVehicle}
                  />
                ))
            )}
          </>
        )}
      </div>
    </aside>
  );
}
