'use client';

import React from 'react';
import { MapPin, ChevronRight, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Order } from '@/types';

export interface DispatchOrderGroup {
  key: string;
  label: string;
  orders: Order[];
  /** True khi nhóm này do API /dispatch/cluster tạo ra (PostGIS ST_DWithin 3km) */
  isClusterGroup?: boolean;
  /** Tọa độ trung tâm của cluster (từ API) */
  centroid?: { lat: number; lng: number };
}

interface DispatchOrdersSidebarProps {
  pendingOrderCount: number;
  isLoading: boolean;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  selectedOrder: string | null;
  onSelectOrder: (orderId: string) => void;
  clusterView: boolean;
  groups: DispatchOrderGroup[];
}

export function DispatchOrdersSidebar({
  pendingOrderCount,
  isLoading,
  searchQuery,
  onSearchQueryChange,
  selectedOrder,
  onSelectOrder,
  clusterView,
  groups,
}: DispatchOrdersSidebarProps) {
  return (
    <aside className="flex flex-col glass rounded-md overflow-hidden h-full">
      <div className="p-md border-b border-border flex-none flex justify-between items-center">
        <h3 className="font-semibold">Pending Orders</h3>
        <Badge variant="warning">{pendingOrderCount}</Badge>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 p-md flex flex-col gap-md">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size={24} />
          </div>
        ) : (
          <>
            {(pendingOrderCount > 0 || searchQuery) && (
              <div className="sticky top-0 bg-surface pb-md -mt-md pt-md z-10">
                <SearchInput
                  placeholder="Search pending orders..."
                  value={searchQuery}
                  onChange={(event) => onSearchQueryChange(event.target.value)}
                />
              </div>
            )}
            
            {groups.length === 0 ? (
              <div className="text-center py-8 text-text-dim">
                {searchQuery ? (
                  <>No orders matching "<strong>{searchQuery}</strong>"</>
                ) : (
                  'No pending orders'
                )}
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.key} className="flex flex-col gap-md">
                  {clusterView && (
                    <div className="flex justify-between items-center text-[10px] text-text-muted uppercase tracking-widest font-medium">
                      <div className="flex items-center gap-1.5">
                        {group.isClusterGroup && <Layers size={12} className="text-warning" />}
                        <span>{group.label}</span>
                      </div>
                      <Badge variant={group.isClusterGroup ? 'warning' : 'neutral'}>
                        {group.orders.length}
                      </Badge>
                    </div>
                  )}
                  {group.orders.map((order) => (
                    <div
                      key={order.id}
                      className={`bg-surface-low border border-border rounded-default p-md cursor-pointer transition-all duration-150 ease-out hover:border-primary-light hover:bg-surface-high ${selectedOrder === order.id ? 'border-primary bg-primary/5 shadow-[0_0_0_1px_var(--color-primary)]' : ''}`}
                      onClick={() => onSelectOrder(order.id)}
                    >
                      <div className="flex justify-between items-center mb-sm">
                        <span className="font-bold text-primary-light">{order.id.split('-')[0]}</span>
                        <span className="text-[12px] text-text-dim">{order.weightKg}kg</span>
                      </div>
                      <div className="flex items-center gap-sm mb-sm overflow-hidden">
                        <div className="flex items-center gap-1 text-[12px] text-text min-w-0">
                          <MapPin size={12} className="text-primary flex-none" />
                          <span className="truncate">{order.pickupAddress}</span>
                        </div>
                        <ChevronRight size={14} className="text-text-dim flex-none" />
                        <div className="flex items-center gap-1 text-[12px] text-text min-w-0">
                          <MapPin size={12} className="text-success flex-none" />
                          <span className="truncate">{order.deliveryAddress}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-sm border-t border-border pt-sm">
                        <Button variant="ghost" size="sm">Details</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </aside>
  );
}
