'use client';

import React from 'react';
import { DispatchOrdersSidebar, DispatchOrderGroup } from './components/DispatchOrdersSidebar';
import { DispatchVehiclesSidebar } from './components/DispatchVehiclesSidebar';
import { DispatchMapPanel } from './components/DispatchMapPanel';
import { useDispatch } from '@/hooks/use-dispatch';

export default function DispatchPage() {
  const { pendingOrders, availableVehicles, assignOrder, isLoading, isAssigning } = useDispatch();
  const [selectedOrder, setSelectedOrder] = React.useState<string | null>(null);
  const [clusterView, setClusterView] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredPendingOrders = React.useMemo(() => {
    return pendingOrders.filter((order) =>
      [order.id, order.pickupAddress, order.deliveryAddress]
        .join(' ')
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
    );
  }, [pendingOrders, searchQuery]);

  const clusterGroups = React.useMemo<DispatchOrderGroup[]>(() => {
    if (!clusterView) {
      return filteredPendingOrders.map((order) => ({
        key: order.id,
        label: `Order ${order.id.split('-')[0]}`,
        orders: [order],
      }));
    }

    const groups = new Map<string, typeof filteredPendingOrders>();

    filteredPendingOrders.forEach((order) => {
      const rawKey = order.pickupAddress.split(',').slice(-1)[0]?.trim() || order.pickupAddress.split(' ').slice(0, 2).join(' ');
      const key = rawKey || 'Cluster';
      const existing = groups.get(key) || [];
      groups.set(key, [...existing, order]);
    });

    return Array.from(groups.entries()).map(([key, orders]) => ({
      key,
      label: key,
      orders,
    }));
  }, [clusterView, filteredPendingOrders]);

  const handleAssign = async (vehicleId: string) => {
    if (!selectedOrder) return;

    await assignOrder({ orderId: selectedOrder, vehicleId });
    setSelectedOrder(null);
  };

  return (
    <div className="dispatch-container">
      <DispatchOrdersSidebar
        pendingOrderCount={pendingOrders.length}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        selectedOrder={selectedOrder}
        onSelectOrder={setSelectedOrder}
        clusterView={clusterView}
        groups={clusterGroups}
      />

      <DispatchMapPanel
        clusterView={clusterView}
        onToggleClusterView={() => setClusterView((value) => !value)}
      />

      <DispatchVehiclesSidebar
        availableVehicles={availableVehicles}
        isLoading={isLoading}
        isAssigning={isAssigning}
        selectedOrder={selectedOrder}
        onAssignVehicle={handleAssign}
      />

      <style jsx>{`
        .dispatch-container {
          display: grid;
          grid-template-columns: 320px 1fr 320px;
          height: calc(100vh - var(--header-height) - var(--space-xl) * 2);
          gap: var(--space-md);
          margin: -var(--space-md);
          padding: var(--space-md);
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
