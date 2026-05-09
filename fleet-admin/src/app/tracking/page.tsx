'use client';

import React, { useState, useMemo } from 'react';
import { MapBox, MapMarker } from '@/components/ui/MapBox';
import { useVehicles } from '@/hooks/use-vehicles';
import { useTracking } from '@/hooks/use-tracking';
import { Truck, AlertTriangle } from 'lucide-react';
import { TrackingSidebar } from './components/TrackingSidebar'; 
import { AlertsPanel } from './components/AlertsPanel';

export default function TrackingPage() {
  const { vehicles, isLoading } = useVehicles();
  const { vehicleLocations, trails, alerts, isConnected } = useTracking();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [followVehicle, setFollowVehicle] = useState(true);

  // Combine static vehicle data with real-time location data
  const mapMarkers = useMemo((): MapMarker[] => {
    return vehicles.map((v) => {
      const liveLoc = vehicleLocations[v.id];
      const lat = liveLoc?.lat ?? v.lastKnownLocation?.lat ?? 0;
      const lng = liveLoc?.lng ?? v.lastKnownLocation?.lng ?? 0;

      // Skip if no location available
      if (!lat || !lng) return null;

      const marker: MapMarker = {
        id: v.id,
        lat,
        lng,
        label: v.plateNumber,
        color: v.status === 'delivering' ? '#3b82f6' : v.status === 'available' ? '#10b981' : '#f59e0b',
        icon: <Truck className="w-4 h-4 text-white" />,
        metadata: {
          plateNumber: v.plateNumber,
          driverName: v.driver?.fullName,
          speed: liveLoc?.speed ?? 0,
          status: v.status,
          // Trip ID might be available in live location or trip data, using liveLoc if available
          tripId: liveLoc?.tripId,
        },
        onClick: () => setSelectedVehicleId(v.id),
      };
      return marker;
    }).filter((m): m is MapMarker => m !== null);
  }, [vehicles, vehicleLocations]);

  const selectedVehicle = useMemo(() => 
    vehicles.find(v => v.id === selectedVehicleId), 
  [vehicles, selectedVehicleId]);

  const currentTrail = useMemo(() => 
    selectedVehicleId ? trails[selectedVehicleId] || [] : [],
  [trails, selectedVehicleId]);

  // Mock geofence corridor for the selected vehicle
  const currentGeofence = useMemo(() => {
    if (!selectedVehicleId || currentTrail.length < 2) return undefined;
    // Just for demo: use a slightly offset version of the trail as a "planned route"
    return currentTrail.map(p => ({ lat: p.lat + 0.001, lng: p.lng + 0.001 }));
  }, [selectedVehicleId, currentTrail]);

  const [mapFocus, setMapFocus] = useState<{ lat: number, lng: number } | undefined>(undefined);

  const handleAlertClick = (lat: number, lng: number) => {
    setMapFocus({ lat, lng });
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-950">
      {/* Sidebar */}
      <TrackingSidebar 
        vehicles={vehicles} 
        vehicleLocations={vehicleLocations}
        selectedVehicleId={selectedVehicleId}
        onSelectVehicle={setSelectedVehicleId}
        isLoading={isLoading}
      />

      {/* Main Map Area */}
      <div className="relative flex-1">
        <MapBox 
          markers={mapMarkers} 
          path={currentTrail}
          geofence={currentGeofence}
          center={mapFocus || (selectedVehicle ? { 
            lat: vehicleLocations[selectedVehicle.id]?.lat ?? selectedVehicle.lastKnownLocation?.lat ?? 21.0285,
            lng: vehicleLocations[selectedVehicle.id]?.lng ?? selectedVehicle.lastKnownLocation?.lng ?? 105.8542
          } : undefined)}
          zoom={mapFocus ? 16 : (selectedVehicle ? 15 : 12)}
          followVehicle={followVehicle && !mapFocus}
        />

        {/* Connection Status Indicator */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-xs font-medium text-slate-300">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>

        {/* Map Controls Overlay */}
        <div className="absolute top-4 right-16 z-10 flex items-center gap-2">
          <button
            onClick={() => setFollowVehicle(!followVehicle)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              followVehicle 
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' 
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800'
            } backdrop-blur-md border border-slate-700`}
          >
            {followVehicle ? 'Following' : 'Follow Vehicle'}
          </button>
        </div>

        {/* Alerts Overlay */}
        <AlertsPanel alerts={alerts} onAlertClick={handleAlertClick} />
      </div>
    </div>
  );
}
