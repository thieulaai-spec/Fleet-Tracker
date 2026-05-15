'use client';

import React from 'react';
import { format } from 'date-fns';
import { Truck, Navigation } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Trip } from '@/types';

interface TripDetailModalProps {
  trip: Trip | null;
  onClose: () => void;
}

export function TripDetailModal({ trip, onClose }: TripDetailModalProps) {
  return (
    <Modal
      isOpen={Boolean(trip)}
      onClose={onClose}
      title="Trip Details"
    >
      {trip && (
        <div className="flex flex-col gap-xl">
          <div className="flex justify-between items-center">
            <Badge variant={
              trip.status === 'completed' ? 'success' : 
              trip.status === 'in_progress' ? 'primary' : 'warning'
            }>
              {trip.status.toUpperCase()}
            </Badge>
            <span className="font-mono text-xs text-text-dim">ID: {trip.id}</span>
          </div>

          <div className="grid grid-cols-2 gap-xl">
            <div className="space-y-1">
              <p className="text-xs text-text-dim uppercase font-bold tracking-wider">Vehicle</p>
              <p className="font-semibold flex items-center gap-md">
                <Truck size={16} className="text-primary" />
                {trip.vehicle?.plateNumber || 'N/A'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-text-dim uppercase font-bold tracking-wider">Distance</p>
              <p className="font-semibold flex items-center gap-md">
                <Navigation size={16} className="text-primary" />
                {trip.totalDistanceKm || 0} km
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-text-dim uppercase font-bold tracking-wider">Timeline</p>
            <div className="p-md bg-surface-low rounded-xl border border-border space-y-md transition-all duration-300 hover:shadow-glow hover:border-primary/30">
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-dim">Created At</span>
                <span className="text-sm font-medium">{format(new Date(trip.createdAt), 'MMM dd, HH:mm')}</span>
              </div>
              {trip.startedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-dim">Started At</span>
                  <span className="text-sm font-medium">{format(new Date(trip.startedAt), 'MMM dd, HH:mm')}</span>
                </div>
              )}
              {trip.completedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-dim">Completed At</span>
                  <span className="text-sm font-medium">{format(new Date(trip.completedAt), 'MMM dd, HH:mm')}</span>
                </div>
              )}
            </div>
          </div>

          {trip.orders && trip.orders.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-text-dim uppercase font-bold tracking-wider">Orders ({trip.orders.length})</p>
              <div className="max-h-[200px] overflow-y-auto space-y-md pr-md">
                {trip.orders.map((order) => (
                  <div key={order.id} className="p-md bg-surface-low rounded-xl border border-border flex justify-between items-start transition-all duration-300 hover:shadow-glow hover:border-primary/30">
                    <div className="space-y-1">
                      <p className="text-sm font-bold">Order #{order.id.substring(0, 8)}</p>
                      <p className="text-xs text-text-dim">{order.deliveryAddress}</p>
                    </div>
                    <Badge variant="neutral">{order.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
