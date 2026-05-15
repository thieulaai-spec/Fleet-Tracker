'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Plus, 
  Truck, 
  ShieldAlert, 
  Box,
  Container,
  Zap,
  Navigation,
  UserPlus
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Vehicle, Driver } from '@/types';

export const vehicleSchema = z.object({
  plateNumber: z.string().min(1, 'Plate number is required'),
  type: z.enum(['small', 'medium', 'large']),
  status: z.enum(['available', 'delivering', 'maintenance']),
  maxCapacityKg: z.number().min(100, 'Minimum capacity is 100kg'),
  driverId: z.string().uuid().or(z.literal('')).optional().nullable(),
  deviceId: z.string().optional().nullable(),
});

export type VehicleFormValues = z.infer<typeof vehicleSchema>;

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVehicle: Vehicle | null;
  onSubmit: (data: VehicleFormValues) => Promise<void>;
  isLoading: boolean;
  drivers: Driver[];
}

export function VehicleFormModal({
  isOpen,
  onClose,
  selectedVehicle,
  onSubmit,
  isLoading,
  drivers
}: VehicleFormModalProps) {
  const isEditing = Boolean(selectedVehicle);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      status: 'available',
      type: 'medium',
      maxCapacityKg: 1000,
      driverId: '',
      deviceId: '',
    }
  });

  React.useEffect(() => {
    if (isOpen) {
      if (selectedVehicle) {
        reset({
          plateNumber: selectedVehicle.plateNumber,
          type: selectedVehicle.type,
          status: selectedVehicle.status,
          maxCapacityKg: selectedVehicle.maxCapacityKg || 1000,
          driverId: selectedVehicle.driverId || '',
          deviceId: selectedVehicle.deviceId || '',
        });
      } else {
        reset({
          plateNumber: '',
          type: 'medium',
          status: 'available',
          maxCapacityKg: 1000,
          driverId: '',
          deviceId: '',
        });
      }
    }
  }, [isOpen, selectedVehicle, reset]);

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
      title={isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit(onSubmit)} 
            isLoading={isLoading}
          >
            {isEditing ? 'Save Changes' : 'Create Vehicle'}
          </Button>
        </>
      )}
    >
      <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            label="Plate Number" 
            placeholder="e.g. 29A-12345" 
            {...register('plateNumber')}
            error={errors.plateNumber?.message}
          />
          <Input 
            label="Max Capacity (kg)" 
            type="number"
            {...register('maxCapacityKg', { valueAsNumber: true })}
            error={errors.maxCapacityKg?.message}
          />
          <Input 
            label="Hardware Device ID" 
            placeholder="e.g. GPS-V1-001" 
            {...register('deviceId')}
            error={errors.deviceId?.message}
            helpText="Identifier for the physical GPS tracking chip."
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-dim">Vehicle Type</label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  options={[
                    { label: 'Small', value: 'small', icon: <Box size={14} /> },
                    { label: 'Medium', value: 'medium', icon: <Truck size={14} /> },
                    { label: 'Large', value: 'large', icon: <Container size={14} /> },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.type && <p className="text-danger text-xs mt-1">{errors.type.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-dim">Status</label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  options={[
                    { label: 'Available', value: 'available', icon: <Zap size={14} className="text-success" /> },
                    { label: 'Delivering', value: 'delivering', icon: <Navigation size={14} className="text-primary" /> },
                    { label: 'Maintenance', value: 'maintenance', icon: <ShieldAlert size={14} className="text-warning" /> },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.status && <p className="text-danger text-xs mt-1">{errors.status.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-sm font-medium text-text-dim">Assigned Driver</label>
            <Controller
              name="driverId"
              control={control}
              render={({ field }) => (
                <Select
                  options={[
                    { label: 'Unassigned', value: '', icon: <UserPlus size={14} /> },
                    ...sortedDrivers.map(driver => ({
                      label: `${driver.fullName} (${driver.status.replace('_', ' ')})`,
                      value: driver.id,
                      icon: <UserPlus size={14} className={driver.status === 'available' ? 'text-success' : 'text-text-dim'} />
                    }))
                  ]}
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Select a driver"
                />
              )}
            />
            {errors.driverId && <p className="text-danger text-xs mt-1">Invalid driver selection</p>}
          </div>
        </div>
      </form>
    </Modal>
  );
}
