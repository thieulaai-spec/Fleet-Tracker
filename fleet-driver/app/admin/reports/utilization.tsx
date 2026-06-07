import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Truck, Clock, Zap, RefreshCw } from 'lucide-react-native';
import { useReportStore } from '../../../store/useReportStore';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { ExportButton } from '../../../components/admin/dashboard/ExportButton';

const screenWidth = Dimensions.get('window').width;

export default function UtilizationReportScreen() {
  const router = useRouter();
  const { utilizationData, loading, fetchVehicleUtilization } = useReportStore();
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 7);
    
    await fetchVehicleUtilization({
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const chartConfig = {
    backgroundGradientFrom: '#0f172a',
    backgroundGradientTo: '#0f172a',
    color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.6,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  };

  const barData = {
    labels: utilizationData?.vehicleStats.map(v => v.plateNumber.slice(-4)) || [],
    datasets: [
      {
        data: utilizationData?.vehicleStats.map(v => v.utilization) || [],
      },
    ],
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-slate-800 justify-center items-center mr-4 border border-slate-700"
          >
            <ArrowLeft size={20} color="#0f172a" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold text-slate-50">Vehicle Utilization</Text>
            <Text className="text-slate-400 text-xs">Capacity and usage logs</Text>
          </View>
        </View>
        
        <ExportButton 
          reportName="vehicle-utilization" 
          params={{
            from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            to: new Date().toISOString().split('T')[0]
          }}
          color="#f59e0b" 
        />
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {loading && !refreshing ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color="#f59e0b" />
            <Text className="text-slate-400 mt-4">Analyzing fleet data...</Text>
          </View>
        ) : (
          <>
            {/* Stats Overview */}
            <View className="flex-row justify-between mb-8 mt-4">
              <View className="bg-slate-900/50 border border-white/5 rounded-3xl p-4 w-[31%] items-center">
                <View className="w-10 h-10 rounded-full bg-amber-500/10 justify-center items-center mb-2">
                  <Truck size={20} color="#f59e0b" />
                </View>
                <Text className="text-slate-50 text-lg font-bold">{utilizationData?.activeCount || 0}</Text>
                <Text className="text-slate-500 text-[10px] uppercase font-bold">Active</Text>
              </View>

              <View className="bg-slate-900/50 border border-white/5 rounded-3xl p-4 w-[31%] items-center">
                <View className="w-10 h-10 rounded-full bg-slate-500/10 justify-center items-center mb-2">
                  <Clock size={20} color="#94a3b8" />
                </View>
                <Text className="text-slate-50 text-lg font-bold">{utilizationData?.idleCount || 0}</Text>
                <Text className="text-slate-500 text-[10px] uppercase font-bold">Idle</Text>
              </View>

              <View className="bg-slate-900/50 border border-white/5 rounded-3xl p-4 w-[31%] items-center">
                <View className="w-10 h-10 rounded-full bg-emerald-500/10 justify-center items-center mb-2">
                  <Zap size={20} color="#10b981" />
                </View>
                <Text className="text-slate-50 text-lg font-bold">{utilizationData?.averageUtilization || 0}%</Text>
                <Text className="text-slate-500 text-[10px] uppercase font-bold">Avg Use</Text>
              </View>
            </View>

            {/* Main Chart */}
            <View className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 mb-8">
              <Text className="text-slate-50 font-bold mb-1">Utilization by Vehicle</Text>
              <Text className="text-slate-500 text-xs mb-6">Percentage of active time per vehicle</Text>
              
              {utilizationData?.vehicleStats && utilizationData.vehicleStats.length > 0 ? (
                <BarChart
                  data={barData}
                  width={screenWidth - 84}
                  height={220}
                  yAxisLabel=""
                  yAxisSuffix="%"
                  chartConfig={chartConfig}
                  verticalLabelRotation={30}
                  fromZero
                  showValuesOnTopOfBars
                />
              ) : (
                <View className="h-40 justify-center items-center">
                  <Text className="text-slate-600">No utilization data available</Text>
                </View>
              )}
            </View>

            {/* List Detail */}
            <View className="mb-10">
              <Text className="text-slate-50 font-bold mb-4 px-2">Vehicle Logs</Text>
              {utilizationData?.vehicleStats.map((item, index) => (
                <View 
                  key={item.plateNumber}
                  className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 mb-3 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center">
                    <View className={`w-2 h-10 rounded-full ${item.utilization > 80 ? 'bg-emerald-500' : item.utilization > 40 ? 'bg-amber-500' : 'bg-rose-500'} mr-4`} />
                    <View>
                      <Text className="text-slate-50 font-bold">{item.plateNumber}</Text>
                      <Text className="text-slate-500 text-xs">{item.status}</Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className={`font-bold ${item.utilization > 80 ? 'text-emerald-400' : item.utilization > 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {item.utilization}%
                    </Text>
                    <Text className="text-slate-500 text-[10px]">UTILIZATION</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
