import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface OrderHeaderProps {
  onAddOrder: () => void;
}

export const OrderHeader: React.FC<OrderHeaderProps> = ({ onAddOrder }) => {
  return (
    <header className="flex justify-between items-center">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text">Order Management</h1>
        <p className="text-dim text-sm">Create, track and manage delivery orders for your fleet.</p>
      </div>
      <Button variant="primary" icon={<Plus size={18} />} onClick={onAddOrder}>
        Create New Order
      </Button>
    </header>
  );
};
