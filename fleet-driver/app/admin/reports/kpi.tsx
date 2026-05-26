import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Filter, RefreshCw, Trophy } from 'lucide-react-native';
import { useReportStore } from '../../../store/useReportStore';
import { KPIRankingItem } from '../../../components/admin/dashboard/KPIRankingItem';
import { ExportButton } from '../../../components/admin/dashboard/ExportButton';

export default function KPIRankingScreen() {
  const router = useRouter();
  const { driverKPIs, loading, fetchDriverKPIs } = useReportStore();

  useEffect(() => {
    fetchDriverKPIs();
  }, []);

  const sortedKPIs = [...driverKPIs].sort((a, b) => b.score - a.score);

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-slate-900 justify-center items-center mr-4"
          >
            <ArrowLeft size={20} color="#f8fafc" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold text-slate-50">Driver Ranking</Text>
            <Text className="text-slate-400 text-xs">KPI Performance Score</Text>
          </View>
        </View>
        <ExportButton reportName="driver-kpis" color="#10b981" />
      </View>

      <ScrollView className="flex-1 px-6 mt-4" showsVerticalScrollIndicator={false}>
        {/* Top 3 Spotlight */}
        {sortedKPIs.length >= 3 && !loading && (
          <View className="flex-row justify-center items-end mb-8 mt-4 h-48">
            {/* Rank 2 */}
            <View className="items-center mx-2">
              <View className="bg-slate-800 w-20 h-24 rounded-t-2xl justify-center items-center border-t border-x border-slate-700/50 relative">
                <View className="absolute -top-6 w-12 h-12 rounded-full bg-slate-700 border-2 border-slate-600 justify-center items-center overflow-hidden">
                   <Text className="text-white font-bold text-lg">{sortedKPIs[1].driverName[0]}</Text>
                </View>
                <Text className="text-slate-300 font-bold text-[10px] mt-4">{sortedKPIs[1].driverName.split(' ').pop()}</Text>
                <Text className="text-slate-400 font-black text-lg">2</Text>
              </View>
            </View>

            {/* Rank 1 */}
            <View className="items-center mx-2">
              <Trophy size={24} color="#f59e0b" className="mb-2" />
              <View className="bg-indigo-600 w-24 h-32 rounded-t-2xl justify-center items-center border-t border-x border-indigo-500/50 shadow-xl shadow-indigo-500/30 relative">
                <View className="absolute -top-8 w-16 h-16 rounded-full bg-slate-800 border-4 border-indigo-500 justify-center items-center overflow-hidden">
                   <Text className="text-white font-bold text-2xl">{sortedKPIs[0].driverName[0]}</Text>
                </View>
                <Text className="text-white font-bold text-xs mt-6">{sortedKPIs[0].driverName.split(' ').pop()}</Text>
                <Text className="text-white font-black text-2xl">1</Text>
              </View>
            </View>

            {/* Rank 3 */}
            <View className="items-center mx-2">
              <View className="bg-slate-800 w-20 h-20 rounded-t-2xl justify-center items-center border-t border-x border-slate-700/50 relative">
                <View className="absolute -top-6 w-12 h-12 rounded-full bg-slate-700 border-2 border-slate-600 justify-center items-center overflow-hidden">
                   <Text className="text-white font-bold text-lg">{sortedKPIs[2].driverName[0]}</Text>
                </View>
                <Text className="text-slate-300 font-bold text-[10px] mt-4">{sortedKPIs[2].driverName.split(' ').pop()}</Text>
                <Text className="text-slate-400 font-black text-lg">3</Text>
              </View>
            </View>
          </View>
        )}

        <View className="mb-4 flex-row justify-between items-center">
          <Text className="text-slate-500 font-bold text-xs uppercase tracking-widest">Full Ranking List</Text>
          <TouchableOpacity className="flex-row items-center">
            <Filter size={14} color="#6366f1" />
            <Text className="text-indigo-400 text-xs font-bold ml-1">Filter</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#6366f1" className="mt-10" />
        ) : (
          sortedKPIs.map((kpi, index) => (
            <KPIRankingItem key={kpi.driverId} kpi={kpi} rank={index + 1} />
          ))
        )}

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
