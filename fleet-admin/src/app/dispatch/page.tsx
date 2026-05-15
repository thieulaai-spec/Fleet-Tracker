'use client';

import React from 'react';
import { DispatchOrdersSidebar } from './components/DispatchOrdersSidebar';
import { DispatchVehiclesSidebar } from './components/DispatchVehiclesSidebar';
import { DispatchMapPanel } from './components/DispatchMapPanel';
import { useDispatchLogic } from './hooks/useDispatchLogic';

export default function DispatchPage() {
  const {
    pendingOrders,
    availableVehicles,
    isLoading,
    isAssigning,
    selectedOrder,
    selectedOrderData,
    selectedVehicle,
    clusterView,
    setClusterView,
    searchQuery,
    setSearchQuery,
    vehicleSearchQuery,
    setVehicleSearchQuery,
    suggestions,
    isSuggestLoading,
    clusterGroups,
    filteredVehicles,
    handleAssign,
    handleSelectOrder,
    handleSelectVehicle
  } = useDispatchLogic();

  return (
    <div className="grid grid-cols-[350px_1fr_350px] [@media(max-width:1400px)]:grid-cols-[300px_1fr_300px] h-[calc(100vh-var(--height-header)-var(--spacing-xl)*2)] gap-md p-md overflow-hidden relative">
      <DispatchOrdersSidebar
        pendingOrderCount={pendingOrders.length}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        selectedOrder={selectedOrder}
        onSelectOrder={handleSelectOrder}
        clusterView={clusterView}
        groups={clusterGroups}
      />

      <DispatchMapPanel
        clusterView={clusterView}
        onToggleClusterView={() => setClusterView((v) => !v)}
        selectedMarkerId={selectedOrder || selectedVehicle}
        orders={pendingOrders}
        vehicles={availableVehicles}
        selectedOrderData={selectedOrderData}
        suggestedVehicles={suggestions?.map((s) => s.vehicle) ?? []}
      />

      <DispatchVehiclesSidebar
        availableVehicles={filteredVehicles}
        searchQuery={vehicleSearchQuery}
        onSearchQueryChange={setVehicleSearchQuery}
        isLoading={isLoading}
        isAssigning={isAssigning}
        selectedOrder={selectedOrder}
        selectedOrderData={selectedOrderData}
        selectedVehicleId={selectedVehicle}
        onSelectVehicle={handleSelectVehicle}
        onAssignVehicle={handleAssign}
        suggestions={suggestions}
        isSuggestLoading={isSuggestLoading}
      />
    </div>
  );
}
