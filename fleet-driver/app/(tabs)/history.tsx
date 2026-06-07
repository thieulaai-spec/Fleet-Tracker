import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl, 
  ActivityIndicator, 
  SafeAreaView, 
  StatusBar,
  ScrollView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { History, Navigation, Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTripStore } from '../../store/useTripStore';
import { TripCard } from '../../components/trip/TripCard';
import { ConnectionStatus } from '../../components/ui/ConnectionStatus';

type FilterType = 'all' | 'today' | '7days' | '30days' | 'custom';

export default function TripHistoryTab() {
  const router = useRouter();
  const tripHistory = useTripStore(state => state.tripHistory);
  const fetchTrips = useTripStore(state => state.fetchTrips);
  const isLoading = useTripStore(state => state.isLoading);
  
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 7 * 24 * 3600000));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  // Synchronize filter selection and date updates with API
  useEffect(() => {
    let startStr: string | undefined;
    let endStr: string | undefined;

    const today = new Date();
    
    if (activeFilter === 'today') {
      const d = new Date();
      startStr = d.toISOString().split('T')[0];
      endStr = d.toISOString().split('T')[0];
    } else if (activeFilter === '7days') {
      const d = new Date(Date.now() - 7 * 24 * 3600000);
      startStr = d.toISOString().split('T')[0];
      endStr = today.toISOString().split('T')[0];
    } else if (activeFilter === '30days') {
      const d = new Date(Date.now() - 30 * 24 * 3600000);
      startStr = d.toISOString().split('T')[0];
      endStr = today.toISOString().split('T')[0];
    } else if (activeFilter === 'custom') {
      startStr = startDate.toISOString().split('T')[0];
      endStr = endDate.toISOString().split('T')[0];
    }

    fetchTrips({ startDate: startStr, endDate: endStr });
  }, [activeFilter, startDate, endDate]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    let startStr: string | undefined;
    let endStr: string | undefined;

    const today = new Date();
    
    if (activeFilter === 'today') {
      const d = new Date();
      startStr = d.toISOString().split('T')[0];
      endStr = d.toISOString().split('T')[0];
    } else if (activeFilter === '7days') {
      const d = new Date(Date.now() - 7 * 24 * 3600000);
      startStr = d.toISOString().split('T')[0];
      endStr = today.toISOString().split('T')[0];
    } else if (activeFilter === '30days') {
      const d = new Date(Date.now() - 30 * 24 * 3600000);
      startStr = d.toISOString().split('T')[0];
      endStr = today.toISOString().split('T')[0];
    } else if (activeFilter === 'custom') {
      startStr = startDate.toISOString().split('T')[0];
      endStr = endDate.toISOString().split('T')[0];
    }

    await fetchTrips({ startDate: startStr, endDate: endStr });
    setRefreshing(false);
  }, [fetchTrips, activeFilter, startDate, endDate]);

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
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Background Decorative Elements */}
      <View className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]" />
      <View className="absolute bottom-[-150px] left-[-150px] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]" />
      
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-4 flex-row justify-between items-end">
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

        {/* Quick Date Filters Pills */}
        <View className="px-6 mb-4">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: 20 }}
          >
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'today', label: 'Hôm nay' },
              { id: '7days', label: '7 ngày qua' },
              { id: '30days', label: '30 ngày qua' },
              { id: 'custom', label: 'Tùy chỉnh' },
            ].map((f) => {
              const isActive = activeFilter === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setActiveFilter(f.id as FilterType)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 9999,
                    borderWidth: 1,
                    backgroundColor: isActive ? '#059669' : 'rgba(248, 250, 252, 0.6)',
                    borderColor: isActive ? '#10b981' : 'rgba(15, 23, 42, 0.05)',
                    shadowColor: isActive ? '#10b981' : 'transparent',
                    shadowOffset: isActive ? { width: 0, height: 4 } : { width: 0, height: 0 },
                    shadowOpacity: isActive ? 0.3 : 0,
                    shadowRadius: isActive ? 6 : 0,
                    elevation: isActive ? 4 : 0,
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: isActive ? '#0f172a' : '#475569' }}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Custom Range picker buttons */}
        {activeFilter === 'custom' && (
          <View className="px-6 mb-4 flex-row gap-3">
            <TouchableOpacity
              onPress={() => setShowPicker('start')}
              style={{
                flex: 1,
                backgroundColor: 'rgba(248, 250, 252, 0.4)',
                borderColor: 'rgba(15, 23, 42, 0.05)',
                borderWidth: 1,
                padding: 12,
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              activeOpacity={0.7}
            >
              <View>
                <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', color: '#64748b', letterSpacing: 0.8 }}>Từ ngày</Text>
                <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: 'bold', marginTop: 2 }}>{startDate.toLocaleDateString('vi-VN')}</Text>
              </View>
              <Calendar size={14} color="#10b981" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowPicker('end')}
              style={{
                flex: 1,
                backgroundColor: 'rgba(248, 250, 252, 0.4)',
                borderColor: 'rgba(15, 23, 42, 0.05)',
                borderWidth: 1,
                padding: 12,
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              activeOpacity={0.7}
            >
              <View>
                <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', color: '#64748b', letterSpacing: 0.8 }}>Đến ngày</Text>
                <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: 'bold', marginTop: 2 }}>{endDate.toLocaleDateString('vi-VN')}</Text>
              </View>
              <Calendar size={14} color="#10b981" />
            </TouchableOpacity>
          </View>
        )}

        {/* Date Picker Component */}
        {showPicker && (
          <DateTimePicker
            value={showPicker === 'start' ? startDate : endDate}
            mode="date"
            display="default"
            maximumDate={new Date()}
            minimumDate={showPicker === 'end' ? startDate : undefined}
            onChange={(event, date) => {
              setShowPicker(null);
              if (date) {
                if (showPicker === 'start') {
                  if (date > endDate) {
                    setEndDate(date);
                  }
                  setStartDate(date);
                } else {
                  setEndDate(date);
                }
              }
            }}
          />
        )}

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
                  {activeFilter === 'all' 
                    ? "Bạn chưa hoàn thành chuyến đi nào. Lịch sử hành trình sẽ hiển thị tại đây sau khi hoàn thành."
                    : "Không tìm thấy chuyến đi nào trong khoảng thời gian đã chọn."
                  }
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}
