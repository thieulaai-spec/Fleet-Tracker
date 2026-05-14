'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { Map, Marker, Source, Layer, NavigationControl, FullscreenControl } from 'react-map-gl/mapbox';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, AlertTriangle, Search, X, Loader2 } from 'lucide-react';

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
  onClick?: (coord: Coordinate) => void;
  showSearch?: boolean;
  onSearchSelect?: (coord: Coordinate, address: string) => void;
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
  className = "",
  onClick,
  showSearch = false,
  onSearchSelect
}: MapBoxProps) {
  const mapRef = React.useRef<any>(null);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [viewState, setViewState] = useState({
    latitude: 21.0285,
    longitude: 105.8542,
    zoom: zoom
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

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

  const handleMapClick = (evt: any) => {
    if (onClick) {
      onClick({
        lat: evt.lngLat.lat,
        lng: evt.lngLat.lng
      });
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=5`
      );
      const data = await response.json();
      setSearchResults(data.features || []);
      setShowResults(true);
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (feature: any) => {
    const [lng, lat] = feature.center;
    const address = feature.place_name;

    setViewState(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      zoom: 15
    }));

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 15,
        essential: true
      });
    }

    if (onSearchSelect) {
      onSearchSelect({ lat, lng }, address);
    }

    setSearchQuery(address);
    setShowResults(false);
  };

  return (
    <div className={`relative w-full h-full min-h-[300px] rounded-inherit overflow-hidden bg-[#0f172a] ${className}`}>
      <Map
        {...viewState}
        ref={mapRef}
        onMove={evt => setViewState(evt.viewState)}
        onClick={handleMapClick}
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
            <div className={`flex flex-col items-center cursor-pointer ${selectedMarkerId === marker.id ? 'is-selected' : ''}`}>
              {marker.label && (
                <div className="bg-[#0f172a]/95 text-white text-[10px] font-medium px-2 py-0.5 rounded border border-white/10 mb-1 whitespace-nowrap shadow-[0_4px_12px_rgba(0,0,0,0.5)] pointer-events-none">
                  {marker.label}
                </div>
              )}
              <div className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-transform duration-200 hover:scale-110" style={{ color: resolveColor(marker.color) }}>
                {marker.icon || <MapPin size={selectedMarkerId === marker.id ? 32 : 24} fill="currentColor" stroke="white" strokeWidth={1} />}
              </div>
            </div>
          </Marker>
        ))}
      </Map>

      {showSearch && (
        <div className="absolute top-3 left-3 z-10 w-[320px] max-w-[calc(100%-24px)]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-[10px] p-[8px_12px] bg-[#0f172a]/90 backdrop-blur-sm border border-white/10 rounded-lg text-white shadow-md">
              {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              <input 
                type="text" 
                placeholder="Search address or place..." 
                value={searchQuery}
                className="flex-1 bg-transparent border-none text-white text-sm outline-none placeholder:text-white/50"
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery.length >= 3 && setShowResults(true)}
              />
              {searchQuery && (
                <button 
                  className="bg-transparent border-none text-white/50 cursor-pointer flex items-center hover:text-white"
                  onClick={() => { setSearchQuery(''); setSearchResults([]); setShowResults(false); }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {showResults && searchResults.length > 0 && (
              <ul className="list-none p-1 m-0 bg-[#0f172a]/95 backdrop-blur-md border border-white/10 rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.4)] max-h-[200px] overflow-y-auto">
                {searchResults.map((result: any) => (
                  <li 
                    key={result.id} 
                    onClick={() => selectSearchResult(result)}
                    className="flex items-start gap-[10px] p-[8px_12px] text-white/80 text-[13px] cursor-pointer rounded-md transition-all duration-200 hover:bg-primary/30 hover:text-white"
                  >
                    <MapPin size={14} />
                    <span>{result.place_name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {!webGLSupported && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0f172a]/80 backdrop-blur-xs z-100">
          <div className="text-center p-6 bg-surface border border-danger rounded-xl text-white">
            <AlertTriangle color="var(--color-danger)" size={32} />
            <h3 className="text-danger font-bold mb-2">WebGL Not Supported</h3>
            <p>Your browser or hardware does not support WebGL, which is required for the map.</p>
          </div>
        </div>
      )}

      {!MAPBOX_TOKEN && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0f172a]/80 backdrop-blur-xs z-100">
          <div className="text-center p-6 bg-surface border border-danger rounded-xl text-white">
            <h3 className="text-danger font-bold mb-2">Mapbox Token Missing</h3>
            <p>Please provide NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in .env.local</p>
          </div>
        </div>
      )}

    </div>
  );
}
