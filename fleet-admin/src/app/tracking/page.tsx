"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// Hooks
import { useTracking } from "./hooks/useTracking";

// Components
import { TrackingHeader } from "./components/TrackingHeader";
import { TrackingStatsCards } from "./components/TrackingStatsCards";
import { AlertsPanel } from "./components/AlertsPanel";
import { VehicleList } from "./components/VehicleList";
import { VehicleDetail } from "./components/VehicleDetail";

// Types
import { VehiclePosition } from "./types";

// Dynamic import to avoid SSR issues with Mapbox
const LiveTrackingMap = dynamic(
  () => import("@/components/tracking/LiveTrackingMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-surface text-text-dim">
        <div className="w-8 h-8 border-3 border-border border-t-primary rounded-full animate-spin" />
        <span>Đang tải bản đồ...</span>
      </div>
    ),
  },
);

export default function LiveTrackingPage() {
  const { 
    vehicles, 
    alerts, 
    isConnected, 
    stats, 
    resolveAlert 
  } = useTracking();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "idle" | "offline" | "maintenance">("all");

  const filteredVehicles = vehicles.filter((v) =>
    filter === "all" ? true : v.status === filter,
  );

  const selectedVehicle = vehicles.find(v => v.vehicleId === selectedVehicleId) || null;

  return (
    <div className="h-full flex flex-col gap-4 p-4 lg:p-5 bg-background min-h-0 overflow-y-auto lg:overflow-hidden">
      <TrackingHeader 
        isConnected={isConnected}
        totalVehicles={stats.total}
        filter={filter}
        onFilterChange={setFilter}
        stats={stats}
      />

      <TrackingStatsCards stats={stats} />

      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_360px] gap-4 flex-1 lg:max-h-[75vh]">
        <div className="card overflow-hidden relative shadow-lg h-[400px] sm:h-[500px] lg:h-full">
          <LiveTrackingMap
            vehicles={filteredVehicles}
            selectedVehicle={selectedVehicle}
            onVehicleSelect={(v) => setSelectedVehicleId(v?.vehicleId || null)}
          />

          <VehicleDetail 
            vehicle={selectedVehicle}
            onClose={() => setSelectedVehicleId(null)}
          />
        </div>

        <div className="flex flex-col gap-4 overflow-hidden lg:h-[75vh]">
          <AlertsPanel 
            alerts={alerts}
            onResolve={resolveAlert}
          />

          <VehicleList 
            vehicles={filteredVehicles}
            selectedVehicleId={selectedVehicle?.vehicleId}
            onSelect={(v) => setSelectedVehicleId(v?.vehicleId || null)}
          />
        </div>
      </div>
    </div>
  );
}
