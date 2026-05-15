'use client';

import React from 'react';
import { UserPlus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Vehicle, Driver } from '@/types';

interface VehicleAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  drivers: Driver[];
  onAssign: (driverId: string) => Promise<void>;
  isLoading: boolean;
}

export function VehicleAssignModal({
  isOpen,
  onClose,
  vehicle,
  drivers,
  onAssign,
  isLoading
}: VehicleAssignModalProps) {
  const [assignedDriverId, setAssignedDriverId] = React.useState('');

  React.useEffect(() => {
    if (isOpen && vehicle) {
      setAssignedDriverId(vehicle.driverId || '');
    }
  }, [isOpen, vehicle]);

  const sortedDrivers = React.useMemo(() => {
    return [...drivers].sort((left, right) => {
      const leftName = left.fullName || '';
      const rightName = right.fullName || '';
      
      if (left.status === right.status) {
        return leftName.localeCompare(rightName);
      }

      if (left.status === 'available') return -1;
      if (right.status === 'available') return 1;

      return leftName.localeCompare(rightName);
    });
  }, [drivers]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vehicle ? `${vehicle.plateNumber} - Assign Driver` : 'Assign Driver'}
      size="sm"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button 
            variant="primary" 
            onClick={() => onAssign(assignedDriverId)} 
            isLoading={isLoading}
          >
            Save Assignment
          </Button>
        </>
      )}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-dim">Select Driver</label>
          <Select
            options={[
              { label: 'Unassigned', value: '', icon: <UserPlus size={14} /> },
              ...sortedDrivers.map(driver => ({
                label: `${driver.fullName} (${driver.status.replace('_', ' ')})`,
                value: driver.id,
                icon: <UserPlus size={14} className={driver.status === 'available' ? 'text-success' : 'text-text-dim'} />
              }))
            ]}
            value={assignedDriverId}
            onChange={setAssignedDriverId}
            placeholder="Select a driver"
          />
        </div>
        <p className="text-xs text-text-dim">
          This will update the vehicle&apos;s assigned driver without changing other vehicle details.
        </p>
      </div>
    </Modal>
  );
}
