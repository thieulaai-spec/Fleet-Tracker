'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { DispatchOrdersSidebar, DispatchOrderGroup } from './components/DispatchOrdersSidebar';
import { DispatchVehiclesSidebar } from './components/DispatchVehiclesSidebar';
import { DispatchMapPanel } from './components/DispatchMapPanel';
import { useDispatch } from '@/hooks/use-dispatch';
import { useDispatchSuggest, useDispatchCluster } from '@/hooks/use-dispatch-suggest';
import { Vehicle } from '@/types';

export default function DispatchPage() {
  const searchParams = useSearchParams();
  const { pendingOrders, availableVehicles, assignOrder, isLoading, isAssigning } = useDispatch();

  const [selectedOrder, setSelectedOrder] = React.useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = React.useState<string | null>(null);
  const [clusterView, setClusterView] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [vehicleSearchQuery, setVehicleSearchQuery] = React.useState('');

  // Object của đơn hàng đang được chọn — để truyền vào Sidebar kiểm tra tải trọng
  const selectedOrderData = React.useMemo(
    () => pendingOrders.find((o) => o.id === selectedOrder) ?? null,
    [pendingOrders, selectedOrder],
  );

  // ===== SPEC: A-06 — Smart vehicle suggestions (AC-DIS-01, TC-02) =====
  // Chỉ gọi API khi đã chọn đơn hàng và đơn hàng đó đang trong danh sách PENDING
  const { data: suggestions, isLoading: isSuggestLoading, error: suggestError } = useDispatchSuggest(
    selectedOrderData ? selectedOrder : null
  );

  // ===== SPEC: Module 4 — Gom đơn (Clustering within 3km radius) =====
  // Dùng API /dispatch/cluster thay thế string-split cũ
  const { data: clusterData } = useDispatchCluster(3);

  // Handle initial selection from URL params
  React.useEffect(() => {
    const orderId = searchParams.get('orderId');
    const vehicleId = searchParams.get('vehicleId');

    if (orderId) {
      setSelectedOrder(orderId);
      setSelectedVehicle(null);
      setClusterView(false);
    } else if (vehicleId) {
      setSelectedVehicle(vehicleId);
      setSelectedOrder(null);
    }
  }, [searchParams]);



  const filteredPendingOrders = React.useMemo(() => {
    return pendingOrders.filter((order) =>
      [order.id, order.pickupAddress, order.deliveryAddress]
        .join(' ')
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
    );
  }, [pendingOrders, searchQuery]);

  const filteredVehicles = React.useMemo(() => {
    return availableVehicles.filter((vehicle: Vehicle) =>
      [vehicle.id, vehicle.plateNumber, vehicle.type, vehicle.driver?.fullName]
        .join(' ')
        .toLowerCase()
        .includes(vehicleSearchQuery.toLowerCase()),
    );
  }, [availableVehicles, vehicleSearchQuery]);

  // ===== Cluster Groups =====
  // Ưu tiên dùng dữ liệu từ API /dispatch/cluster (PostGIS ST_DWithin 3km)
  // Fallback về string-grouping nếu API chưa sẵn sàng
  const clusterGroups = React.useMemo<DispatchOrderGroup[]>(() => {
    if (!clusterView) {
      return filteredPendingOrders.map((order) => ({
        key: order.id,
        label: `Order ${order.id.split('-')[0]}`,
        orders: [order],
        isClusterGroup: false,
      }));
    }

    // Dùng kết quả từ API nếu có
    if (clusterData?.clusters && clusterData.clusters.length > 0) {
      const groups: DispatchOrderGroup[] = [];
      const assignedOrderIds = new Set<string>();

      clusterData.clusters.forEach((cluster, idx) => {
        const clusterOrders = filteredPendingOrders.filter((o) =>
          cluster.orderIds.includes(o.id),
        );
        if (clusterOrders.length > 0) {
          clusterOrders.forEach((o) => assignedOrderIds.add(o.id));
          groups.push({
            key: `cluster-${idx}`,
            label: `Khu vực ${idx + 1} (${clusterOrders.length} đơn / 3km)`,
            orders: clusterOrders,
            isClusterGroup: clusterOrders.length > 1,
            centroid: cluster.centroid,
          });
        }
      });

      // Các đơn không nằm trong cluster nào → nhóm riêng
      const standalone = filteredPendingOrders.filter((o) => !assignedOrderIds.has(o.id));
      standalone.forEach((order) => {
        groups.push({
          key: order.id,
          label: `Order ${order.id.split('-')[0]}`,
          orders: [order],
          isClusterGroup: false,
        });
      });

      return groups;
    }

    // Fallback: grouping theo địa chỉ (giữ lại để không bị lỗi khi API chưa sẵn)
    const groups = new Map<string, typeof filteredPendingOrders>();
    filteredPendingOrders.forEach((order) => {
      const rawKey =
        order.pickupAddress.split(',').slice(-1)[0]?.trim() ||
        order.pickupAddress.split(' ').slice(0, 2).join(' ');
      const key = rawKey || 'Cluster';
      groups.set(key, [...(groups.get(key) || []), order]);
    });

    return Array.from(groups.entries()).map(([key, orders]) => ({
      key,
      label: key,
      orders,
      isClusterGroup: orders.length > 1,
    }));
  }, [clusterView, filteredPendingOrders, clusterData]);

  // ===== Handlers =====
  const handleAssign = async (vehicleId: string) => {
    if (!selectedOrder) return;
    await assignOrder({ orderId: selectedOrder, vehicleId });
    setSelectedOrder(null);
    setSelectedVehicle(null);
  };

  // Xe đang được chọn để hiển thị trên map (có thể là suggestion đầu tiên)
  const mapSelectedVehicleId = selectedVehicle || (suggestions?.[0]?.vehicle?.id ?? null);

  return (
    <div className="grid grid-cols-[350px_1fr_350px] [@media(max-width:1400px)]:grid-cols-[300px_1fr_300px] h-[calc(100vh-var(--height-header)-var(--spacing-xl)*2)] gap-md p-md overflow-hidden relative">
      <DispatchOrdersSidebar
        pendingOrderCount={pendingOrders.length}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        selectedOrder={selectedOrder}
        onSelectOrder={(id) => {
          setSelectedOrder(id);
          setSelectedVehicle(null);
        }}
        clusterView={clusterView}
        groups={clusterGroups}
      />

      <DispatchMapPanel
        clusterView={clusterView}
        onToggleClusterView={() => setClusterView((v) => !v)}
        selectedMarkerId={selectedOrder || selectedVehicle}
        orders={pendingOrders}
        vehicles={availableVehicles}
        // Khi chọn đơn hàng + có suggestions → vẽ line route từ xe gợi ý đến pickup
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
        onSelectVehicle={(id) => {
          setSelectedVehicle(id);
          setSelectedOrder(null);
        }}
        onAssignVehicle={handleAssign}
        suggestions={suggestions}
        isSuggestLoading={isSuggestLoading}
      />
    </div>
  );
}
