import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Fuel, TrendingUp, DollarSign, RefreshCw, Activity } from 'lucide-react-native';
import { useReportStore } from '../../../store/useReportStore';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { ExportButton } from '../../../components/admin/dashboard/ExportButton';

const screenWidth = Dimensions.get('window').width;

export default function FuelReportScreen() {
  const router = useRouter();
  const { fuelCostData, loading, fetchFuelCost } = useReportStore();
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 30); // 30 day history
    
    await fetchFuelCost({
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
    color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  };

  const lineData = {
    labels: fuelCostData?.costTrend.slice(-6).map(t => t.date.slice(5)) || [],
    datasets: [
      {
        data: fuelCostData?.costTrend.slice(-6).map(t => t.cost) || [],
        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
        strokeWidth: 2
      }
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
            <Text className="text-xl font-bold text-slate-50">Fuel Consumption</Text>
            <Text className="text-slate-400 text-xs">Cost and efficiency analysis</Text>
          </View>
        </View>
        
        <ExportButton 
          reportName="fuel-cost" 
          params={{
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            to: new Date().toISOString().split('T')[0]
          }}
          color="#ef4444" 
        />
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {loading && !refreshing ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color="#ef4444" />
            <Text className="text-slate-400 mt-4">Calculating fuel metrics...</Text>
          </View>
        ) : (
          <>
            {/* Stats Overview */}
            <View className="flex-row justify-between mb-8 mt-4">
              <View className="bg-slate-900/50 border border-white/5 rounded-3xl p-4 w-[48%] mb-4">
                <View className="w-10 h-10 rounded-full bg-rose-500/10 justify-center items-center mb-3">
                  <Fuel size={20} color="#ef4444" />
                </View>
                <Text className="text-slate-400 text-[10px] uppercase font-bold mb-1">Total Cost</Text>
                <Text className="text-slate-50 text-xl font-bold">${fuelCostData?.totalCost?.toLocaleString() || 0}</Text>
              </View>

              <View className="bg-slate-900/50 border border-white/5 rounded-3xl p-4 w-[48%] mb-4">
                <View className="w-10 h-10 rounded-full bg-indigo-500/10 justify-center items-center mb-3">
                  <DollarSign size={20} color="#6366f1" />
                </View>
                <Text className="text-slate-400 text-[10px] uppercase font-bold mb-1">Avg per Trip</Text>
                <Text className="text-slate-50 text-xl font-bold">${fuelCostData?.averageCostPerTrip?.toFixed(2) || 0}</Text>
              </View>
            </View>

            {/* Cost Trend Chart */}
            <View className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 mb-8">
              <View className="flex-row items-center justify-between mb-6">
                <View>
                  <Text className="text-slate-50 font-bold">Cost Trend</Text>
                  <Text className="text-slate-500 text-xs">Last 30 days spending</Text>
                </View>
                <View className="bg-rose-500/10 px-2 py-1 rounded-lg flex-row items-center">
                  <TrendingUp size={12} color="#ef4444" />
                  <Text className="text-rose-400 text-[10px] font-bold ml-1">+5.2%</Text>
                </View>
              </View>
              
              {fuelCostData?.costTrend && fuelCostData.costTrend.length > 0 ? (
                <LineChart
                  data={lineData}
                  width={screenWidth - 84}
                  height={180}
                  chartConfig={chartConfig}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16
                  }}
                />
              ) : (
                <View className="h-40 justify-center items-center">
                  <Text className="text-slate-600">No trend data available</Text>
                </View>
              )}
            </View>

            {/* Vehicle Efficiency List */}
            <View className="mb-10">
              <View className="flex-row items-center justify-between mb-4 px-2">
                <Text className="text-slate-50 font-bold">Efficiency by Vehicle</Text>
                <Activity size={16} color="#94a3b8" />
              </View>
              
              {fuelCostData?.vehicleFuelStats.map((item, index) => (
                <View 
                  key={item.vehiclePlate}
                  className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 mb-3"
                >
                  <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-row items-center">
                      <View className="w-8 h-8 rounded-full bg-slate-800 justify-center items-center mr-3">
                        <Text className="text-slate-400 font-bold text-[10px]">{item.vehiclePlate.slice(0, 2)}</Text>
                      </View>
                      <View>
                        <Text className="text-slate-50 font-bold text-sm">{item.vehiclePlate}</Text>
                        <Text className="text-slate-500 text-[10px] uppercase">{item.type}</Text>
                      </View>
                    </View>
                    <Text className="text-rose-400 font-bold">${item.cost.toLocaleString()}</Text>
                  </View>
                  
                  <View className="flex-row justify-between pt-3 border-t border-white/5">
                    <View>
                      <Text className="text-slate-500 text-[10px] uppercase mb-1">Distance</Text>
                      <Text className="text-slate-300 font-bold text-xs">{item.distance.toLocaleString()} km</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-slate-500 text-[10px] uppercase mb-1">Efficiency</Text>
                      <Text className="text-emerald-400 font-bold text-xs">{item.efficiency.toFixed(2)} L/100km</Text>
                    </View>
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
