import React from 'react';
import { 
  Package, 
  MapPin, 
  ChevronRight, 
  Clock, 
  MoreVertical, 
  Eye, 
  Truck as TruckIcon, 
  XCircle 
} from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Order } from '@/types';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface OrderTableProps {
  orders: Order[];
  isLoading: boolean;
  onViewDetails: (order: Order) => void;
  onCancel: (order: Order) => void;
}

export const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  isLoading,
  onViewDetails,
  onCancel,
}) => {
  const router = useRouter();

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
        <div className="flex items-center gap-sm text-primary-light font-semibold">
          <Package size={16} />
          <span>{o.id.split('-')[0]}</span>
        </div>
      )
    },
    { 
      header: 'Route', 
      accessor: (o: Order) => (
        <div className="flex items-center gap-lg">
          <div className="flex items-center gap-md text-sm max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap">
            <MapPin size={14} className="text-primary-light" />
            <span className="font-medium">{o.pickupAddress}</span>
          </div>
          <ChevronRight size={16} className="text-dim" />
          <div className="flex items-center gap-md text-sm max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap">
            <MapPin size={14} className="text-tertiary-light" />
            <span className="font-medium">{o.deliveryAddress}</span>
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
        <div className="flex items-center gap-1.5 text-sm text-dim">
          <Clock size={14} />
          <span>{format(new Date(o.createdAt), 'yyyy-MM-dd HH:mm')}</span>
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: (o: Order) => (
        <Dropdown align="right" trigger={
          <Button variant="ghost" size="sm" icon={<MoreVertical size={16} />} />
        }>
          {o.status === 'pending' && (
            <button className="dropdown-item" onClick={() => router.push(`/dispatch?orderId=${o.id}`)}>
              <TruckIcon size={16} /> Dispatch Order
            </button>
          )}
          <button className="dropdown-item" onClick={() => onViewDetails(o)}>
            <Eye size={16} /> View Details
          </button>
          <div className="dropdown-divider" />
          <button 
            className="dropdown-item danger" 
            disabled={o.status === 'cancelled' || o.status === 'delivered'}
            onClick={() => onCancel(o)}
          >
            <XCircle size={16} /> Cancel Order
          </button>
        </Dropdown>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  return (
    <section className="table-section">
      <DataTable 
        data={orders} 
        columns={columns} 
        onRowClick={(order) => onViewDetails(order as Order)}
      />
    </section>
  );
};
