import React, { useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LayoutDashboard, Truck, Package, DollarSign, AlertTriangle, TrendingUp, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatCard } from '../../components/admin/dashboard/StatCard';
import { useDashboardStore } from '../../store/useDashboardStore';

export default function AdminDashboardScreen() {
  const { stats, isLoading, fetchStats } = useDashboardStore();
  const router = useRouter();

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

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

        <View className="mb-4">
          <Text className="text-lg font-bold text-slate-50 tracking-wider">Recent Activity</Text>
        </View>

        <View className="bg-slate-800 rounded-3xl p-8 items-center justify-center border border-white/10">
          {isLoading ? (
            <ActivityIndicator color="#6366f1" />
          ) : (
            <>
              <Text className="text-slate-400 text-sm text-center mb-5 leading-5">Detailed activity logs and mini charts will be added in future updates.</Text>
              <Text className="bg-indigo-500/15 text-indigo-400 px-4 py-2 rounded-2xl text-xs font-bold overflow-hidden">Phase 02 in Progress</Text>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
