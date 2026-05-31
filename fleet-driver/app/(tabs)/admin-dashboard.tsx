import React, { useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Modal, TextInput } from 'react-native';
import { LayoutDashboard, Truck, Package, DollarSign, AlertTriangle, TrendingUp, ChevronRight, Clock, X, Search } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatCard } from '../../components/admin/dashboard/StatCard';
import { useDashboardStore } from '../../store/useDashboardStore';
import { socketService } from '../../lib/socket';

export default function AdminDashboardScreen() {
  const { stats, orders, alerts, trips, isLoading, fetchStats } = useDashboardStore();
  const router = useRouter();
  
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'all' | 'order' | 'trip' | 'alert'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [localActivities, setLocalActivities] = React.useState<any[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const timeAgo = (dateStr: string) => {
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
  };

  // Safe date parser
  const safeDate = (dStr: any) => {
    if (!dStr) return null;
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const allActivities = React.useMemo(() => {
    const items: any[] = [];

    // 1. Orders
    if (Array.isArray(orders)) {
      orders.forEach((order: any) => {
        const createdDate = safeDate(order.createdAt);
        if (createdDate) {
          items.push({
            id: `order-created-${order.id}`,
            type: 'order',
            title: 'Order Created',
            description: `ORD-${order.id.substring(0, 4)} created to ${order.deliveryAddress}`,
            timestamp: createdDate,
            status: 'pending',
          });
        }

        if (order.status && order.status !== 'pending') {
          const updatedDate = safeDate(order.updatedAt);
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
        if (createdDate && trip.status === 'pending') {
          items.push({
            id: `trip-created-${trip.id}`,
            type: 'trip',
            title: 'Trip Dispatched',
            description: `New trip assigned to ${trip.driver?.fullName || 'Driver'} on vehicle ${trip.vehicle?.plateNumber || ''}`,
            timestamp: createdDate,
            status: 'pending',
          });
        }

        const updatedDate = safeDate(trip.updatedAt);
        if (updatedDate) {
          if (trip.status === 'accepted') {
            items.push({
              id: `trip-accepted-${trip.id}`,
              type: 'trip',
              title: 'Trip Accepted',
              description: `Driver ${trip.driver?.fullName || 'Driver'} accepted the assigned trip.`,
              timestamp: updatedDate,
              status: 'accepted',
            });
          } else if (trip.status === 'cancelled') {
            items.push({
              id: `trip-cancelled-${trip.id}`,
              type: 'trip',
              title: 'Trip Cancelled',
              description: `Trip for vehicle ${trip.vehicle?.plateNumber || ''} has been cancelled.`,
              timestamp: updatedDate,
              status: 'cancelled',
            });
          }
        }

        if (trip.startedAt) {
          const startDate = safeDate(trip.startedAt);
          if (startDate) {
            items.push({
              id: `trip-start-${trip.id}`,
              type: 'trip',
              title: 'Trip Started',
              description: `Driver ${trip.driver?.fullName || 'Driver'} started trip on vehicle ${trip.vehicle?.plateNumber || ''}`,
              timestamp: startDate,
              status: 'in_progress',
            });
          }
        }
        if (trip.completedAt) {
          const endDate = safeDate(trip.completedAt);
          if (endDate) {
            items.push({
              id: `trip-complete-${trip.id}`,
              type: 'trip',
              title: 'Trip Completed',
              description: `Driver ${trip.driver?.fullName || 'Driver'} completed trip. Distance: ${trip.totalDistanceKm || 0} km`,
              timestamp: endDate,
              status: 'completed',
            });
          }
        }
      });
    }

    // Sort all
    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [orders, alerts, trips]);

  // Keep local activities in sync with store updates
  useEffect(() => {
    setLocalActivities(allActivities);
  }, [allActivities]);

  // Solution 3: Bind live mobile socketService events to prepend new activities instantly in real-time
  useEffect(() => {
    socketService.connect();

    // 1. Operational Alerts
    const handleNewAlert = (payload: any) => {
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

    // 2. Trip Updates
    const handleTripStatusChanged = (payload: any) => {
      const statusText = payload.status === 'in_progress' ? 'started' : payload.status;
      const newTripItem = {
        id: `live-trip-${payload.id}-${payload.status}-${Date.now()}`,
        type: 'trip',
        title: `Trip ${payload.status.charAt(0).toUpperCase() + payload.status.slice(1)}`,
        description: `Trip is now ${statusText} for vehicle ${payload.vehicleId || ''}.`,
        timestamp: new Date(),
        status: payload.status,
      };
      setLocalActivities(prev => [newTripItem, ...prev]);
    };

    // 3. Order Milestone verification
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

  // Dashboard top 6 view
  const dashboardActivities = React.useMemo(() => {
    return localActivities.slice(0, 6);
  }, [localActivities]);

  // Filtered view for history modal
  const filteredActivities = React.useMemo(() => {
    return localActivities.filter((activity: any) => {
      const matchesTab = activeTab === 'all' || activity.type === activeTab;
      const matchesQuery = !searchQuery || 
        activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesQuery;
    });
  }, [localActivities, activeTab, searchQuery]);

  const renderActivityItem = (activity: any, idx: number, array: any[]) => (
    <View key={activity.id} className="flex-row items-start mb-4">
      {/* Timeline node */}
      <View className="items-center mr-3 relative">
        <View className={`w-8 h-8 rounded-full justify-center items-center ${
          activity.type === 'alert' ? 'bg-red-500/10 border border-red-500/20' :
          activity.type === 'trip' ? 'bg-emerald-500/10 border border-emerald-500/20' :
          'bg-amber-500/10 border border-amber-500/20'
        }`}>
          {activity.type === 'alert' ? (
            <AlertTriangle size={14} color="#f43f5e" />
          ) : activity.type === 'trip' ? (
            <Truck size={14} color="#10b981" />
          ) : (
            <Package size={14} color="#f59e0b" />
          )}
        </View>
        {idx < array.length - 1 && (
          <View className="w-[1px] h-12 bg-slate-800 absolute bottom-[-32px] left-[15px]" />
        )}
      </View>

      {/* Content card */}
      <View className="flex-1 bg-slate-800/80 p-4 rounded-2xl border border-white/5">
        <View className="flex-row justify-between items-start mb-1 gap-2">
          <Text className="text-slate-100 font-bold text-sm flex-1">{activity.title}</Text>
          <View className="flex-row items-center gap-1">
            <Clock size={10} color="#94a3b8" />
            <Text className="text-[10px] text-slate-400 font-medium">{timeAgo(activity.timestamp.toISOString())}</Text>
          </View>
        </View>
        <Text className="text-slate-400 text-xs leading-4">{activity.description}</Text>
        
        {activity.status && (
          <View className="mt-2 self-start bg-slate-950/60 px-2 py-0.5 rounded-lg border border-white/5">
            <Text className={`text-[9px] font-bold uppercase tracking-wider ${
              activity.status === 'delivered' || activity.status === 'completed' ? 'text-emerald-400' :
              activity.status === 'pending' ? 'text-amber-400' :
              activity.status === 'failed' || activity.status === 'cancelled' ? 'text-red-400' :
              'text-indigo-400'
            }`}>
              {activity.status.replace('_', ' ')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchStats} tintColor="#6366f1" />
        }
      >
        <View className="flex-row items-center mb-6 gap-3">
          <LayoutDashboard size={32} color="#6366f1" />
          <Text className="text-3xl font-bold text-slate-50">Admin Dashboard</Text>
        </View>

        <View className="flex-row flex-wrap justify-between mb-6">
          <StatCard 
            title="Active Vehicles" 
            value={stats.activeVehicles} 
            icon={Truck} 
            color="#6366f1" 
            trend="+2 from yesterday"
          />
          <StatCard 
            title="Pending Orders" 
            value={stats.pendingOrders} 
            icon={Package} 
            color="#f59e0b" 
            trend="-5 since morning"
            trendColor="#f43f5e"
          />
          <StatCard 
            title="Revenue (Day)" 
            value={formatCurrency(stats.totalRevenue).split(',00')[0]} 
            icon={DollarSign} 
            color="#10b981" 
            trend="+12% vs last week"
          />
          <StatCard 
            title="Active Alerts" 
            value={stats.alertCount} 
            icon={AlertTriangle} 
            color="#ef4444" 
            trend={stats.alertCount > 0 ? "Requires attention" : "System clear"}
            trendColor={stats.alertCount > 0 ? "#ef4444" : "#10b981"}
          />
        </View>
        
        <View className="mb-4">
          <Text className="text-lg font-bold text-slate-50 tracking-wider">Reports & Analytics</Text>
        </View>

        <TouchableOpacity 
          className="bg-slate-800 rounded-3xl p-5 flex-row items-center mb-6 border border-white/10"
          onPress={() => router.push('/admin/reports' as any)}
        >
          <View className="w-12 h-12 rounded-2xl bg-indigo-500/15 justify-center items-center mr-4">
            <TrendingUp size={24} color="#6366f1" />
          </View>
          <View className="flex-1">
            <Text className="text-slate-50 font-bold text-base mb-1">Fleet Insights & KPIs</Text>
            <Text className="text-slate-400 text-xs">View fuel, trips, utilization, and rankings</Text>
          </View>
          <View className="w-8 h-8 rounded-full bg-slate-950 justify-center items-center">
            <ChevronRight size={18} color="#94a3b8" />
          </View>
        </TouchableOpacity>

        <View className="mb-4 flex-row justify-between items-center">
          <Text className="text-lg font-bold text-slate-50 tracking-wider">Recent Activity</Text>
          <TouchableOpacity onPress={() => setIsModalOpen(true)}>
            <Text className="text-indigo-400 font-bold text-xs">View All</Text>
          </TouchableOpacity>
        </View>

      {isLoading ? (
        <View className="bg-slate-800 rounded-3xl p-8 items-center justify-center border border-white/10">
          <ActivityIndicator color="#6366f1" />
        </View>
      ) : dashboardActivities.length === 0 ? (
        <View className="bg-slate-800 rounded-3xl p-8 items-center justify-center border border-white/10">
          <Text className="text-slate-400 text-sm text-center mb-2 font-medium">No recent activities found.</Text>
          <Text className="text-slate-500 text-xs text-center">Operational timelines will populate here once events trigger.</Text>
        </View>
      ) : (
        <View className="bg-slate-900/60 rounded-[32px] p-5 border border-white/5 gap-y-4">
          {dashboardActivities.map((activity, idx, arr) => renderActivityItem(activity, idx, arr))}
        </View>
      )}
    </ScrollView>

    {/* Solutions 1 & 2: "View All" Overlay with full interactive Filtering and Search on Mobile */}
    {isModalOpen && (
      <View className="absolute inset-0 bg-slate-950 z-50 p-5">
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-slate-50">Operational Logs</Text>
            <TouchableOpacity 
              onPress={() => setIsModalOpen(false)}
              className="w-10 h-10 rounded-full bg-slate-800 justify-center items-center"
            >
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Filtering Tabs */}
          <View className="flex-row justify-between mb-4 gap-1">
            {(['all', 'order', 'trip', 'alert'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-1 rounded-xl items-center border ${
                  activeTab === tab 
                    ? 'bg-indigo-600 border-indigo-500 shadow-sm' 
                    : 'bg-slate-800 border-slate-700'
                }`}
              >
                <Text className={`text-[10px] font-bold uppercase tracking-wider ${
                  activeTab === tab ? 'text-slate-50' : 'text-slate-400'
                }`}>
                  {tab === 'all' ? 'All' : `${tab}s`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Search Box */}
          <View className="flex-row items-center bg-slate-800 px-4 py-3 rounded-2xl border border-slate-700 mb-6">
            <Search size={16} color="#94a3b8" />
            <TextInput
              placeholder="Search history logs..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-slate-200 text-sm ml-2 outline-none"
            />
          </View>

          {/* Scrollable Timeline */}
          <ScrollView 
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {filteredActivities.length === 0 ? (
              <View className="bg-slate-900/40 py-12 rounded-3xl items-center border border-dashed border-slate-800">
                <Text className="text-slate-400 text-sm font-medium">No matching logs found.</Text>
              </View>
            ) : (
              filteredActivities.map((activity, idx, arr) => renderActivityItem(activity, idx, arr))
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    )}
  </SafeAreaView>
  );
}
