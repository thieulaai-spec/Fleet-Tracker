'use client';

import React from 'react';
import { 
  Plus, 
  Filter, 
  MapPin, 
  Package, 
  Clock,
  MoreVertical,
  ChevronRight
} from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useOrders } from '@/hooks/use-orders';
import { format } from 'date-fns';

import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Order } from '@/types';

const orderSchema = z.object({
  pickupAddress: z.string().min(1, 'Pickup address is required'),
  deliveryAddress: z.string().min(1, 'Delivery address is required'),
  weightKg: z.number().min(0.1, 'Weight must be greater than 0'),
  description: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderSchema>;

export default function OrdersPage() {
  const { orders, isLoading, createOrder, isCreating } = useOrders();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      weightKg: 1
    }
  });

  const onSubmit = async (data: OrderFormValues) => {
    try {
      await createOrder({
        ...data,
        pickupLat: 10.762622,
        pickupLng: 106.660172,
        deliveryLat: 10.772622,
        deliveryLng: 106.670172,
      } as any);
      setIsModalOpen(false);
      reset();
    } catch (err) {
      console.error('Failed to create order:', err);
    }
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.pickupAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusVariant = (status: Order['status']) => {
    switch (status) {
      case 'delivered': return 'success';
      case 'delivering': return 'primary';
      case 'assigned': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
      case 'cancelled': return 'neutral';
      default: return 'neutral';
    }
  };

  const columns = [
    { 
      header: 'Order ID', 
      accessor: (o: Order) => (
        <div className="order-id-cell">
          <Package size={16} />
          <span>{o.id.split('-')[0]}</span>
        </div>
      )
    },
    { 
      header: 'Route', 
      accessor: (o: Order) => (
        <div className="route-cell">
          <div className="route-point">
            <MapPin size={12} className="text-primary" />
            <span>{o.pickupAddress}</span>
          </div>
          <ChevronRight size={14} className="text-dim" />
          <div className="route-point">
            <MapPin size={12} className="text-success" />
            <span>{o.deliveryAddress}</span>
          </div>
        </div>
      )
    },
    { header: 'Weight (kg)', accessor: 'weightKg' as keyof Order },
    { 
      header: 'Status', 
      accessor: (o: Order) => (
        <Badge variant={getStatusVariant(o.status)}>
          {o.status?.replace('_', ' ')}
        </Badge>
      )
    },
    { 
      header: 'Created At', 
      accessor: (o: Order) => (
        <div className="time-cell">
          <Clock size={14} />
          <span>{format(new Date(o.createdAt), 'yyyy-MM-dd HH:mm')}</span>
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: () => (
        <Button variant="ghost" size="sm" icon={<MoreVertical size={16} />} />
      )
    }
  ];

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Order Management</h1>
          <p className="text-dim">Create, track and manage delivery orders for your fleet.</p>
        </div>
        <Button variant="primary" icon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
          Create New Order
        </Button>
      </header>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Create New Order"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit(onSubmit)} isLoading={isCreating}>Create Order</Button>
          </>
        )}
      >
        <form className="order-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="form-grid">
            <Input 
              label="Weight (kg)" 
              type="number"
              step="0.1"
              {...register('weightKg', { valueAsNumber: true })}
              error={errors.weightKg?.message}
            />
            <Input 
              label="Description (Optional)" 
              placeholder="E.g. Fragile items" 
              {...register('description')}
              error={errors.description?.message}
            />
            <Input 
              label="Pickup Address" 
              placeholder="Address or coordinates" 
              {...register('pickupAddress')}
              error={errors.pickupAddress?.message}
            />
            <Input 
              label="Delivery Address" 
              placeholder="Address or coordinates" 
              {...register('deliveryAddress')}
              error={errors.deliveryAddress?.message}
            />
          </div>
        </form>
      </Modal>

      <section className="filters-bar card">
        <SearchInput
          placeholder="Search by ID or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="filter-actions">
          <Button variant="secondary" size="md" icon={<Filter size={18} />}>Filters</Button>
          <div className="divider" />
          <span className="results-count">Total <b>{filteredOrders.length}</b> orders</span>
        </div>
      </section>

      <section className="table-section">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size={32} />
          </div>
        ) : (
          <DataTable data={filteredOrders} columns={columns} />
        )}
      </section>

      <style jsx>{`
        .page-container {
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .order-id-cell {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: var(--color-primary-light);
          font-weight: 600;
        }

        .route-cell {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .route-point {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .time-cell {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--color-text-dim);
        }

        .filters-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-md) var(--space-lg);
        }

        .filters-bar :global(.search-input-group) {
          flex: 1;
          max-width: 400px;
        }

        .divider {
          width: 1px;
          height: 24px;
          background: var(--color-border);
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-lg);
        }

        @media (max-width: 600px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
