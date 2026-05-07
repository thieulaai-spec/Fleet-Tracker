'use client';

import React from 'react';
import { Package, Truck, Users, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DispatchMapPanelProps {
  clusterView: boolean;
  onToggleClusterView: () => void;
}

export function DispatchMapPanel({ clusterView, onToggleClusterView }: DispatchMapPanelProps) {
  return (
    <main className="dispatch-map-area">
      <div className="map-placeholder">
        <div className="map-overlay-top">
          <div className="map-search card">
            <Navigation size={18} />
            <input type="text" placeholder="Search map location..." />
          </div>
        </div>

        <div className="mock-map">
          <div className="map-pin vehicle-pin" style={{ top: '30%', left: '40%' }}>
            <Truck size={20} />
            <div className="pin-label">VN-102</div>
          </div>
          <div className="map-pin order-pin" style={{ top: '50%', left: '60%' }}>
            <Package size={20} />
            <div className="pin-label">ORD-8289</div>
          </div>
          <div className="map-grid-pattern" />
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

        .map-placeholder {
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

        .mock-map {
          flex: 1;
          position: relative;
          background: radial-gradient(circle, #1a1a1a 1px, transparent 1px);
          background-size: 30px 30px;
        }

        .map-pin {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          animation: pulse-glow 2s infinite;
        }

        .vehicle-pin { color: var(--color-primary-light); }
        .order-pin { color: var(--color-warning); }

        .pin-label {
          background: rgba(0, 0, 0, 0.8);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          color: white;
          white-space: nowrap;
        }

        @keyframes pulse-glow {
          0% { filter: drop-shadow(0 0 2px currentColor); }
          50% { filter: drop-shadow(0 0 10px currentColor); }
          100% { filter: drop-shadow(0 0 2px currentColor); }
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
