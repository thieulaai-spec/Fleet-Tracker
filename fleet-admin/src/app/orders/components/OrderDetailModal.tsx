import React from 'react';
import { format } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Order } from '@/types';

interface OrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  onClose,
}) => {
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

  return (
    <Modal
      isOpen={Boolean(order)}
      onClose={onClose}
      title={order ? `Order Details - ${order.id.split('-')[0]}` : 'Order Details'}
    >
      {order && (
        <div className="flex flex-col gap-lg py-sm">
          <div className="flex justify-between items-center pb-lg border-b border-border">
            <span className="text-xs font-bold text-dim uppercase tracking-wider">Status</span>
            <Badge variant={getStatusVariant(order.status)}>
              {order.status.replace('_', ' ')}
            </Badge>
          </div>
          <div className="flex justify-between items-center pb-lg border-b border-border">
            <span className="text-xs font-bold text-dim uppercase tracking-wider">Pickup</span>
            <span className="text-sm font-semibold text-right max-w-[60%]">{order.pickupAddress}</span>
          </div>
          <div className="flex justify-between items-center pb-lg border-b border-border">
            <span className="text-xs font-bold text-dim uppercase tracking-wider">Delivery</span>
            <span className="text-sm font-semibold text-right max-w-[60%]">{order.deliveryAddress}</span>
          </div>
          <div className="flex justify-between items-center pb-lg border-b border-border">
            <span className="text-xs font-bold text-dim uppercase tracking-wider">Weight</span>
            <span className="text-sm font-semibold">{order.weightKg} kg</span>
          </div>
          <div className="flex justify-between items-center pb-lg border-b border-border">
            <span className="text-xs font-bold text-dim uppercase tracking-wider">Description</span>
            <span className="text-sm font-semibold">{order.description || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center pb-lg border-b border-border last:border-b-0 last:pb-0">
            <span className="text-xs font-bold text-dim uppercase tracking-wider">Created At</span>
            <span className="text-sm font-semibold">
              {format(new Date(order.createdAt), 'PPPP p')}
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
};
