import React from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { LayoutDashboard, Truck, Package, AlertTriangle, TrendingUp, Clock } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatCard } from '../../components/admin/dashboard/StatCard';
import { LinearGradient } from 'expo-linear-gradient';
import { useAdminDashboard } from '../../hooks/admin/useAdminDashboard';
import { ActivityLogsModal } from '../../components/admin/dashboard/ActivityLogsModal';
import { KpiDetailModal } from '../../components/admin/dashboard/KpiDetailModal';

export default function AdminDashboardScreen() {
  const {
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
  } = useAdminDashboard();

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
          <View className="w-[2px] h-12 bg-slate-800 absolute bottom-[-32px] left-[15px]" />
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
    <View className="flex-1 bg-slate-950">
      {/* Decorative premium gradient background */}
      <LinearGradient
        colors={['#e6fcf0', '#f1f5f9', '#ffffff']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 0.8 }}
      />
      {/* Soft blurred decorative glowing mint/emerald circles */}
      <View 
        style={{
          position: 'absolute',
          top: -80,
          right: -80,
          width: 280,
          height: 280,
          borderRadius: 140,
          backgroundColor: '#34d399',
          opacity: 0.15,
        }}
      />
      <View 
        style={{
          position: 'absolute',
          top: 250,
          left: -120,
          width: 300,
          height: 300,
          borderRadius: 150,
          backgroundColor: '#10b981',
          opacity: 0.1,
        }}
      />
      <View 
        style={{
          position: 'absolute',
          bottom: 100,
          right: -100,
          width: 320,
          height: 320,
          borderRadius: 160,
          backgroundColor: '#a7f3d0',
          opacity: 0.2,
        }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView 
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetchStats} tintColor="#059669" />
          }
        >
          <View className="flex-row items-center mb-6 gap-3">
            <LayoutDashboard size={32} color="#059669" />
            <Text className="text-3xl font-bold text-slate-50">Admin Dashboard</Text>
          </View>

          <View className="flex-row flex-wrap justify-between mb-6">
            <StatCard 
              title="Active Vehicles" 
              value={stats.activeVehicles} 
              icon={Truck} 
              color="#059669" 
              onPress={() => {
                router.push({ pathname: '/(tabs)/admin-fleet', params: { tab: 'vehicles' } } as any);
              }}
            />
            <StatCard 
              title="Pending Orders" 
              value={stats.pendingOrders} 
              icon={Package} 
              color="#f59e0b" 
              onPress={() => {
                router.push({ pathname: '/(tabs)/admin-orders', params: { status: 'pending' } } as any);
              }}
            />
            <StatCard 
              title="Total Trips" 
              value={stats.totalTrips} 
              icon={TrendingUp} 
              color="#10b981" 
              onPress={() => {
                router.push('/(tabs)/admin-orders' as any);
              }}
            />
            <StatCard 
              title="Active Alerts" 
              value={stats.alertCount} 
              icon={AlertTriangle} 
              color="#ef4444" 
              onPress={() => {
                setActiveTab('alert');
                setSearchQuery('');
                setIsModalOpen(true);
              }}
            />
          </View>

          <View className="mb-4 flex-row justify-between items-center">
            <Text className="text-lg font-bold text-slate-50 tracking-wider">Recent Activity</Text>
            <TouchableOpacity onPress={() => setIsModalOpen(true)}>
              <Text className="text-indigo-400 font-bold text-xs">View All</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View className="bg-slate-800 rounded-3xl p-8 items-center justify-center border border-white/10">
              <ActivityIndicator color="#059669" />
            </View>
          ) : dashboardActivities.length === 0 ? (
            <View className="bg-slate-800 rounded-3xl p-8 items-center justify-center border border-white/10">
              <Text className="text-slate-400 text-sm text-center mb-2 font-medium">No recent activities found.</Text>
              <Text className="text-slate-505 text-xs text-center">Operational timelines will populate here once events trigger.</Text>
            </View>
          ) : (
            <View className="bg-slate-900/60 rounded-[32px] p-5 border border-white/5 gap-y-4">
              {dashboardActivities.map((activity, idx, arr) => renderActivityItem(activity, idx, arr))}
            </View>
          )}
        </ScrollView>

        {/* Activity Logs Modal */}
        <ActivityLogsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredActivities={filteredActivities}
          renderActivityItem={renderActivityItem}
        />

        {/* KPI Detail Modal */}
        <KpiDetailModal
          activeKpiDetail={activeKpiDetail}
          onClose={() => setActiveKpiDetail(null)}
          stats={stats}
          vehicles={vehicles}
          orders={orders}
          trips={trips}
          alerts={alerts}
          detailSearchQuery={detailSearchQuery}
          setDetailSearchQuery={setDetailSearchQuery}
          timeAgo={timeAgo}
        />
      </SafeAreaView>
    </View>
  );
}
