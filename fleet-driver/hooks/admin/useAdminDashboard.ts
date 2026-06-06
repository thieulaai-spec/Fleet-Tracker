import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useDashboardStore } from '../../store/useDashboardStore';
import { socketService } from '../../lib/socket';
import Toast from 'react-native-toast-message';

export const useAdminDashboard = () => {
  const { stats, vehicles, orders, alerts, trips, isLoading, fetchStats, clockOffset } = useDashboardStore();
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'order' | 'trip' | 'alert'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [localActivities, setLocalActivities] = useState<any[]>([]);
  const [activeKpiDetail, setActiveKpiDetail] = useState<'vehicles' | 'orders' | 'trips' | 'alerts' | null>(null);
  const [detailSearchQuery, setDetailSearchQuery] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const timeAgo = useCallback((dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }, []);

  const safeDate = useCallback((dStr: any) => {
    if (!dStr) return null;
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return null;

    const now = new Date();
    const adjustedDate = new Date(d.getTime() - clockOffset);
    return adjustedDate > now ? now : adjustedDate;
  }, [clockOffset]);

  const allActivities = useMemo(() => {
    const items: any[] = [];

    // 1. Orders
    if (Array.isArray(orders)) {
      orders.forEach((order: any) => {
        if (!order.status || order.status === 'pending') {
          const createdDate = safeDate(order.createdAt);
          if (createdDate) {
            items.push({
              id: `order-status-${order.id}-pending`,
              type: 'order',
              title: 'Order Created',
              description: `ORD-${order.id.substring(0, 4)} created to ${order.deliveryAddress}`,
              timestamp: createdDate,
              status: 'pending',
            });
          }
        } else {
          const updatedDate = safeDate(order.updatedAt) || safeDate(order.createdAt);
          if (updatedDate) {
            let actionWord = 'updated';
            if (order.status === 'assigned') actionWord = 'assigned to driver';
            else if (order.status === 'picked_up') actionWord = 'picked up cargo';
            else if (order.status === 'delivering') actionWord = 'departed for delivery';
            else if (order.status === 'delivered') actionWord = 'successfully delivered';
            else if (order.status === 'failed') actionWord = 'failed delivery';
            else if (order.status === 'cancelled') actionWord = 'cancelled';

            items.push({
              id: `order-status-${order.id}-${order.status}`,
              type: 'order',
              title: `Order ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`,
              description: `ORD-${order.id.substring(0, 4)} ${actionWord}`,
              timestamp: updatedDate,
              status: order.status,
            });
          }
        }
      });
    }

    // 2. Alerts
    if (Array.isArray(alerts)) {
      alerts.forEach((alert: any) => {
        const isSOS = alert.type === 'SOS' || alert.type === 'incident' || alert.severity === 'critical';
        if (alert.type !== 'abnormal_stop' && !isSOS) return;

        const createdDate = safeDate(alert.createdAt);
        if (createdDate) {
          items.push({
            id: `alert-${alert.id}`,
            type: 'alert',
            title: alert.type?.replace('_', ' ')?.toUpperCase() || 'ALERT',
            description: `${alert.message} (${alert.vehicle?.plateNumber || 'Unknown Vehicle'})`,
            timestamp: createdDate,
            severity: alert.severity,
          });
        }
      });
    }

    // 3. Trips
    if (Array.isArray(trips)) {
      trips.forEach((trip: any) => {
        const createdDate = safeDate(trip.createdAt);
        const updatedDate = safeDate(trip.updatedAt) || createdDate;
        const startDate = safeDate(trip.startedAt);
        const endDate = safeDate(trip.completedAt);

        if (trip.status === 'pending' && createdDate) {
          items.push({
            id: `trip-status-${trip.id}-pending`,
            type: 'trip',
            title: 'Trip Dispatched',
            description: `New trip assigned to ${trip.driver?.fullName || 'Driver'} on vehicle ${trip.vehicle?.plateNumber || ''}`,
            timestamp: createdDate,
            status: 'pending',
          });
        } else if (trip.status === 'accepted' && updatedDate) {
          items.push({
            id: `trip-status-${trip.id}-accepted`,
            type: 'trip',
            title: 'Trip Accepted',
            description: `Driver ${trip.driver?.fullName || 'Driver'} accepted the assigned trip.`,
            timestamp: updatedDate,
            status: 'accepted',
          });
        } else if (trip.status === 'cancelled' && updatedDate) {
          items.push({
            id: `trip-status-${trip.id}-cancelled`,
            type: 'trip',
            title: 'Trip Cancelled',
            description: `Trip for vehicle ${trip.vehicle?.plateNumber || ''} has been cancelled.`,
            timestamp: updatedDate,
            status: 'cancelled',
          });
        } else if (trip.status === 'in_progress' && (startDate || updatedDate)) {
          items.push({
            id: `trip-status-${trip.id}-in_progress`,
            type: 'trip',
            title: 'Trip Started',
            description: `Driver ${trip.driver?.fullName || 'Driver'} started trip on vehicle ${trip.vehicle?.plateNumber || ''}`,
            timestamp: startDate || updatedDate!,
            status: 'in_progress',
          });
        } else if (trip.status === 'completed' && (endDate || updatedDate)) {
          items.push({
            id: `trip-status-${trip.id}-completed`,
            type: 'trip',
            title: 'Trip Completed',
            description: `Driver ${trip.driver?.fullName || 'Driver'} completed trip. Distance: ${trip.totalDistanceKm || 0} km`,
            timestamp: endDate || updatedDate!,
            status: 'completed',
          });
        }
      });
    }

    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [orders, alerts, trips, safeDate]);

  useEffect(() => {
    setLocalActivities(allActivities);
  }, [allActivities]);

  useEffect(() => {
    socketService.connect();

    const handleNewAlert = (payload: any) => {
      const isSOS = payload.type === 'SOS' || payload.type === 'incident' || payload.severity === 'CRITICAL' || payload.severity === 'critical';
      if (payload.type !== 'abnormal_stop' && !isSOS) return;

      if (isSOS) {
        Toast.show({
          type: 'error',
          text1: '🚨 SOS EMERGENCY',
          text2: `${payload.message || 'Driver triggered SOS!'} (${payload.vehicle?.plateNumber || 'Unknown Vehicle'})`,
          visibilityTime: 15000,
        });
      }

      const newAlertItem = {
        id: `live-alert-${payload.id || Date.now()}`,
        type: 'alert',
        title: (payload.type || 'ALERT').replace('_', ' ').toUpperCase(),
        description: `${payload.message || ''} (${payload.vehicle?.plateNumber || 'Unknown Vehicle'})`,
        timestamp: new Date(),
        severity: payload.severity,
      };
      setLocalActivities(prev => [newAlertItem, ...prev]);
    };

    const handleTripStatusChanged = (payload: any) => {
      const statusText = payload.status === 'in_progress' ? 'started' : payload.status;
      const newTripItem = {
        id: `live-trip-${payload.id}-${payload.status}-${Date.now()}`,
        type: 'trip',
        title: `Trip ${payload.status.charAt(0).toUpperCase() + payload.status.slice(1)}`,
        description: payload.status === 'accepted'
          ? `Driver ${payload.driverName || 'Driver'} accepted the assigned trip.`
          : payload.status === 'in_progress'
          ? `Driver ${payload.driverName || 'Driver'} started trip on vehicle ${payload.vehicleId || ''}.`
          : payload.status === 'completed'
          ? `Driver ${payload.driverName || 'Driver'} completed trip.`
          : `Trip is now ${statusText} for vehicle ${payload.vehicleId || ''}.`,
        timestamp: new Date(),
        status: payload.status,
      };
      setLocalActivities(prev => [newTripItem, ...prev]);
    };

    const handleOrderVerified = (payload: any) => {
      const newOrderItem = {
        id: `live-order-${payload.orderId}-${Date.now()}`,
        type: 'order',
        title: 'Milestone Verified',
        description: `ORD-${payload.orderId.substring(0, 4)} verification success!`,
        timestamp: new Date(),
        status: 'verified',
      };
      setLocalActivities(prev => [newOrderItem, ...prev]);
    };

    socketService.on('alert:new', handleNewAlert);
    socketService.on('trip:status-changed', handleTripStatusChanged);
    socketService.on('order:verified', handleOrderVerified);

    return () => {
      socketService.off('alert:new', handleNewAlert);
      socketService.off('trip:status-changed', handleTripStatusChanged);
      socketService.off('order:verified', handleOrderVerified);
    };
  }, []);

  const dashboardActivities = useMemo(() => {
    return localActivities.slice(0, 6);
  }, [localActivities]);

  const filteredActivities = useMemo(() => {
    return localActivities.filter((activity: any) => {
      const matchesTab = activeTab === 'all' || activity.type === activeTab;
      const matchesQuery = !searchQuery || 
        activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesQuery;
    });
  }, [localActivities, activeTab, searchQuery]);

  return {
    stats,
    vehicles,
    orders,
    alerts,
    trips,
    isLoading,
    fetchStats,
    isModalOpen,
    setIsModalOpen,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    activeKpiDetail,
    setActiveKpiDetail,
    detailSearchQuery,
    setDetailSearchQuery,
    dashboardActivities,
    filteredActivities,
    timeAgo,
    router,
  };
};
