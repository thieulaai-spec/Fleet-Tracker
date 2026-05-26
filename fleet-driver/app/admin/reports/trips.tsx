import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Download, TrendingUp, Navigation, Truck } from 'lucide-react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useReportStore } from '../../../store/useReportStore';
import { ExportButton } from '../../../components/admin/dashboard/ExportButton';

const screenWidth = Dimensions.get('window').width;

export default function TripReportsScreen() {
  const router = useRouter();
  const { performanceData, loading, fetchFleetPerformance } = useReportStore();
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    const to = new Date().toISOString().split('T')[0];
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - (timeRange === '7d' ? 7 : 30));
    const from = fromDate.toISOString().split('T')[0];
    
    fetchFleetPerformance({ from, to });
  }, [timeRange]);

  const chartConfig = {
    backgroundGradientFrom: '#0f172a',
    backgroundGradientTo: '#0f172a',
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#6366f1'
    }
  };

  const lineChartData = {
    labels: (performanceData?.performanceTrend || []).map(t => t.date.slice(5)),
    datasets: [
      {
        data: (performanceData?.performanceTrend || []).map(t => t.trips),
        color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
        strokeWidth: 2
      }
    ],
    legend: ['Trips']
  };

  const barChartData = {
    labels: (performanceData?.tripsByVehicle || []).slice(0, 5).map(v => v.vehiclePlate.slice(-4)),
    datasets: [
      {
        data: (performanceData?.tripsByVehicle || []).slice(0, 5).map(v => v.count)
      }
    ]
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="px-6 py-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-slate-900 justify-center items-center mr-4"
          >
            <ArrowLeft size={20} color="#f8fafc" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold text-slate-50">Trip Statistics</Text>
            <Text className="text-slate-400 text-xs">Performance & Volume</Text>
          </View>
        </View>
        <ExportButton 
          reportName="fleet-performance" 
          params={{
            from: new Date(Date.now() - (timeRange === '7d' ? 7 : 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            to: new Date().toISOString().split('T')[0]
          }}
          color="#6366f1"
        />
      </View>

      <View className="px-6 py-4 flex-row justify-between">
        {['7d', '30d'].map((range) => (
          <TouchableOpacity 
            key={range}
            onPress={() => setTimeRange(range)}
            className={`px-6 py-2.5 rounded-full border ${
              timeRange === range ? 'bg-indigo-500 border-indigo-500' : 'bg-slate-900 border-white/5'
            }`}
          >
            <Text className={`font-bold text-xs ${timeRange === range ? 'text-white' : 'text-slate-400'}`}>
              Last {range}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#6366f1" size="large" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-6 mt-2" showsVerticalScrollIndicator={false}>
          {/* Summary Stats */}
          <View className="flex-row justify-between mb-8">
            <View className="bg-slate-900 rounded-3xl p-5 flex-1 mr-3 border border-white/5">
              <TrendingUp size={20} color="#6366f1" className="mb-2" />
              <Text className="text-slate-50 font-black text-2xl">{performanceData?.totalTrips || 0}</Text>
              <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Trips</Text>
            </View>
            <View className="bg-slate-900 rounded-3xl p-5 flex-1 border border-white/5">
              <Navigation size={20} color="#10b981" className="mb-2" />
              <Text className="text-slate-50 font-black text-2xl">{performanceData?.totalDistance || 0}k</Text>
              <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Distance (km)</Text>
            </View>
          </View>

          {/* Line Chart */}
          <View className="mb-8">
            <Text className="text-slate-50 font-bold text-lg mb-4">Daily Trip Trend</Text>
            <View className="bg-slate-900 rounded-3xl p-4 border border-white/5 overflow-hidden">
              {performanceData?.performanceTrend && performanceData.performanceTrend.length > 0 ? (
                <LineChart
                  data={lineChartData}
                  width={screenWidth - 80}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16
                  }}
                />
              ) : (
                <View className="h-52 justify-center items-center">
                  <Text className="text-slate-500">No trend data available</Text>
                </View>
              )}
            </View>
          </View>

          {/* Bar Chart */}
          <View className="mb-10">
            <Text className="text-slate-50 font-bold text-lg mb-4">Trips by Vehicle (Top 5)</Text>
            <View className="bg-slate-900 rounded-3xl p-4 border border-white/5 overflow-hidden">
              {performanceData?.tripsByVehicle && performanceData.tripsByVehicle.length > 0 ? (
                <BarChart
                  data={barChartData}
                  width={screenWidth - 80}
                  height={220}
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(168, 85, 247, ${opacity})`,
                  }}
                  verticalLabelRotation={30}
                  style={{
                    marginVertical: 8,
                    borderRadius: 16
                  }}
                />
              ) : (
                <View className="h-52 justify-center items-center">
                  <Text className="text-slate-500">No vehicle data available</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
