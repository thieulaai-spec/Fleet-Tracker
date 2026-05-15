'use client';

import React from 'react';
import { useOrders } from '@/hooks/use-orders';
import { Order } from '@/types';

// Extracted Components
import { OrderHeader } from './components/OrderHeader';
import { OrderFilters } from './components/OrderFilters';
import { OrderTable } from './components/OrderTable';
import { OrderCreateModal } from './components/OrderCreateModal';
import { OrderDetailModal } from './components/OrderDetailModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function OrdersPage() {
  const { orders, isLoading, createOrder, cancelOrder, isCreating, isCancelling } = useOrders();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [viewingOrder, setViewingOrder] = React.useState<Order | null>(null);
  const [orderToCancel, setOrderToCancel] = React.useState<Order | null>(null);

  const handleCreateOrder = async (data: any) => {
    try {
      await createOrder(data);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to create order:', err);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    try {
      await cancelOrder(orderToCancel.id);
      setOrderToCancel(null);
    } catch (err) {
      console.error('Failed to cancel order:', err);
    }
  };

  const filteredOrders = React.useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.pickupAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  return (
    <div className="flex flex-col gap-2xl">
      <OrderHeader onAddOrder={() => setIsModalOpen(true)} />

      <OrderFilters 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        totalCount={filteredOrders.length}
      />

      <OrderTable 
        orders={filteredOrders}
        isLoading={isLoading}
        onViewDetails={setViewingOrder}
        onCancel={setOrderToCancel}
      />

      <OrderCreateModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrder}
        isLoading={isCreating}
      />

      <OrderDetailModal 
        order={viewingOrder}
        onClose={() => setViewingOrder(null)}
      />

      <ConfirmDialog
        open={Boolean(orderToCancel)}
        title="Cancel Order"
        description={`Are you sure you want to cancel order ${orderToCancel?.id.split('-')[0]}? This action cannot be undone.`}
        confirmLabel="Cancel Order"
        confirmVariant="danger"
        isLoading={isCancelling}
        onClose={() => setOrderToCancel(null)}
        onConfirm={handleCancelOrder}
      />
    </div>
  );
}
