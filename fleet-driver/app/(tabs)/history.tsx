import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl, 
  ActivityIndicator, 
  SafeAreaView, 
  StatusBar 
} from 'react-native';
import { useRouter } from 'expo-router';
import { History, Navigation } from 'lucide-react-native';
import { useTripStore } from '../../store/useTripStore';
import { TripCard } from '../../components/trip/TripCard';
import { ConnectionStatus } from '../../components/ui/ConnectionStatus';

export default function TripHistoryTab() {
  const router = useRouter();
  const tripHistory = useTripStore(state => state.tripHistory);
  const fetchTrips = useTripStore(state => state.fetchTrips);
  const isLoading = useTripStore(state => state.isLoading);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTrips();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchTrips();
    setRefreshing(false);
  }, [fetchTrips]);

  const renderHistoryItem = ({ item }: { item: any }) => {
    const section = { title: 'Trip History' };
    const handlePress = () => {
      router.push(`/trip/${item.id}`);
    };

    return (
      <TripCard 
        item={item} 
        section={section} 
        onPress={handlePress}
        isLoading={isLoading}
      />
    );
  };

  return (
    <View className="flex-1 bg-slate-950">
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      
      {/* Background Decorative Elements */}
      <View className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]" />
      <View className="absolute bottom-[-150px] left-[-150px] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]" />
      
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-8 pt-8 pb-4 flex-row justify-between items-end">
          <View>
            <View className="flex-row items-center gap-2 mb-2">
              <View className="w-2.5 h-2.5 rounded-full bg-indigo-500 border border-indigo-400/50" />
              <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[3px]">Operation Center</Text>
            </View>
            <Text className="text-5xl font-black text-white tracking-tighter">History</Text>
          </View>
          <View className="pb-2">
            <ConnectionStatus />
          </View>
        </View>

          {isLoading && !refreshing && tripHistory.length === 0 ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#10b981" />
              <Text className="text-slate-400 mt-4 font-bold text-sm tracking-widest uppercase">Đang tải lịch sử...</Text>
            </View>
          ) : (
            <FlatList
              data={tripHistory}
              renderItem={renderHistoryItem}
              keyExtractor={item => item.id}
              contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl 
                  refreshing={refreshing} 
                  onRefresh={onRefresh} 
                  tintColor="#10b981"
                  colors={["#10b981"]}
                />
              }
              ListEmptyComponent={
                <View className="items-center justify-center mt-20 px-12">
                  <View className="w-24 h-24 bg-slate-900/40 rounded-[36px] justify-center items-center mb-6 border border-white/5 shadow-2xl">
                    <History size={36} color="#475569" />
                  </View>
                  <Text className="text-white text-2xl font-black text-center tracking-tight mb-2">Trống</Text>
                  <Text className="text-slate-500 text-[12px] text-center leading-5 font-medium">
                    Bạn chưa hoàn thành chuyến đi nào. Lịch sử hành trình sẽ hiển thị tại đây sau khi hoàn thành.
                  </Text>
                </View>
              }
            />
          )}
      </SafeAreaView>
    </View>
  );
}
