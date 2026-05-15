import { User as UserIcon, Edit2, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DriverWithUser } from '../types';

interface DriverTableProps {
  drivers: DriverWithUser[];
  isLoading: boolean;
  onEdit: (driver: DriverWithUser) => void;
  onDelete: (driver: DriverWithUser) => void;
  onRowClick: (driver: DriverWithUser) => void;
}

export function DriverTable({
  drivers,
  isLoading,
  onEdit,
  onDelete,
  onRowClick
}: DriverTableProps) {
  const columns = [
    { 
      header: 'Driver', 
      accessor: (d: DriverWithUser) => (
        <div className="flex items-center gap-md">
          <div className="w-8 h-8 bg-surface-high rounded-full flex items-center justify-center text-primary-light">
            <UserIcon size={16} />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-text">{d.fullName}</span>
            <span className="text-xs text-dim">{d.user?.email || 'N/A'}</span>
          </div>
        </div>
      )
    },
    { header: 'Phone', accessor: 'phone' as keyof DriverWithUser },
    { 
      header: 'License', 
      accessor: (d: DriverWithUser) => (
        <div className="flex flex-col">
          <span className="font-medium">{d.licenseClass || 'N/A'}</span>
          <span className="text-xs text-dim">{d.licenseExpiry ? new Date(d.licenseExpiry).toLocaleDateString() : ''}</span>
        </div>
      )
    },
    { 
      header: 'Status', 
      accessor: (d: DriverWithUser) => (
        <Badge variant={d.status === 'available' ? 'success' : d.status === 'on_trip' ? 'primary' : 'neutral'}>
          {d.status.replace('_', ' ')}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: (d: DriverWithUser) => (
        <div className="flex gap-sm">
          <Button 
            variant="ghost" 
            size="sm" 
            icon={<Edit2 size={16} />} 
            aria-label={`Edit ${d.fullName}`}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(d);
            }}
          />
          <Button 
            variant="ghost" 
            size="sm" 
            icon={<Trash2 size={16} />} 
            className="text-danger hover:bg-danger/10" 
            aria-label={`Delete ${d.fullName}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(d);
            }}
          />
        </div>
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
        data={drivers} 
        columns={columns} 
        onRowClick={onRowClick} 
      />
    </section>
  );
}
