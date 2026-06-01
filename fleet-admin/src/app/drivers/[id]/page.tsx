'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDriver, useDriverKpi } from '@/hooks/use-drivers';
import { useAlerts } from '@/hooks/use-alerts';
import { useTrips } from '@/hooks/use-trips';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Trip } from '@/types';

// Extracted Components
import { DriverHeader } from './components/DriverHeader';
import { DriverKpiStats } from './components/DriverKpiStats';
import { DriverViolationsList } from './components/DriverViolationsList';
import { TripHistorySection } from './components/TripHistorySection';
import { TripDetailModal } from './components/TripDetailModal';

export default function DriverKpiDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const { data: driver, isLoading: driverLoading } = useDriver(id);
  const { data: kpi, isLoading: kpiLoading } = useDriverKpi(id);
  const { alerts, isLoading: alertsLoading } = useAlerts({ driverId: id });
  const { data: trips, isLoading: tripsLoading } = useTrips({ driverId: id });

  const [selectedTrip, setSelectedTrip] = React.useState<Trip | null>(null);

  const isLoading = driverLoading || kpiLoading || alertsLoading || tripsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-lg">
        <p className="text-xl font-semibold text-text-dim">Driver not found</p>
        <Button variant="primary" onClick={() => router.push('/drivers')}>
          Back to Drivers
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2xl pb-4xl animate-in fade-in duration-500">
      <DriverHeader driver={driver} kpi={kpi} />

      <DriverKpiStats kpi={kpi} />

      <div>
        <DriverViolationsList alerts={(alerts || []).filter(a => a.type !== 'speed_violation')} />
      </div>

      <TripHistorySection 
        trips={trips || []} 
        isLoading={tripsLoading} 
        onViewDetails={setSelectedTrip} 
      />

      <TripDetailModal 
        trip={selectedTrip} 
        onClose={() => setSelectedTrip(null)} 
      />
    </div>
  );
}
