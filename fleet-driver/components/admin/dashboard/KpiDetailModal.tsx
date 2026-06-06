import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { X, Search, Truck, Package, TrendingUp, AlertTriangle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface KpiDetailModalProps {
  activeKpiDetail: 'vehicles' | 'orders' | 'trips' | 'alerts' | null;
  onClose: () => void;
  stats: {
    activeVehicles: number;
    pendingOrders: number;
    totalTrips: number;
    alertCount: number;
  };
  vehicles: any[];
  orders: any[];
  trips: any[];
  alerts: any[];
  detailSearchQuery: string;
  setDetailSearchQuery: (q: string) => void;
  timeAgo: (dateStr: string) => string;
}

export const KpiDetailModal: React.FC<KpiDetailModalProps> = ({
  activeKpiDetail,
  onClose,
  stats,
  vehicles,
  orders,
  trips,
  alerts,
  detailSearchQuery,
  setDetailSearchQuery,
  timeAgo,
}) => {
  if (activeKpiDetail === null) return null;

  return (
    <View className="absolute inset-0 bg-slate-950 z-50 p-5">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-2xl font-bold text-slate-50">
              {activeKpiDetail === 'vehicles' ? 'Vehicle Directory' :
               activeKpiDetail === 'orders' ? 'Pending Orders' :
               activeKpiDetail === 'trips' ? 'Trips Listing' :
               'Active Alerts'}
            </Text>
            <Text className="text-slate-400 text-xs mt-1">
              {activeKpiDetail === 'vehicles' ? `${stats.activeVehicles} active / ${vehicles?.length || 0} total` :
               activeKpiDetail === 'orders' ? `${stats.pendingOrders} pending orders` :
               activeKpiDetail === 'trips' ? `${stats.totalTrips} total trips` :
               `${stats.alertCount} active alerts`}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 justify-center items-center"
          >
            <X size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search Box */}
        <View className="flex-row items-center bg-slate-800 px-4 py-3 rounded-2xl border border-slate-700 mb-6">
          <Search size={16} color="#94a3b8" />
          <TextInput
            placeholder={
              activeKpiDetail === 'vehicles' ? 'Search by plate or type...' :
              activeKpiDetail === 'orders' ? 'Search by address...' :
              activeKpiDetail === 'trips' ? 'Search by driver or vehicle...' :
              'Search alerts...'
            }
            placeholderTextColor="#64748b"
            value={detailSearchQuery}
            onChangeText={setDetailSearchQuery}
            className="flex-1 text-slate-200 text-sm ml-2 outline-none"
          />
        </View>

        {/* Content List */}
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {(() => {
            const query = detailSearchQuery.toLowerCase();
            
            if (activeKpiDetail === 'vehicles') {
              const filteredVehicles = (vehicles || []).filter((v: any) => 
                v.plateNumber?.toLowerCase().includes(query) ||
                v.type?.toLowerCase().includes(query)
              );

              if (filteredVehicles.length === 0) {
                return (
                  <View className="py-12 items-center"><Text className="text-slate-400">No vehicles found</Text></View>
                );
              }

              return filteredVehicles.map((vehicle: any) => (
                <View key={vehicle.id} className="bg-slate-800/80 p-4 rounded-2xl border border-white/5 mb-3 flex-row justify-between items-center">
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-slate-100 font-bold text-base">{vehicle.plateNumber}</Text>
                      <View className={`px-2 py-0.5 rounded-lg ${
                        vehicle.status === 'active' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                        vehicle.status === 'maintenance' ? 'bg-amber-500/10 border border-amber-500/20' :
                        'bg-slate-500/10 border border-slate-500/20'
                      }`}>
                        <Text className={`text-[10px] font-bold uppercase ${
                          vehicle.status === 'active' ? 'text-emerald-400' :
                          vehicle.status === 'maintenance' ? 'text-amber-400' :
                          'text-slate-400'
                        }`}>{vehicle.status}</Text>
                      </View>
                    </View>
                    <Text className="text-slate-400 text-xs">Type: {vehicle.type} • Capacity: {vehicle.maxCapacity}kg</Text>
                    <Text className="text-slate-505 text-[10px] mt-1">Device ID: {vehicle.deviceId || 'None'}</Text>
                  </View>
                  <View className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5 items-center justify-center">
                    <Truck size={20} color="#059669" />
                  </View>
                </View>
              ));
            }

            if (activeKpiDetail === 'orders') {
              const pendingOrdersList = (orders || []).filter((o: any) => o.status === 'pending');
              const filteredOrders = pendingOrdersList.filter((order: any) => 
                order.deliveryAddress?.toLowerCase().includes(query) ||
                order.pickupAddress?.toLowerCase().includes(query) ||
                order.id?.toLowerCase().includes(query)
              );

              if (filteredOrders.length === 0) {
                return (
                  <View className="py-12 items-center"><Text className="text-slate-400">No pending orders found</Text></View>
                );
              }

              return filteredOrders.map((order: any) => (
                <View key={order.id} className="bg-slate-800/80 p-4 rounded-2xl border border-white/5 mb-3">
                  <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-slate-100 font-bold text-sm">ORD-{order.id.substring(0, 8).toUpperCase()}</Text>
                    <View className="bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                      <Text className="text-[10px] text-amber-400 font-bold uppercase">Pending</Text>
                    </View>
                  </View>
                  <Text className="text-slate-300 text-xs mb-1"><Text className="text-slate-505 font-medium">From:</Text> {order.pickupAddress}</Text>
                  <Text className="text-slate-300 text-xs mb-2"><Text className="text-slate-550 font-medium">To:</Text> {order.deliveryAddress}</Text>
                  <View className="flex-row justify-between items-center border-t border-white/5 pt-2 mt-1">
                    <Text className="text-slate-400 text-[10px]">Weight: {order.weight} kg</Text>
                    <Text className="text-slate-500 text-[10px]">{timeAgo(order.createdAt)}</Text>
                  </View>
                </View>
              ));
            }

            if (activeKpiDetail === 'trips') {
              const filteredTrips = (trips || []).filter((trip: any) => 
                trip.driver?.fullName?.toLowerCase().includes(query) ||
                trip.vehicle?.plateNumber?.toLowerCase().includes(query) ||
                trip.id?.toLowerCase().includes(query)
              );

              if (filteredTrips.length === 0) {
                return (
                  <View className="py-12 items-center"><Text className="text-slate-400">No trips found</Text></View>
                );
              }

              return filteredTrips.map((trip: any) => (
                <View key={trip.id} className="bg-slate-800/80 p-4 rounded-2xl border border-white/5 mb-3">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-slate-100 font-bold text-sm">Trip to {trip.vehicle?.plateNumber}</Text>
                    <View className={`px-2 py-0.5 rounded-lg ${
                      trip.status === 'completed' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                      trip.status === 'in_progress' ? 'bg-blue-500/10 border border-blue-500/20' :
                      'bg-amber-500/10 border border-amber-500/20'
                    }`}>
                      <Text className={`text-[10px] font-bold uppercase ${
                        trip.status === 'completed' ? 'text-emerald-400' :
                        trip.status === 'in_progress' ? 'text-blue-400' :
                        'text-amber-400'
                      }`}>{trip.status.replace('_', ' ')}</Text>
                    </View>
                  </View>
                  <Text className="text-slate-300 text-xs mb-1"><Text className="text-slate-500">Driver:</Text> {trip.driver?.fullName || 'N/A'}</Text>
                  <Text className="text-slate-400 text-[10px]">Distance: {trip.totalDistanceKm || 0} km</Text>
                  <View className="flex-row justify-between items-center border-t border-white/5 pt-2 mt-1">
                    <Text className="text-slate-500 text-[10px]">Created: {new Date(trip.createdAt).toLocaleDateString()}</Text>
                  </View>
                </View>
              ));
            }

            if (activeKpiDetail === 'alerts') {
              const unresolvedAlerts = (alerts || []).filter((a: any) => !a.isResolved && a.type === 'abnormal_stop');
              const filteredAlerts = unresolvedAlerts.filter((alert: any) => 
                alert.message?.toLowerCase().includes(query) ||
                alert.vehicle?.plateNumber?.toLowerCase().includes(query)
              );

              if (filteredAlerts.length === 0) {
                return (
                  <View className="py-12 items-center"><Text className="text-slate-400">No active alerts found</Text></View>
                );
              }

              return filteredAlerts.map((alert: any) => (
                <View key={alert.id} className="bg-slate-800/80 p-4 rounded-2xl border border-white/5 mb-3">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-row items-center gap-2">
                      <AlertTriangle size={16} color="#ef4444" />
                      <Text className="text-red-400 font-bold text-sm uppercase">{alert.type.replace('_', ' ')}</Text>
                    </View>
                    <View className="bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-lg">
                      <Text className="text-[10px] text-red-400 font-bold uppercase">{alert.severity}</Text>
                    </View>
                  </View>
                  <Text className="text-slate-200 text-xs mb-1">{alert.message}</Text>
                  <Text className="text-slate-400 text-xs">Vehicle: {alert.vehicle?.plateNumber || 'Unknown'}</Text>
                  <View className="flex-row justify-between items-center border-t border-white/5 pt-2 mt-1">
                    <Text className="text-slate-500 text-[10px]">{timeAgo(alert.createdAt)}</Text>
                  </View>
                </View>
              ));
            }

            return null;
          })()}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
