'use client';

import React from 'react';
import { Package, Truck, Users, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MapBox, MapMarker } from '@/components/ui/MapBox';
import { Order, Vehicle } from '@/types';

interface DispatchMapPanelProps {
  clusterView: boolean;
  onToggleClusterView: () => void;
  orders: Order[];
  vehicles: Vehicle[];
  selectedOrderId: string | null;
  onSelectOrder: (id: string | null) => void;
}

export function DispatchMapPanel({ 
  clusterView, 
  onToggleClusterView,
  orders,
  vehicles,
  selectedOrderId,
  onSelectOrder
}: DispatchMapPanelProps) {
  const mapMarkers = React.useMemo<MapMarker[]>(() => {
    const markers: MapMarker[] = [];
    
    // Add Order markers
    orders.forEach((order) => {
      const isSelected = selectedOrderId === order.id;
      const lat = Number(order.pickupLocation?.lat);
      const lng = Number(order.pickupLocation?.lng);

      if (!isNaN(lat) && !isNaN(lng)) {
        markers.push({
          id: `order-${order.id}`,
          lat,
          lng,
          label: `Order ${order.id.split('-')[0]}`,
          icon: <Package size={isSelected ? 18 : 14} />,
          color: isSelected ? '#3b82f6' : 'var(--color-warning)',
          onClick: () => onSelectOrder(order.id),
        });
      }
    });

    // Add Vehicle markers
    vehicles.forEach((vehicle) => {
      if (vehicle.lastKnownLocation) {
        const lat = Number(vehicle.lastKnownLocation.lat);
        const lng = Number(vehicle.lastKnownLocation.lng);

        if (!isNaN(lat) && !isNaN(lng)) {
          markers.push({
            id: `vehicle-${vehicle.id}`,
            lat,
            lng,
            label: vehicle.plateNumber,
            icon: <Truck size={14} />,
            color: 'var(--color-primary-light)',
          });
        }
      }
    });

    return markers;
  }, [orders, vehicles, selectedOrderId, onSelectOrder]);

  const suggestionLines = React.useMemo(() => {
    if (!selectedOrderId) return [];
    
    const order = orders.find(o => o.id === selectedOrderId);
    if (!order || !order.pickupLocation) return [];

    // Simple suggestion: lines to top 3 closest available vehicles
    const orderLoc = order.pickupLocation;
    return vehicles
      .filter(v => v.status === 'available' && v.lastKnownLocation)
      .map(v => ({
        id: v.id,
        path: [
          { lat: orderLoc.lat, lng: orderLoc.lng },
          { lat: v.lastKnownLocation!.lat, lng: v.lastKnownLocation!.lng }
        ]
      }))
      .slice(0, 3);
  }, [selectedOrderId, orders, vehicles]);

  return (
    <main className="dispatch-map-area">
      <div className="map-container">
        <div className="map-overlay-top">
          <div className="map-search card">
            <Navigation size={18} />
            <input type="text" placeholder="Search map location..." />
          </div>
        </div>

        <div className="real-map">
          <MapBox 
            markers={mapMarkers} 
            path={suggestionLines.length > 0 ? suggestionLines[0].path : []} // Just show closest for now
          />
        </div>

        <div className="map-overlay-bottom">
          <div className="map-controls card">
            <Button variant="secondary" size="sm" icon={<Users size={14} />} onClick={onToggleClusterView}>
              {clusterView ? 'Cluster View' : 'List View'}
            </Button>
            <div className="divider-v" />
            <Button variant="secondary" size="sm">2D/3D</Button>
            <Button variant="secondary" size="sm">Satellite</Button>
            <div className="divider-v" />
            <Button variant="secondary" size="sm">Traffic</Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dispatch-map-area {
          position: relative;
          background: #0a0a0a;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--color-border);
        }

        .map-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .map-overlay-top {
          position: absolute;
          top: var(--space-lg);
          left: var(--space-lg);
          right: var(--space-lg);
          z-index: 10;
        }

        .map-search {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: 8px var(--space-md);
          max-width: 300px;
          background: rgba(18, 33, 49, 0.9);
          backdrop-filter: blur(10px);
        }

        .map-search input {
          background: transparent;
          border: none;
          color: white;
          outline: none;
          font-size: 14px;
        }

        .real-map {
          flex: 1;
          position: relative;
        }

        .map-overlay-bottom {
          position: absolute;
          bottom: var(--space-lg);
          right: var(--space-lg);
          z-index: 10;
        }

        .map-controls {
          display: flex;
          gap: var(--space-xs);
          padding: 6px;
          background: rgba(18, 33, 49, 0.9);
          backdrop-filter: blur(10px);
        }

        .divider-v {
          width: 1px;
          background: var(--color-border);
          margin: 4px 0;
        }
      `}</style>
    </main>
  );
}
