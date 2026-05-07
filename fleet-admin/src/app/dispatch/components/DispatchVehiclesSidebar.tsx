'use client';

import React from 'react';
import { Truck, Users, MapPin, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Vehicle } from '@/types';

interface DispatchVehiclesSidebarProps {
  availableVehicles: Vehicle[];
  isLoading: boolean;
  isAssigning: boolean;
  selectedOrder: string | null;
  onAssignVehicle: (vehicleId: string) => void;
}

export function DispatchVehiclesSidebar({
  availableVehicles,
  isLoading,
  isAssigning,
  selectedOrder,
  onAssignVehicle,
}: DispatchVehiclesSidebarProps) {
  return (
    <aside className="dispatch-sidebar vehicles-list">
      <div className="sidebar-header">
        <h3>Available Fleet</h3>
        <Badge variant="success">{availableVehicles.length}</Badge>
      </div>
      <div className="sidebar-content">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size={24} />
          </div>
        ) : availableVehicles.length === 0 ? (
          <div className="text-center py-8 text-dim">No available vehicles</div>
        ) : (
          availableVehicles.map((vehicle) => (
            <div key={vehicle.id} className="dispatch-card vehicle-card">
              <div className="card-header">
                <div className="vehicle-info">
                  <Truck size={18} />
                  <span className="vehicle-id">{vehicle.plateNumber}</span>
                </div>
                <Badge variant="success">{vehicle.status}</Badge>
              </div>
              <div className="driver-info">
                <Users size={14} className="text-dim" />
                <span>{vehicle.driver?.fullName || 'No driver assigned'}</span>
              </div>
              <div className="location-info">
                <MapPin size={14} className="text-dim" />
                <span>{vehicle.type}</span>
              </div>
              <div className="card-footer">
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  disabled={!selectedOrder || isAssigning}
                  isLoading={isAssigning}
                  icon={<CheckCircle2 size={16} />}
                  onClick={() => onAssignVehicle(vehicle.id)}
                >
                  Assign Order
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .dispatch-card {
          background: var(--color-surface-low);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-default);
          padding: var(--space-md);
          transition: all var(--transition-fast);
        }

        .dispatch-card:hover {
          border-color: var(--color-primary-light);
          background: var(--color-surface-high);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-sm);
        }

        .vehicle-info { display: flex; align-items: center; gap: 8px; font-weight: 700; }
        .driver-info, .location-info { display: flex; align-items: center; gap: 8px; font-size: 13px; margin-top: 4px; }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: var(--space-sm);
          border-top: 1px solid var(--color-border);
          padding-top: var(--space-sm);
        }
      `}</style>
    </aside>
  );
}
