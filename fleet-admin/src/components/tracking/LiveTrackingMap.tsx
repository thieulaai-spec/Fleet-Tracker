'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { Map, Marker, NavigationControl, FullscreenControl, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Truck, Activity, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

interface VehiclePosition {
  vehicleId: string;
  driverId: string;
  licensePlate: string;
  driverName: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  status: 'active' | 'idle' | 'offline' | 'maintenance';
  lastUpdate: string;
  currentTripId?: string;
  ordersCount?: number;
}

interface LiveTrackingMapProps {
  vehicles: VehiclePosition[];
  selectedVehicle: VehiclePosition | null;
  onVehicleSelect: (vehicle: VehiclePosition | null) => void;
}

const STATUS_CONFIG = {
  active: {
    color: 'var(--color-success)',
    bgClass: 'bg-success',
    textClass: 'text-success',
    lightBgClass: 'bg-success/20',
    label: 'Đang chạy'
  },
  idle: {
    color: 'var(--color-warning)',
    bgClass: 'bg-warning',
    textClass: 'text-warning',
    lightBgClass: 'bg-warning/20',
    label: 'Chờ'
  },
  offline: {
    color: 'var(--color-text-dim)',
    bgClass: 'bg-text-dim',
    textClass: 'text-text-dim',
    lightBgClass: 'bg-text-dim/20',
    label: 'Offline'
  },
  maintenance: {
    color: 'var(--color-error)',
    bgClass: 'bg-error',
    textClass: 'text-error',
    lightBgClass: 'bg-error/20',
    label: 'Bảo trì'
  },
};

export default function LiveTrackingMap({
  vehicles,
  selectedVehicle,
  onVehicleSelect,
}: LiveTrackingMapProps) {
  const mapRef = useRef<any>(null);
  const [pitch, setPitch] = React.useState(0);
  const [mapStyle, setMapStyle] = React.useState('mapbox://styles/mapbox/streets-v12');
  const [showTraffic, setShowTraffic] = React.useState(false);

  const togglePitch = () => setPitch(p => p === 0 ? 60 : 0);
  const toggleStyle = () => setMapStyle(s => 
    s.includes('satellite') 
      ? 'mapbox://styles/mapbox/streets-v12' 
      : 'mapbox://styles/mapbox/satellite-streets-v12'
  );
  const toggleTraffic = () => setShowTraffic(t => !t);

  // Auto-center and resize on selected vehicle
  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      
      // Force resize to fill container growth
      map.resize();

      if (selectedVehicle) {
        // If it's the first time selecting, fly to it
        // If it's just a position update, ease to it
        map.easeTo({
          center: [selectedVehicle.longitude, selectedVehicle.latitude],
          zoom: 15,
          duration: 1000,
          essential: true
        });
      }
    }
  }, [selectedVehicle?.vehicleId, selectedVehicle?.latitude, selectedVehicle?.longitude]);

  // Resize when list changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.getMap().resize();
    }
  }, [vehicles.length]);
  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-background text-text-dim">
        <Activity size={40} className="text-primary" />
        <p className="font-semibold text-text m-0">Mapbox token chưa được cấu hình</p>
        <p className="text-[13px] m-0 text-center px-4">
          Thêm <code className="text-primary-light bg-surface-highest px-1.5 py-0.5 rounded text-xs font-mono">
            NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
          </code> vào file <strong>.env.local</strong>
        </p>
        
        {/* Simulated vehicle list as fallback */}
        <div className="mt-5 w-[90%] max-w-[400px] flex flex-col gap-2">
          {vehicles.map(v => {
            const config = STATUS_CONFIG[v.status];
            return (
              <div 
                key={v.vehicleId} 
                className="flex items-center gap-3 p-3 px-3.5 bg-surface rounded-lg border border-border cursor-pointer transition-colors hover:bg-surface-high border-l-[3px]"
                style={{ borderLeftColor: config.color }}
                onClick={() => onVehicleSelect(v)}
              >
                <Truck size={16} className={config.textClass} />
                <div className="flex-1 overflow-hidden">
                  <div className="text-text font-semibold text-[13px] truncate">{v.licensePlate}</div>
                  <div className="text-text-dim text-[12px] truncate">{v.driverName}</div>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${config.lightBgClass} ${config.textClass}`}>
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Calculate center from vehicles or default to HCMC
  const center = vehicles.length > 0
    ? {
      lng: vehicles.reduce((s, v) => s + v.longitude, 0) / vehicles.length,
      lat: vehicles.reduce((s, v) => s + v.latitude, 0) / vehicles.length,
    }
    : { lng: 106.660172, lat: 10.762622 };

  return (
    <div className="w-full h-full relative overflow-hidden bg-background">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: center.lng,
          latitude: center.lat,
          zoom: 12,
          pitch: pitch
        }}
        pitch={pitch}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />

        {/* Traffic Layer */}
        {showTraffic && (
          <Source id="traffic" type="vector" url="mapbox://mapbox.mapbox-traffic-v1">
            <Layer
              id="traffic-layer"
              type="line"
              source-layer="traffic"
              paint={{
                'line-color': [
                  'match',
                  ['get', 'congestion'],
                  'low', '#22c55e',
                  'moderate', '#f59e0b',
                  'heavy', '#ef4444',
                  'severe', '#7f1d1d',
                  '#6366f1'
                ],
                'line-width': 2,
                'line-opacity': 0.8
              }}
            />
          </Source>
        )}

        {vehicles.map(vehicle => (
          <React.Fragment key={vehicle.vehicleId}>
            <Marker
              longitude={vehicle.longitude}
              latitude={vehicle.latitude}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                onVehicleSelect(
                  selectedVehicle?.vehicleId === vehicle.vehicleId ? null : vehicle
                );
              }}
            >
              <div
                title={`${vehicle.licensePlate} - ${vehicle.driverName}`}
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center cursor-pointer 
                  transition-all duration-200 shadow-lg border-[3px]
                  ${STATUS_CONFIG[vehicle.status].bgClass}
                  ${selectedVehicle?.vehicleId === vehicle.vehicleId ? 'scale-125 border-primary z-10' : 'scale-100 border-white'}
                `}
                style={{ 
                  boxShadow: `0 0 12px ${STATUS_CONFIG[vehicle.status].color}66`,
                  transform: `rotate(${vehicle.heading}deg)`
                }}
              >
                <Truck size={16} className="text-white" />
              </div>
            </Marker>

          </React.Fragment>
        ))}
      </Map>

      {/* Map Controls */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="flex gap-1.5 p-2 bg-surface/80 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl">
          <Button 
            variant={pitch > 0 ? "primary" : "secondary"} 
            size="sm" 
            onClick={togglePitch}
            className="h-8 text-[10px] font-bold px-3"
          >
            2D/3D
          </Button>
          <Button 
            variant={mapStyle.includes('satellite') ? "primary" : "secondary"} 
            size="sm" 
            onClick={toggleStyle}
            className="h-8 text-[10px] font-bold px-3"
          >
            Satellite
          </Button>
          <div className="w-px bg-white/10 my-1.5" />
          <Button 
            variant={showTraffic ? "primary" : "secondary"} 
            size="sm" 
            onClick={toggleTraffic}
            className="h-8 text-[10px] font-bold px-3"
          >
            Traffic
          </Button>
        </div>
      </div>
    </div>
  );
}

