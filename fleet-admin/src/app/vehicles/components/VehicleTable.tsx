'use client';

import React from 'react';
import { 
  MoreVertical, 
  UserPlus, 
  Navigation, 
  Edit2, 
  Trash2 
} from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Vehicle } from '@/types';

interface VehicleTableProps {
  vehicles: Vehicle[];
  isLoading: boolean;
  onEdit: (vehicle: Vehicle) => void;
  onAssign: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
  onTrack: (vehicleId: string) => void;
}

export function VehicleTable({
  vehicles,
  isLoading,
  onEdit,
  onAssign,
  onDelete,
  onTrack
}: VehicleTableProps) {
  const columns = [
    { header: 'Plate Number', accessor: 'plateNumber' as keyof Vehicle },
    { 
      header: 'Type', 
      accessor: (v: Vehicle) => <span className="capitalize">{v.type}</span> 
    },
    { 
      header: 'Status', 
      accessor: (v: Vehicle) => (
        <Badge variant={v.status === 'available' ? 'success' : v.status === 'delivering' ? 'primary' : 'warning'}>
          {v.status}
        </Badge>
      )
    },
    { header: 'Driver', accessor: (v: Vehicle) => v.driver?.fullName || 'Unassigned' },
    { header: 'Device ID', accessor: (v: Vehicle) => v.deviceId || <span className="text-text-dim italic">No hardware</span> },
    { header: 'Capacity (kg)', accessor: 'maxCapacityKg' as keyof Vehicle },
    {
      header: 'Actions',
      accessor: (v: Vehicle) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Dropdown align="right" trigger={
            <Button variant="ghost" size="sm" icon={<MoreVertical size={16} />} />
          }>
              <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); onAssign(v); }}>
                <UserPlus size={16} /> {v.driver ? 'Change Driver' : 'Assign Driver'}
              </button>
            <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); onTrack(v.id); }}>
              <Navigation size={16} /> Track Vehicle
            </button>
            <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); onEdit(v); }}>
              <Edit2 size={16} /> Edit Details
            </button>
            <div className="dropdown-divider" />
            <button className="dropdown-item danger" onClick={(e) => { e.stopPropagation(); onDelete(v); }}>
              <Trash2 size={16} /> Delete Vehicle
            </button>
          </Dropdown>
        </div>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-surface rounded-xl border border-border">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  return (
    <section className="bg-surface rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <DataTable 
          data={vehicles} 
          columns={columns} 
          onRowClick={(vehicle) => onEdit(vehicle as Vehicle)}
        />
      </div>
    </section>
  );
}
