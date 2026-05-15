'use client';

import React from 'react';
import { format } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Trip } from '@/types';

interface TripHistorySectionProps {
  trips: Trip[];
  isLoading: boolean;
  onViewDetails: (trip: Trip) => void;
}

export function TripHistorySection({ trips, isLoading, onViewDetails }: TripHistorySectionProps) {
  const tripColumns: Column<Trip>[] = [
    {
      header: 'Trip ID',
      accessor: (trip) => (
        <span className="font-mono font-bold text-primary">
          #TR-{trip.id.substring(0, 6).toUpperCase()}
        </span>
      )
    },
    {
      header: 'Date',
      accessor: (trip) => format(new Date(trip.createdAt), 'MMM dd, yyyy')
    },
    {
      header: 'Status',
      accessor: (trip) => (
        <Badge variant={
          trip.status === 'completed' ? 'success' : 
          trip.status === 'in_progress' ? 'primary' : 
          trip.status === 'cancelled' ? 'danger' : 'warning'
        }>
          {trip.status.replace('_', ' ')}
        </Badge>
      )
    },
    {
      header: 'Distance',
      accessor: (trip) => `${trip.totalDistanceKm || 0} km`
    },
    {
      header: 'Actions',
      accessor: (trip) => (
        <Button 
          variant="ghost" 
          size="sm" 
          icon={<ExternalLink size={14} />}
          onClick={() => onViewDetails(trip)}
        >
          Details
        </Button>
      )
    }
  ];

  return (
    <section className="flex flex-col gap-xl">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h3 className="text-xl font-bold">Trip History</h3>
          <p className="text-sm text-text-dim">Complete log of all trips assigned to this driver.</p>
        </div>
        <div className="flex items-center gap-md">
          <Button variant="secondary" size="sm">Download Log</Button>
        </div>
      </div>
      
      <DataTable 
        data={trips || []} 
        columns={tripColumns} 
        isLoading={isLoading}
      />
    </section>
  );
}
