'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { Map, Marker, Popup, NavigationControl, FullscreenControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Truck, Activity } from 'lucide-react';

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
  status: 'active' | 'idle' | 'offline';
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
};

export default function LiveTrackingMap({
  vehicles,
  selectedVehicle,
  onVehicleSelect,
}: LiveTrackingMapProps) {
  const mapRef = useRef<any>(null);

  // Auto-center on selected vehicle
  useEffect(() => {
    if (selectedVehicle && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedVehicle.longitude, selectedVehicle.latitude],
        zoom: 15,
        duration: 1500,
        essential: true
      });
    }
  }, [selectedVehicle?.vehicleId]);
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
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />

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

            {selectedVehicle?.vehicleId === vehicle.vehicleId && (
              <Popup
                longitude={vehicle.longitude}
                latitude={vehicle.latitude}
                anchor="bottom"
                offset={24}
                closeButton={true}
                onClose={() => onVehicleSelect(null)}
                maxWidth="300px"
              >
                <div className="p-3 min-w-[200px] bg-surface-high text-text rounded-lg border border-border shadow-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck size={16} className={STATUS_CONFIG[vehicle.status].textClass} />
                    <strong className="text-sm font-bold truncate">{vehicle.licensePlate}</strong>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ml-auto ${STATUS_CONFIG[vehicle.status].lightBgClass} ${STATUS_CONFIG[vehicle.status].textClass}`}>
                      {STATUS_CONFIG[vehicle.status].label}
                    </span>
                  </div>
                  
                  <div className="text-[12px] text-text-muted space-y-1">
                    <div className="flex justify-between">
                      <span className="text-text-dim">Tài xế:</span>
                      <span className="font-medium text-text">{vehicle.driverName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-dim">Tốc độ:</span>
                      <span className="font-medium text-text">{vehicle.speed.toFixed(0)} km/h</span>
                    </div>
                    {vehicle.ordersCount !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-text-dim">Đơn hàng:</span>
                        <span className="font-medium text-text">{vehicle.ordersCount} đơn</span>
                      </div>
                    )}
                    {vehicle.currentTripId && (
                      <div className="flex justify-between">
                        <span className="text-text-dim">Mã chuyến:</span>
                        <span className="font-medium text-primary-light">#{vehicle.currentTripId.slice(0, 8)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            )}
          </React.Fragment>
        ))}
      </Map>
    </div>
  );
}
