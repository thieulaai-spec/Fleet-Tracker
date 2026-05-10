'use client';

import React from 'react';
import { MapPin, Navigation } from 'lucide-react';

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

interface MapBoxProps {
  path?: Coordinate[];
  markers?: MapMarker[];
  zoom?: number;
  className?: string;
}

/**
 * MapBox Placeholder Component
 * This is a visual placeholder for the interactive map.
 * In a production environment, this would use react-map-gl or leaflet.
 */
export function MapBox({ 
  path = [], 
  markers = [], 
  zoom = 12, 
  className = "" 
}: MapBoxProps) {
  return (
    <div className={`map-container ${className}`}>
      <div className="map-grid-overlay" />
      
      {/* Simulate a path */}
      <svg className="path-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points="20,80 40,60 60,70 80,20"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="0.5"
          strokeDasharray="2,1"
          className="animated-path"
        />
      </svg>

      {/* Markers */}
      <div className="marker marker-start" style={{ left: '20%', top: '80%' }}>
        <div className="marker-dot" style={{ background: 'var(--color-primary)' }} />
        <div className="marker-label">Start</div>
      </div>
      
      <div className="marker marker-end" style={{ left: '80%', top: '20%' }}>
        <div className="marker-dot" style={{ background: 'var(--color-danger)' }} />
        <div className="marker-label">End</div>
      </div>

      <div className="map-controls">
        <div className="control-btn">+</div>
        <div className="control-btn">-</div>
      </div>

      <div className="map-status">
        <Navigation size={12} className="text-primary animate-pulse" />
        <span>Live Preview Mode</span>
      </div>

      <style jsx>{`
        .map-container {
          position: relative;
          background: #0f172a;
          background-image: 
            linear-gradient(rgba(30, 41, 59, 0.5) 1px, transparent 1px),
            linear-gradient(90px, rgba(30, 41, 59, 0.5) 1px, transparent 1px);
          background-size: 20px 20px;
          min-height: 300px;
          width: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: inherit;
        }

        .map-grid-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, transparent 0%, rgba(15, 23, 42, 0.8) 100%);
          pointer-events: none;
        }

        .path-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0.6;
        }

        .animated-path {
          stroke-dashoffset: 100;
          animation: dash 20s linear infinite;
        }

        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }

        .marker {
          position: absolute;
          transform: translate(-50%, -100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          z-index: 10;
        }

        .marker-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
        }

        .marker-label {
          font-size: 10px;
          color: white;
          background: rgba(15, 23, 42, 0.8);
          padding: 2px 6px;
          border-radius: 4px;
          white-space: nowrap;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .map-controls {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .control-btn {
          width: 24px;
          height: 24px;
          background: rgba(30, 41, 59, 0.9);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }

        .map-status {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: rgba(15, 23, 42, 0.9);
          padding: 4px 8px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #94a3b8;
          border: 1px solid rgba(255,255,255,0.1);
        }
      `}</style>
    </div>
  );
}
