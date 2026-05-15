"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useDispatch } from "@/hooks/use-dispatch";
import { useDispatchSuggest, useDispatchCluster } from "@/hooks/use-dispatch-suggest";
import { Vehicle, Order } from "@/types";
import { DispatchOrderGroup } from "../types";

export function useDispatchLogic() {
  const searchParams = useSearchParams();
  const { pendingOrders, availableVehicles, assignOrder, isLoading, isAssigning } = useDispatch();

  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [clusterView, setClusterView] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState("");

  const selectedOrderData = useMemo(
    () => pendingOrders.find((o) => o.id === selectedOrder) ?? null,
    [pendingOrders, selectedOrder],
  );

  const { data: suggestions, isLoading: isSuggestLoading } = useDispatchSuggest(
    selectedOrderData ? selectedOrder : null
  );

  const { data: clusterData } = useDispatchCluster(3);

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    const vehicleId = searchParams.get("vehicleId");

    if (orderId) {
      setSelectedOrder(orderId);
      setSelectedVehicle(null);
      setClusterView(false);
    } else if (vehicleId) {
      setSelectedVehicle(vehicleId);
      setSelectedOrder(null);
    }
  }, [searchParams]);

  const filteredPendingOrders = useMemo(() => {
    return pendingOrders.filter((order) =>
      [order.id, order.pickupAddress, order.deliveryAddress]
        .join(" ")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
    );
  }, [pendingOrders, searchQuery]);

  const filteredVehicles = useMemo(() => {
    return availableVehicles.filter((vehicle: Vehicle) =>
      [vehicle.id, vehicle.plateNumber, vehicle.type, vehicle.driver?.fullName]
        .join(" ")
        .toLowerCase()
        .includes(vehicleSearchQuery.toLowerCase()),
    );
  }, [availableVehicles, vehicleSearchQuery]);

  const clusterGroups = useMemo<DispatchOrderGroup[]>(() => {
    if (!clusterView) {
      return filteredPendingOrders.map((order) => ({
        key: order.id,
        label: `Order ${order.id.split("-")[0]}`,
        orders: [order],
        isClusterGroup: false,
      }));
    }

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

      const standalone = filteredPendingOrders.filter((o) => !assignedOrderIds.has(o.id));
      standalone.forEach((order) => {
        groups.push({
          key: order.id,
          label: `Order ${order.id.split("-")[0]}`,
          orders: [order],
          isClusterGroup: false,
        });
      });

      return groups;
    }

    const groups = new Map<string, typeof filteredPendingOrders>();
    filteredPendingOrders.forEach((order) => {
      const rawKey =
        order.pickupAddress.split(",").slice(-1)[0]?.trim() ||
        order.pickupAddress.split(" ").slice(0, 2).join(" ");
      const key = rawKey || "Cluster";
      groups.set(key, [...(groups.get(key) || []), order]);
    });

    return Array.from(groups.entries()).map(([key, orders]) => ({
      key,
      label: key,
      orders,
      isClusterGroup: orders.length > 1,
    }));
  }, [clusterView, filteredPendingOrders, clusterData]);

  const handleAssign = useCallback(async (vehicleId: string) => {
    if (!selectedOrder) return;
    await assignOrder({ orderId: selectedOrder, vehicleId });
    setSelectedOrder(null);
    setSelectedVehicle(null);
  }, [selectedOrder, assignOrder]);

  const handleSelectOrder = useCallback((id: string | null) => {
    setSelectedOrder(id);
    setSelectedVehicle(null);
  }, []);

  const handleSelectVehicle = useCallback((id: string | null) => {
    setSelectedVehicle(id);
    setSelectedOrder(null);
  }, []);

  return {
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
    filteredPendingOrders,
    filteredVehicles,
    clusterGroups,
    handleAssign,
    handleSelectOrder,
    handleSelectVehicle
  };
}
