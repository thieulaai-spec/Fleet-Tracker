'use client';

import React from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Order } from '@/types';

export interface DispatchOrderGroup {
  key: string;
  label: string;
  orders: Order[];
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
    <aside className="dispatch-sidebar orders-list">
      <div className="sidebar-header">
        <h3>Pending Orders</h3>
        <Badge variant="warning">{pendingOrderCount}</Badge>
      </div>
      <div className="sidebar-content">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size={24} />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-8 text-dim">No pending orders</div>
        ) : (
          <>
            <div className="dispatch-search">
              <SearchInput
                placeholder="Search pending orders..."
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
              />
            </div>
            {groups.map((group) => (
              <div key={group.key} className="cluster-group">
                {clusterView && (
                  <div className="cluster-header">
                    <span>{group.label}</span>
                    <Badge variant="neutral">{group.orders.length}</Badge>
                  </div>
                )}
                {group.orders.map((order) => (
                  <div
                    key={order.id}
                    className={`dispatch-card ${selectedOrder === order.id ? 'selected' : ''}`}
                    onClick={() => onSelectOrder(order.id)}
                  >
                    <div className="card-header">
                      <span className="order-id">{order.id.split('-')[0]}</span>
                      <span className="order-weight">{order.weightKg}kg</span>
                    </div>
                    <div className="order-route">
                      <div className="point">
                        <MapPin size={12} className="text-primary" />
                        <span>{order.pickupAddress}</span>
                      </div>
                      <ChevronRight size={14} className="text-dim" />
                      <div className="point">
                        <MapPin size={12} className="text-success" />
                        <span>{order.deliveryAddress}</span>
                      </div>
                    </div>
                    <div className="card-footer">
                      <Button variant="ghost" size="sm">Details</Button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </div>

      <style jsx>{`
        .dispatch-search {
          margin-bottom: var(--space-sm);
        }

        .dispatch-search :global(.search-input-group) {
          width: 100%;
        }

        .cluster-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .cluster-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font: var(--font-label-sm);
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .dispatch-card {
          background: var(--color-surface-low);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-default);
          padding: var(--space-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .dispatch-card:hover {
          border-color: var(--color-primary-light);
          background: var(--color-surface-high);
        }

        .dispatch-card.selected {
          border-color: var(--color-primary);
          background: rgba(99, 102, 241, 0.05);
          box-shadow: 0 0 0 1px var(--color-primary);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-sm);
        }

        .order-id { font-weight: 700; color: var(--color-primary-light); }
        .order-weight { font-size: 12px; color: var(--color-text-dim); }

        .order-route {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          margin-bottom: var(--space-sm);
        }

        .point { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--color-text); }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: var(--space-sm);
          border-top: 1px solid var(--color-border);
          padding-top: var(--space-sm);
        }

        .customer-name { font-size: 12px; font-weight: 500; }
      `}</style>
    </aside>
  );
}
