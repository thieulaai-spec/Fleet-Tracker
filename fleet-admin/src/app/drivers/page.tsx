'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useDrivers } from '@/hooks/use-drivers';

// Types
import { DriverWithUser, DriverFormValues, DriverStats as DriverStatsType } from './types';

// Components
import { DriverHeader } from './components/DriverHeader';
import { DriverStats } from './components/DriverStats';
import { DriverFilters } from './components/DriverFilters';
import { DriverTable } from './components/DriverTable';
import { DriverFormModal } from './components/DriverFormModal';
import { DriverDetailModal } from './components/DriverDetailModal';
import { DriverDeleteDialog } from './components/DriverDeleteDialog';

export default function DriversPage() {
  const router = useRouter();
  const { drivers, isLoading, registerDriver, updateDriver, deleteDriver, isRegistering, isUpdating, isDeleting } = useDrivers();
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [editingDriver, setEditingDriver] = React.useState<DriverWithUser | null>(null);
  const [viewingDriver, setViewingDriver] = React.useState<DriverWithUser | null>(null);
  const [driverToDelete, setDriverToDelete] = React.useState<DriverWithUser | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const filteredDrivers = (drivers as DriverWithUser[]).filter(d => {
    const fullName = d.fullName || '';
    const email = d.user?.email || '';
    const phone = d.phone || '';

    const matchesSearch = fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = async (data: DriverFormValues) => {
    try {
      if (editingDriver) {
        const { email, password, ...updateData } = data;
        await updateDriver({ id: editingDriver.id, ...updateData });
      } else {
        await registerDriver(data as any);
      }
      setIsModalOpen(false);
      setEditingDriver(null);
    } catch (err) {
      console.error('Operation failed:', err);
    }
  };

  const stats: DriverStatsType = {
    total: drivers.length,
    active: drivers.filter((d: any) => d.status === 'on_trip').length,
    avgPerformance: '94.2%'
  };

  return (
    <div className="flex flex-col gap-2xl">
      <DriverHeader 
        onRegisterClick={() => {
          setEditingDriver(null);
          setIsModalOpen(true);
        }} 
      />

      <DriverStats 
        stats={stats} 
        isLoading={isLoading} 
      />

      <DriverFilters 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        filteredCount={filteredDrivers.length}
      />

      <DriverTable 
        drivers={filteredDrivers}
        isLoading={isLoading}
        onEdit={setEditingDriver}
        onDelete={setDriverToDelete}
        onRowClick={(driver) => router.push(`/drivers/${driver.id}`)}
      />

      <DriverFormModal 
        isOpen={isModalOpen || !!editingDriver}
        onClose={() => {
          setIsModalOpen(false);
          setEditingDriver(null);
        }}
        onSubmit={handleSubmit}
        editingDriver={editingDriver}
        isLoading={isRegistering || isUpdating}
      />

      <DriverDetailModal 
        driver={viewingDriver}
        onClose={() => setViewingDriver(null)}
        mounted={mounted}
      />

      <DriverDeleteDialog 
        driver={driverToDelete}
        onClose={() => setDriverToDelete(null)}
        onConfirm={async () => {
          if (!driverToDelete) return;
          await deleteDriver(driverToDelete.id);
          setDriverToDelete(null);
        }}
        isLoading={isDeleting}
      />
    </div>
  );
}
