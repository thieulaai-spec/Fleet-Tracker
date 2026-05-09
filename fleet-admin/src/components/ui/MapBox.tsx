'use client';

import React from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl, MapRef, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  icon: React.ReactNode;
  label?: string;
  color?: string;
  metadata?: {
    plateNumber?: string;
    driverName?: string;
    speed?: number;
    status?: string;
    tripId?: string;
  };
  onClick?: () => void;
}

interface MapBoxProps {
  markers?: MapMarker[];
  path?: { lat: number; lng: number }[];
  geofence?: { lat: number; lng: number }[]; // Corridor geofence
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  followVehicle?: boolean;
}

export function MapBox({ 
  markers = [], 
  path = [],
  geofence = [],
  center = { lat: 21.0285, lng: 105.8542 }, // Default to Hanoi
  zoom = 12,
  className = '',
  followVehicle = false
}: MapBoxProps) {
  const mapRef = React.useRef<MapRef>(null);

  const [viewState, setViewState] = React.useState({
    longitude: center.lng,
    latitude: center.lat,
    zoom: zoom
  });

  const [popupInfo, setPopupInfo] = React.useState<MapMarker | null>(null);

  // Update viewState when center changes, but only if followVehicle is enabled
  React.useEffect(() => {
    if (followVehicle) {
      setViewState(prev => ({
        ...prev,
        longitude: center.lng,
        latitude: center.lat,
      }));
    }
  }, [center.lat, center.lng, followVehicle]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="mapbox-error">
        <div className="error-content">
          <p className="error-title">Mapbox Token Missing</p>
          <p className="error-desc">Please configure NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in .env.local</p>
        </div>
        <style jsx>{`
          .mapbox-error {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            background: #0f172a;
            color: white;
            padding: 1rem;
            text-align: center;
          }
          .error-title {
            color: #f87171;
            font-weight: bold;
            margin-bottom: 0.5rem;
          }
          .error-desc {
            font-size: 0.875rem;
            opacity: 0.7;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`map-wrapper ${className}`}>
      <Map
        {...viewState}
        ref={mapRef}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={false}
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />
        <ScaleControl />

        {path.length > 1 && (
          <Source
            id="route"
            type="geojson"
            data={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: path.map(p => [p.lng, p.lat])
              }
            }}
          >
            <Layer
              id="route-line"
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
              paint={{
                'line-color': '#3b82f6',
                'line-width': 4,
                'line-opacity': 0.6
              }}
            />
          </Source>
        )}

        {geofence && geofence.length > 1 && (
          <Source
            id="geofence"
            type="geojson"
            data={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: geofence.map(p => [p.lng, p.lat])
              }
            }}
          >
            {/* Outline */}
            <Layer
              id="geofence-outline"
              type="line"
              paint={{
                'line-color': '#f43f5e',
                'line-width': 2,
                'line-dasharray': [2, 2]
              }}
            />
            {/* Buffer area */}
            <Layer
              id="geofence-buffer"
              type="line"
              paint={{
                'line-color': '#f43f5e',
                'line-width': [
                  'interpolate',
                  ['exponential', 2],
                  ['zoom'],
                  10, 5,
                  14, 40,
                  18, 500
                ],
                'line-opacity': 0.1
              }}
            />
          </Source>
        )}

        {markers.map((marker) => {
          // Guard against invalid coordinates
          if (isNaN(marker.lng) || isNaN(marker.lat)) {
            console.warn(`Skipping marker ${marker.id} due to invalid coordinates: (${marker.lng}, ${marker.lat})`);
            return null;
          }
          
          return (
            <Marker
              key={marker.id}
              longitude={marker.lng}
              latitude={marker.lat}
              anchor="bottom"
              onClick={e => {
                e.originalEvent.stopPropagation();
                setPopupInfo(marker);
                marker.onClick?.();
              }}
            >
              <div className="custom-marker group">
                {marker.label && (
                  <div className="marker-label">
                    {marker.label}
                  </div>
                )}
                <div 
                  className="marker-icon"
                  style={{ borderColor: marker.color || 'var(--color-primary)' }}
                >
                  {marker.icon}
                </div>
                <div 
                  className="marker-tip"
                  style={{ borderTopColor: marker.color || 'var(--color-primary)' }}
                />
              </div>
            </Marker>
          );
        })}

        {popupInfo && (
          <Popup
            anchor="top"
            longitude={popupInfo.lng}
            latitude={popupInfo.lat}
            onClose={() => setPopupInfo(null)}
            closeButton={false}
            maxWidth="240px"
            className="custom-popup"
          >
            <div className="p-2 bg-slate-900 text-slate-100 rounded-lg shadow-xl border border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-blue-400 uppercase">{popupInfo.metadata?.plateNumber}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                  popupInfo.metadata?.status === 'delivering' ? 'bg-blue-500/20 text-blue-400' : 
                  popupInfo.metadata?.status === 'available' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                }`}>
                  {popupInfo.metadata?.status}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Driver</span>
                  <span className="font-medium text-slate-200">{popupInfo.metadata?.driverName || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Speed</span>
                  <span className={`font-bold ${
                    (popupInfo.metadata?.speed || 0) > 80 ? 'text-rose-500' : 
                    (popupInfo.metadata?.speed || 0) > 60 ? 'text-amber-500' : 'text-emerald-500'
                  }`}>
                    {Math.round(popupInfo.metadata?.speed || 0)} km/h
                  </span>
                </div>
                {popupInfo.metadata?.tripId && (
                  <div className="pt-1 border-t border-slate-800 text-[9px] text-slate-500 italic">
                    Trip: #{popupInfo.metadata.tripId.slice(-8)}
                  </div>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>

      <style jsx>{`
        .map-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        .custom-marker {
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .marker-label {
          margin-bottom: 4px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .custom-marker:hover .marker-label {
          opacity: 1;
        }
        .marker-icon {
          padding: 6px;
          border-radius: 9999px;
          background: rgba(0, 0, 0, 0.5);
          border: 2px solid;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .custom-marker:hover .marker-icon {
          transform: scale(1.1);
        }
        .marker-tip {
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 6px solid;
        }
      `}</style>
      <style jsx global>{`
        .mapboxgl-ctrl-group {
          background-color: rgba(18, 33, 49, 0.9) !important;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .mapboxgl-ctrl-group button {
          border-color: rgba(255, 255, 255, 0.1) !important;
        }
        .mapboxgl-ctrl-group button span {
          filter: invert(1);
        }
      `}</style>
    </div>
  );
}
