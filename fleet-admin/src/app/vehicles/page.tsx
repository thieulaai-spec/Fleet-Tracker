'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useVehicles } from '@/hooks/use-vehicles';
import { useDrivers } from '@/hooks/use-drivers';
import { Vehicle } from '@/types';
import { useRouter } from 'next/navigation';

// Extracted Components
import { VehicleFormModal, VehicleFormValues } from './components/VehicleFormModal';
import { VehicleAssignModal } from './components/VehicleAssignModal';
import { VehicleFilters } from './components/VehicleFilters';
import { VehicleTable } from './components/VehicleTable';

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
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = React.useState(false);
  const [selectedVehicle, setSelectedVehicle] = React.useState<Vehicle | null>(null);
  const [vehicleToAssign, setVehicleToAssign] = React.useState<Vehicle | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = React.useState<Vehicle | null>(null);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter]);

  const handleOpenCreateModal = () => {
    setSelectedVehicle(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsFormModalOpen(true);
  };

  const handleOpenAssignModal = (vehicle: Vehicle) => {
    setVehicleToAssign(vehicle);
    setIsAssignModalOpen(true);
  };

  const handleFormSubmit = async (data: VehicleFormValues) => {
    try {
      if (selectedVehicle) {
        await updateVehicle({ id: selectedVehicle.id, ...data, driverId: data.driverId || null });
      } else {
        await createVehicle({
          plateNumber: data.plateNumber,
          type: data.type,
          maxCapacityKg: data.maxCapacityKg,
          deviceId: data.deviceId || null,
          driverId: data.driverId || null,
          status: data.status,
          initialLat: data.initialLat,
          initialLng: data.initialLng,
        });
      }
      setIsFormModalOpen(false);
    } catch (err) {
      console.error('Failed to save vehicle:', err);
    }
  };

  const handleAssignDriver = async (driverId: string) => {
    try {
      if (!vehicleToAssign) return;
      await updateVehicle({ id: vehicleToAssign.id, driverId: driverId || null });
      setIsAssignModalOpen(false);
    } catch (err) {
      console.error('Failed to assign driver:', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!vehicleToDelete) return;
    await deleteVehicle(vehicleToDelete.id);
    setVehicleToDelete(null);
  };

  return (
    <div className="flex flex-col gap-xl">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text">Vehicle Management</h1>
          <p className="text-sm text-text-dim mt-1">Manage your fleet vehicles, maintenance schedules, and assignments.</p>
        </div>
        <Button variant="primary" icon={<Plus size={18} />} onClick={handleOpenCreateModal}>
          Add New Vehicle
        </Button>
      </header>

      <VehicleFilters 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        total={total}
      />

      <VehicleTable 
        vehicles={vehicles}
        isLoading={isLoading}
        onEdit={handleOpenEditModal}
        onAssign={handleOpenAssignModal}
        onDelete={setVehicleToDelete}
        onTrack={(id) => router.push(`/dispatch?vehicleId=${id}`)}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-lg p-lg bg-surface-low/30 border-t border-border rounded-b-xl">
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

      <VehicleFormModal 
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        selectedVehicle={selectedVehicle}
        onSubmit={handleFormSubmit}
        isLoading={isCreating || isUpdating}
        drivers={drivers}
      />

      <VehicleAssignModal 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        vehicle={vehicleToAssign}
        drivers={drivers}
        onAssign={handleAssignDriver}
        isLoading={isUpdating}
      />

      <ConfirmDialog
        open={Boolean(vehicleToDelete)}
        title="Delete vehicle"
        description={`Delete ${vehicleToDelete?.plateNumber || 'this vehicle'}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        isLoading={isDeleting}
        onClose={() => setVehicleToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
