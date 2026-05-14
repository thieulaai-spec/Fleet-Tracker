'use client';

import React from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Eye,
  MoreVertical,
  Navigation,
  UserPlus
} from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';

import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useVehicles } from '@/hooks/use-vehicles';
import { useDrivers } from '@/hooks/use-drivers';
import { Vehicle } from '@/types';
import { useRouter } from 'next/navigation';

const vehicleSchema = z.object({
  plateNumber: z.string().min(1, 'Plate number is required'),
  type: z.enum(['small', 'medium', 'large']),
  status: z.enum(['available', 'delivering', 'maintenance']),
  maxCapacityKg: z.number().min(100, 'Minimum capacity is 100kg'),
  driverId: z.string().uuid().or(z.literal('')).optional().nullable(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

export default function VehiclesPage() {
  const router = useRouter();
  const [page, setPage] = React.useState(1);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const { 
    vehicles, 
    total, 
    totalPages,
    isLoading, 
    createVehicle, 
    updateVehicle, 
    deleteVehicle, 
    isCreating, 
    isUpdating, 
    isDeleting 
  } = useVehicles({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    type: typeFilter === 'all' ? undefined : typeFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const { drivers } = useDrivers();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = React.useState(false);
  const [selectedVehicle, setSelectedVehicle] = React.useState<Vehicle | null>(null);
  const [vehicleToAssign, setVehicleToAssign] = React.useState<Vehicle | null>(null);
  const [assignedDriverId, setAssignedDriverId] = React.useState('');
  const [vehicleToDelete, setVehicleToDelete] = React.useState<Vehicle | null>(null);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter]);
  const isEditing = Boolean(selectedVehicle);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      status: 'available',
      type: 'medium',
      maxCapacityKg: 1000,
      driverId: '',
    }
  });

  const sortedDrivers = React.useMemo(() => {
    return [...drivers].sort((left, right) => {
      if (left.status === right.status) {
        return left.fullName.localeCompare(right.fullName);
      }

      if (left.status === 'available') return -1;
      if (right.status === 'available') return 1;

      return left.fullName.localeCompare(right.fullName);
    });
  }, [drivers]);

  const openCreateModal = () => {
    setSelectedVehicle(null);
    reset({ plateNumber: '', type: 'medium', status: 'available', maxCapacityKg: 1000, driverId: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    reset({
      plateNumber: vehicle.plateNumber,
      type: vehicle.type,
      status: vehicle.status,
      maxCapacityKg: vehicle.maxCapacityKg || 1000,
      driverId: vehicle.driverId || '',
    });
    setIsModalOpen(true);
  };

  const openAssignModal = (vehicle: Vehicle) => {
    setVehicleToAssign(vehicle);
    setAssignedDriverId(vehicle.driverId || '');
    setIsAssignModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
    reset();
  };

  const closeAssignModal = () => {
    setIsAssignModalOpen(false);
    setVehicleToAssign(null);
    setAssignedDriverId('');
  };

  const onSubmit = async (data: VehicleFormValues) => {
    try {
      if (selectedVehicle) {
        const payload = {
          ...data,
          driverId: data.driverId || undefined,
        };
        await updateVehicle({ id: selectedVehicle.id, ...payload });
      } else {
        // For creation, the backend is strict: only allows these fields
        const payload = {
          plateNumber: data.plateNumber,
          type: data.type,
          maxCapacityKg: data.maxCapacityKg,
        };
        await createVehicle(payload);
        
        // Note: If a driver was selected in the form, it won't be assigned 
        // during creation because the backend POST /vehicles doesn't support it.
        // The user would need to assign it via the Edit or Assign Driver action.
      }
      closeModal();
    } catch (err) {
      console.error('Failed to save vehicle:', err);
    }
  };

  const onAssignDriver = async () => {
    try {
      if (!vehicleToAssign) return;

      await updateVehicle({
        id: vehicleToAssign.id,
        driverId: assignedDriverId || undefined,
      });

      closeAssignModal();
    } catch (err) {
      console.error('Failed to assign driver:', err);
    }
  };

  // Server-side filtered vehicles
  const filteredVehicles = vehicles;

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
        <Dropdown align="right" trigger={
          <Button variant="ghost" size="sm" icon={<MoreVertical size={16} />} />
        }>
            <button className="dropdown-item" onClick={() => openAssignModal(v)}>
              <UserPlus size={16} /> {v.driver ? 'Change Driver' : 'Assign Driver'}
            </button>
          <button className="dropdown-item" onClick={() => router.push(`/dispatch?vehicleId=${v.id}`)}>
            <Navigation size={16} /> Track Vehicle
          </button>
          <button className="dropdown-item" onClick={() => openEditModal(v)}>
            <Edit2 size={16} /> Edit Details
          </button>
          <div className="dropdown-divider" />
          <button className="dropdown-item danger" onClick={() => setVehicleToDelete(v)}>
            <Trash2 size={16} /> Delete Vehicle
          </button>
        </Dropdown>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-xl">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text">Vehicle Management</h1>
          <p className="text-sm text-text-dim mt-1">Manage your fleet vehicles, maintenance schedules, and assignments.</p>
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
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-dim">Vehicle Type</label>
              <select 
                className="bg-surface-low border border-border rounded-lg text-text px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors cursor-pointer" 
                {...register('type')}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
              {errors.type && <p className="text-danger text-xs mt-1">{errors.type.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-dim">Status</label>
              <select 
                className="bg-surface-low border border-border rounded-lg text-text px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors cursor-pointer" 
                {...register('status')}
              >
                <option value="available">Available</option>
                <option value="delivering">Delivering</option>
                <option value="maintenance">Maintenance</option>
              </select>
              {errors.status && <p className="text-danger text-xs mt-1">{errors.status.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-sm font-medium text-text-dim">Assigned Driver</label>
              <select 
                className="bg-surface-low border border-border rounded-lg text-text px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors cursor-pointer" 
                {...register('driverId')}
              >
                <option value="">Unassigned</option>
                {sortedDrivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.fullName} ({driver.status.replace('_', ' ')})
                  </option>
                ))}
              </select>
              {errors.driverId && <p className="text-danger text-xs mt-1">Invalid driver selection</p>}
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isAssignModalOpen}
        onClose={closeAssignModal}
        title={vehicleToAssign ? `${vehicleToAssign.plateNumber} - Assign Driver` : 'Assign Driver'}
        size="sm"
        footer={(
          <>
            <Button variant="secondary" onClick={closeAssignModal}>Cancel</Button>
            <Button variant="primary" onClick={onAssignDriver} isLoading={isUpdating}>Save Assignment</Button>
          </>
        )}
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-dim">Select Driver</label>
            <select
              className="bg-surface-low border border-border rounded-lg text-text px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors cursor-pointer"
              value={assignedDriverId}
              onChange={(e) => setAssignedDriverId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {sortedDrivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.fullName} ({driver.status.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-text-dim">
            This will update the vehicle&apos;s assigned driver without changing other vehicle details.
          </p>
        </div>
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

      <section className="flex flex-col md:flex-row justify-between items-center gap-lg p-lg bg-surface rounded-xl border border-border">
        <div className="w-full md:flex-1 md:max-w-[400px]">
          <SearchInput
            placeholder="Search by plate number or driver..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <select 
            className="bg-surface-low border border-border rounded-lg text-text px-3 py-2 text-sm font-medium outline-none cursor-pointer focus:border-primary transition-colors flex-1 md:flex-none" 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
          <select 
            className="bg-surface-low border border-border rounded-lg text-text px-3 py-2 text-sm font-medium outline-none cursor-pointer focus:border-primary transition-colors flex-1 md:flex-none" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="delivering">Delivering</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <div className="hidden md:block w-px h-6 bg-border" />
          <span className="text-xs font-medium text-text-dim whitespace-nowrap">Total <b>{total}</b> vehicles</span>
        </div>
      </section>

      <section className="bg-surface rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DataTable 
              data={filteredVehicles} 
              columns={columns} 
              onRowClick={(vehicle) => openEditModal(vehicle as Vehicle)}
            />
            
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-lg mt-lg p-lg border-t border-border bg-surface-low/30">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-xs font-medium text-text-dim">
                  Page <b>{page}</b> of <b>{totalPages}</b>
                </span>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
