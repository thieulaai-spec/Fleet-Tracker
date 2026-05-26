import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  BarChart2, 
  TrendingUp, 
  Fuel, 
  Users, 
  Truck,
  Activity
} from 'lucide-react-native';
import { ReportCard } from '../../../components/admin/dashboard/ReportCard';

export default function ReportsOverviewScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="px-6 py-4 flex-row items-center">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-slate-900 justify-center items-center mr-4"
        >
          <ArrowLeft size={20} color="#f8fafc" />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-bold text-slate-50">Reports & Analytics</Text>
          <Text className="text-slate-400 text-xs">Fleet performance insights</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 mt-4" showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-4">Core Performance</Text>
          
          <ReportCard 
            title="Trip Statistics"
            subtitle="Daily volume and distance trends"
            icon={TrendingUp}
            color="#6366f1"
            onPress={() => router.push('/admin/reports/trips' as any)}
          />

          <ReportCard 
            title="Driver Ranking"
            subtitle="KPIs and performance scores"
            icon={Users}
            color="#10b981"
            onPress={() => router.push('/admin/reports/kpi' as any)}
          />
        </View>

        <View className="mb-6">
          <Text className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-4">Operations</Text>
          
          <ReportCard 
            title="Vehicle Utilization"
            subtitle="Efficiency and capacity logs"
            icon={Truck}
            color="#f59e0b"
            onPress={() => router.push('/admin/reports/utilization' as any)}
          />

          <ReportCard 
            title="Fuel Consumption"
            subtitle="Cost analysis and efficiency"
            icon={Fuel}
            color="#ef4444"
            onPress={() => router.push('/admin/reports/fuel' as any)}
          />
        </View>

        <View className="bg-indigo-600/10 rounded-3xl p-6 border border-indigo-500/20 mb-10">
          <View className="flex-row items-center mb-3">
            <Activity size={20} color="#6366f1" />
            <Text className="text-indigo-400 font-bold ml-2">Smart Insights</Text>
          </View>
          <Text className="text-slate-300 text-sm leading-5">
            Your fleet completion rate is up by 12% this week. Consider assigning more orders to top-ranked drivers to maintain efficiency.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
