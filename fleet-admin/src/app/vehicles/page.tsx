'use client';

import React from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Eye 
} from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';

import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useVehicles } from '@/hooks/use-vehicles';
import { Vehicle } from '@/types';

const vehicleSchema = z.object({
  plateNumber: z.string().min(1, 'Plate number is required'),
  type: z.enum(['small', 'medium', 'large']),
  status: z.enum(['available', 'delivering', 'maintenance']),
  maxCapacityKg: z.number().min(100, 'Minimum capacity is 100kg'),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

export default function VehiclesPage() {
  const { vehicles, isLoading, createVehicle, updateVehicle, deleteVehicle, isCreating, isUpdating, isDeleting } = useVehicles();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedVehicle, setSelectedVehicle] = React.useState<Vehicle | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = React.useState<Vehicle | null>(null);
  const isEditing = Boolean(selectedVehicle);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      status: 'available',
      type: 'medium',
      maxCapacityKg: 1000,
    }
  });

  const openCreateModal = () => {
    setSelectedVehicle(null);
    reset({ plateNumber: '', type: 'medium', status: 'available', maxCapacityKg: 1000 });
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    reset({
      plateNumber: vehicle.plateNumber,
      type: vehicle.type,
      status: vehicle.status,
      maxCapacityKg: vehicle.maxCapacityKg || 1000,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
    reset();
  };

  const onSubmit = async (data: VehicleFormValues) => {
    try {
      if (selectedVehicle) {
        await updateVehicle({ id: selectedVehicle.id, ...data });
      } else {
        await createVehicle(data);
      }
      closeModal();
    } catch (err) {
      console.error('Failed to save vehicle:', err);
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.driver?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    { header: 'Capacity (kg)', accessor: 'maxCapacityKg' as keyof Vehicle },
    {
      header: 'Actions',
      accessor: (v: Vehicle) => (
        <div className="action-buttons">
          <Button variant="ghost" size="sm" icon={<Eye size={16} />} aria-label={`View ${v.plateNumber}`} />
          <Button variant="ghost" size="sm" icon={<Edit2 size={16} />} aria-label={`Edit ${v.plateNumber}`} onClick={() => openEditModal(v)} />
          <Button variant="ghost" size="sm" icon={<Trash2 size={16} />} className="text-danger" aria-label={`Delete ${v.plateNumber}`} onClick={() => setVehicleToDelete(v)} />
        </div>
      )
    }
  ];

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Vehicle Management</h1>
          <p className="text-dim">Manage your fleet vehicles, maintenance schedules, and assignments.</p>
        </div>
        <Button variant="primary" icon={<Plus size={18} />} onClick={openCreateModal}>
          Add New Vehicle
        </Button>
      </header>

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}
        footer={(
          <>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit(onSubmit)} isLoading={isCreating || isUpdating}>{isEditing ? 'Save Changes' : 'Create Vehicle'}</Button>
          </>
        )}
      >
        <form className="vehicle-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="form-grid">
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
            <div className="form-group">
              <label className="label">Vehicle Type</label>
              <select className="select" {...register('type')}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
              {errors.type && <p className="error-text">{errors.type.message}</p>}
            </div>
            <div className="form-group">
              <label className="label">Status</label>
              <select className="select" {...register('status')}>
                <option value="available">Available</option>
                <option value="delivering">Delivering</option>
                <option value="maintenance">Maintenance</option>
              </select>
              {errors.status && <p className="error-text">{errors.status.message}</p>}
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(vehicleToDelete)}
        title="Delete vehicle"
        description={`Delete ${vehicleToDelete?.plateNumber || 'this vehicle'}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        isLoading={isDeleting}
        onClose={() => setVehicleToDelete(null)}
        onConfirm={async () => {
          if (!vehicleToDelete) return;
          await deleteVehicle(vehicleToDelete.id);
          setVehicleToDelete(null);
        }}
      />

      <section className="filters-bar card">
        <SearchInput
          placeholder="Search by plate number or driver..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="filter-actions">
          <Button variant="secondary" size="md" icon={<Filter size={18} />}>Filters</Button>
          <div className="divider" />
          <span className="results-count">Showing <b>{filteredVehicles.length}</b> vehicles</span>
        </div>
      </section>

      <section className="table-section">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size={32} />
          </div>
        ) : (
          <DataTable data={filteredVehicles} columns={columns} />
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

        .filter-actions {
          display: flex;
          align-items: center;
          gap: var(--space-lg);
        }

        .divider {
          width: 1px;
          height: 24px;
          background: var(--color-border);
        }

        .results-count {
          font: var(--font-label-sm);
          color: var(--color-text-dim);
        }

        .action-buttons {
          display: flex;
          gap: 4px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-lg);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .label {
          font: var(--font-label-md);
          color: var(--color-text-dim);
        }

        .select {
          background: var(--color-surface-low);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-default);
          color: var(--color-text);
          padding: 10px 12px;
          font: var(--font-body-md);
          outline: none;
          transition: border-color 0.2s;
        }

        .select:focus {
          border-color: var(--color-primary);
        }

        .error-text {
          color: var(--color-danger);
          font-size: 12px;
          margin-top: 4px;
        }
        .capitalize {
          text-transform: capitalize;
        }
      `}</style>
    </div>
  );
}
