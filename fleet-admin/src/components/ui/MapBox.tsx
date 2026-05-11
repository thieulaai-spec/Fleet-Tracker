'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { Map, Marker, Source, Layer, NavigationControl, FullscreenControl } from 'react-map-gl/mapbox';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, AlertTriangle } from 'lucide-react';

// Mapbox token from environment variables
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

interface Coordinate {
  lat: number;
  lng: number;
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  color?: string;
  icon?: React.ReactNode;
}

export interface MapLine {
  id: string;
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  color?: string;
  width?: number;
  dashed?: boolean;
}

interface MapBoxProps {
  path?: Coordinate[];
  markers?: MapMarker[];
  lines?: MapLine[];
  zoom?: number;
  selectedMarkerId?: string | null;
  className?: string;
}

/**
 * Resolves CSS variables like var(--color-primary) to their hex values.
 * Mapbox paint properties do not support CSS variables.
 */
function resolveColor(color: string | undefined): string {
  if (!color) return '#6366f1';
  if (!color.startsWith('var(')) return color;

  // Mapping of common project CSS variables to their hex values
  const colorMap: Record<string, string> = {
    '--color-primary': '#6366f1',
    '--color-primary-light': '#c0c1ff',
    '--color-success': '#22c55e',
    '--color-warning': '#f59e0b',
    '--color-danger': '#ef4444',
    '--color-secondary': '#0ea5e9',
    '--color-tertiary': '#10b981',
  };

  const variableName = color.match(/var\(([^)]+)\)/)?.[1];
  return variableName ? colorMap[variableName] || '#6366f1' : color;
}

/**
 * Interactive MapBox Component
 * Uses react-map-gl for real-time fleet tracking and trip visualization.
 */
export function MapBox({ 
  path = [], 
  markers = [], 
  lines = [],
  zoom = 12, 
  selectedMarkerId = null,
  className = "" 
}: MapBoxProps) {
  const mapRef = React.useRef<any>(null);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [viewState, setViewState] = useState({
    latitude: 21.0285,
    longitude: 105.8542,
    zoom: zoom
  });

  useEffect(() => {
    console.log('MapBox Initialized. Token:', MAPBOX_TOKEN ? 'Present (Starts with ' + MAPBOX_TOKEN.substring(0, 10) + '...)' : 'Missing');
    console.log('Markers count:', markers.length);
    
    if (!mapboxgl.supported()) {
      console.error('WebGL not supported by browser');
      setWebGLSupported(false);
    }
  }, []);

  // Update initial view state when markers or path change for the first time
  useEffect(() => {
    if (markers.length > 0) {
      setViewState(prev => ({
        ...prev,
        latitude: markers[0].lat,
        longitude: markers[0].lng
      }));
    } else if (path.length > 0) {
      setViewState(prev => ({
        ...prev,
        latitude: path[0].lat,
        longitude: path[0].lng
      }));
    }
  }, [markers.length > 0, path.length > 0]); // Trigger when data arrives

  // Fly to selected marker
  useEffect(() => {
    if (selectedMarkerId && mapRef.current) {
      const selectedMarker = markers.find(m => m.id === selectedMarkerId);
      if (selectedMarker) {
        mapRef.current.flyTo({
          center: [selectedMarker.lng, selectedMarker.lat],
          zoom: Math.max(viewState.zoom, 14),
          duration: 2000,
          essential: true
        });
      }
    }
  }, [selectedMarkerId]);

  // Create GeoJSON for path rendering
  const routeData: any = useMemo(() => {
    if (path.length < 2) return null;
    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: path.map(p => [p.lng, p.lat])
      }
    };
  }, [path]);

  return (
    <div className={`map-wrapper ${className}`}>
      <Map
        {...viewState}
        ref={mapRef}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapLib={mapboxgl}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />

        {/* Path Layer (trip route) */}
        {routeData && (
          <Source id="trip-route" type="geojson" data={routeData}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                'line-color': '#6366f1',
                'line-width': 4,
                'line-opacity': 0.8
              }}
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
            />
          </Source>
        )}

        {/* Dispatch suggestion route lines (vehicle → order pickup) */}
        {lines.map((line) => {
          const geojson: any = {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [line.from.lng, line.from.lat],
                [line.to.lng, line.to.lat],
              ],
            },
          };
          const dashArray = line.dashed ? [4, 3] : [1];
          return (
            <Source key={line.id} id={line.id} type="geojson" data={geojson}>
              <Layer
                id={`line-${line.id}`}
                type="line"
                paint={{
                  'line-color': resolveColor(line.color),
                  'line-width': line.width ?? 2,
                  'line-opacity': 0.75,
                  'line-dasharray': dashArray,
                }}
                layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              />
            </Source>
          );
        })}

        {/* Markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            latitude={marker.lat}
            longitude={marker.lng}
            anchor="bottom"
          >
            <div className={`custom-marker ${selectedMarkerId === marker.id ? 'is-selected' : ''}`}>
              {marker.label && (
                <div className="marker-tooltip">
                  {marker.label}
                </div>
              )}
              <div className="marker-icon" style={{ color: resolveColor(marker.color) }}>
                {marker.icon || <MapPin size={selectedMarkerId === marker.id ? 32 : 24} fill="currentColor" stroke="white" strokeWidth={1} />}
              </div>
            </div>
          </Marker>
        ))}
      </Map>

      {!webGLSupported && (
        <div className="token-error">
          <div className="error-content">
            <AlertTriangle color="var(--color-danger)" size={32} />
            <h3>WebGL Not Supported</h3>
            <p>Your browser or hardware does not support WebGL, which is required for the map.</p>
          </div>
        </div>
      )}

      {!MAPBOX_TOKEN && (
        <div className="token-error">
          <div className="error-content">
            <h3>Mapbox Token Missing</h3>
            <p>Please provide NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in .env.local</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .map-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 300px;
          border-radius: inherit;
          overflow: hidden;
          background: #0f172a;
        }

        .custom-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
        }

        .marker-tooltip {
          background: rgba(15, 23, 42, 0.95);
          color: white;
          font-size: 10px;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 4px;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
          pointer-events: none;
        }

        .marker-icon {
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
          transition: transform 0.2s ease;
        }

        .marker-icon:hover {
          transform: scale(1.1);
        }

        .token-error {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(4px);
          z-index: 100;
        }

        .error-content {
          text-align: center;
          padding: 24px;
          background: var(--color-surface);
          border: 1px solid var(--color-danger);
          border-radius: 12px;
          color: white;
        }

        .error-content h3 {
          color: var(--color-danger);
          margin-bottom: 8px;
        }

        .error-content p {
          color: var(--color-text-dim);
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
