import { MapBox } from '@/components/ui/MapBox';
import type { MapMarker, MapLine } from '@/components/ui/MapBox';
import { Button } from '@/components/ui/Button';
import { 
  Truck, 
  Package, 
  Users 
} from 'lucide-react';
import { Order, Vehicle } from '@/types';
import React from 'react';

interface DispatchMapPanelProps {
  clusterView: boolean;
  onToggleClusterView: () => void;
  selectedMarkerId?: string | null;
  orders: Order[];
  vehicles: Vehicle[];
  // Dữ liệu để vẽ route line khi có suggestion
  selectedOrderData?: Order | null;
  suggestedVehicles?: Vehicle[];
}

/** Lấy tọa độ [lng, lat] từ GeoPoint hoặc GeoJSON coordinates */
function getCoords(loc: unknown, fallback: [number, number]): [number, number] {
  if (!loc) return fallback;
  const l = loc as Record<string, unknown>;
  // GeoJSON format: { type: 'Point', coordinates: [lng, lat] }
  if (Array.isArray(l.coordinates)) {
    const [lng, lat] = l.coordinates as number[];
    if (typeof lat === 'number' && typeof lng === 'number') return [lng, lat];
  }
  // Simple { lat, lng } format
  if (typeof l.lat === 'number' && typeof l.lng === 'number') {
    return [l.lng as number, l.lat as number];
  }
  return fallback;
}

export function DispatchMapPanel({ 
  clusterView, 
  onToggleClusterView,
  selectedMarkerId,
  orders,
  vehicles,
  selectedOrderData,
  suggestedVehicles = [],
}: DispatchMapPanelProps) {
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
  
  // ===== Vehicle markers =====
  const vehicleMarkers: MapMarker[] = vehicles.map(v => {
    const [lng, lat] = getCoords(v.lastKnownLocation, [105.83, 21.02]);
    const isSuggested = suggestedVehicles.some(sv => sv.id === v.id);
    return {
      id: v.id,
      lat,
      lng,
      label: v.plateNumber,
      color: isSuggested ? 'var(--color-success)' : 'var(--color-primary-light)',
      icon: <Truck size={18} />,
    };
  });

  // ===== Order markers =====
  const orderMarkers: MapMarker[] = orders.map(o => {
    const [lng, lat] = getCoords(o.pickupLocation, [105.86, 21.04]);
    const isSelected = selectedMarkerId === o.id;
    return {
      id: o.id,
      lat,
      lng,
      label: `Order ${o.id.split('-')[0]}`,
      color: isSelected ? 'var(--color-primary)' : 'var(--color-warning)',
      icon: <Package size={18} />,
    };
  });

  // ===== Route lines: vẽ đường từ top-3 xe gợi ý → điểm pickup của đơn hàng =====
  // SPEC: Khi chọn đơn hàng, hiển thị các xe phù hợp trên map (visual feedback)
  const routeLines: MapLine[] = [];
  if (selectedOrderData) {
    const [orderLng, orderLat] = getCoords(selectedOrderData.pickupLocation, [105.86, 21.04]);
    suggestedVehicles.slice(0, 3).forEach((vehicle, idx) => {
      const [vLng, vLat] = getCoords(vehicle.lastKnownLocation, [105.83, 21.02]);
      routeLines.push({
        id: `route-${vehicle.id}`,
        from: { lat: vLat, lng: vLng },
        to: { lat: orderLat, lng: orderLng },
        // Xe gợi ý đầu tiên → đường sáng hơn
        color: idx === 0 ? 'var(--color-success)' : 'rgba(99,102,241,0.4)',
        width: idx === 0 ? 3 : 1.5,
        dashed: idx > 0,
      });
    });
  }

  const allMarkers = [...vehicleMarkers, ...orderMarkers];

  return (
    <main className="relative bg-background rounded-md overflow-hidden border border-border h-full min-h-[500px]">
      <div className="w-full h-full relative">
        <div className="absolute top-lg left-lg right-lg z-10 flex flex-col gap-sm">
          {/* Legend khi đang trong Smart Suggest mode */}
          {selectedOrderData && suggestedVehicles.length > 0 && (
            <div className="flex gap-md p-sm px-md w-fit glass rounded-md text-xs text-text-dim animate-in fade-in slide-in-from-top-1 duration-200 shadow-lg">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-none bg-success" />
                <span>Xe gợi ý (gần nhất)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-none bg-warning" />
                <span>Điểm lấy hàng</span>
              </div>
            </div>
          )}
        </div>

        <div className="absolute inset-0 z-1">
          <MapBox 
            markers={allMarkers}
            lines={routeLines}
            zoom={13} 
            selectedMarkerId={selectedMarkerId} 
            showSearch={true}
            pitch={pitch}
            mapStyle={mapStyle}
            showTraffic={showTraffic}
          />
        </div>

        <div className="absolute bottom-lg right-lg z-10">
          <div className="flex gap-sm p-md glass rounded-md shadow-lg">
            <Button variant="secondary" size="sm" icon={<Users size={14} />} onClick={onToggleClusterView}>
              {clusterView ? 'Cluster View' : 'List View'}
            </Button>
            <div className="w-px bg-border my-xs" />
            <Button 
              variant={pitch > 0 ? "primary" : "secondary"} 
              size="sm" 
              onClick={togglePitch}
            >
              2D/3D
            </Button>
            <Button 
              variant={mapStyle.includes('satellite') ? "primary" : "secondary"} 
              size="sm" 
              onClick={toggleStyle}
            >
              Satellite
            </Button>
            <div className="w-px bg-border my-xs" />
            <Button 
              variant={showTraffic ? "primary" : "secondary"} 
              size="sm" 
              onClick={toggleTraffic}
            >
              Traffic
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
