import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl, 
  ActivityIndicator, 
  StatusBar,
  ScrollView,
  Platform
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, Calendar, ChevronRight, History, Truck, Users } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authFetch } from '../../lib/authFetch';
import { TripBadge } from '../../components/trip/TripBadge';

type FilterType = 'all' | 'today' | '7days' | '30days' | 'custom';

export default function AdminTripsScreen() {
  const router = useRouter();
  
  // Defer rendering to avoid NativeWind CssInterop race condition
  const [mounted, setMounted] = useState(false);

  const [trips, setTrips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 7 * 24 * 3600000));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchAllTrips = async (filters?: { startDate?: string; endDate?: string }) => {
    setIsLoading(true);
    try {
      let url = '/trips/my';
      const queryParts: string[] = [];
      if (filters?.startDate) {
        queryParts.push(`startDate=${encodeURIComponent(filters.startDate)}`);
      }
      if (filters?.endDate) {
        queryParts.push(`endDate=${encodeURIComponent(filters.endDate)}`);
      }
      if (queryParts.length > 0) {
        url += `?${queryParts.join('&')}`;
      }

      const response = await authFetch(url);
      if (response.ok) {
        const result = await response.json();
        const rawTrips = result?.data ?? result;
        setTrips(Array.isArray(rawTrips) ? rawTrips : []);
      }
    } catch (err) {
      console.log('[AdminTripsScreen] Fetch failed:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;

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

    fetchAllTrips({ startDate: startStr, endDate: endStr });
  }, [mounted, activeFilter, startDate, endDate]);

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

    await fetchAllTrips({ startDate: startStr, endDate: endStr });
  }, [activeFilter, startDate, endDate]);

  const renderTripItem = ({ item }: { item: any }) => {
    const date = new Date(item.createdAt);
    const orderCount = item.tripOrders?.length || 0;
    const driverName = item.driver?.user?.fullName || 'Chưa gán tài xế';
    const plateNumber = item.vehicle?.plateNumber || 'Chưa gán xe';

    return (
      <TouchableOpacity
        onPress={() => router.push(`/trip/${item.id}`)}
        className="bg-slate-900/60 border border-white/5 p-4 rounded-2xl mb-4 flex-row items-center justify-between"
        activeOpacity={0.7}
      >
        <View className="flex-1 pr-2">
          <View className="flex-row items-center gap-2 mb-2 flex-wrap">
            <Text className="text-white text-sm font-mono font-bold">Trip: #{item.id.substring(0, 8).toUpperCase()}</Text>
            <TripBadge status={item.status} />
          </View>

          <View className="space-y-1">
            <View className="flex-row items-center gap-1.5">
              <Users size={12} color="#94a3b8" />
              <Text className="text-slate-300 text-xs font-semibold">{driverName}</Text>
            </View>

            <View className="flex-row items-center gap-1.5">
              <Truck size={12} color="#94a3b8" />
              <Text className="text-slate-300 text-xs font-semibold">Xe: {plateNumber}</Text>
            </View>

            <View className="flex-row items-center gap-1.5">
              <Calendar size={12} color="#94a3b8" />
              <Text className="text-slate-400 text-[11px] font-medium">
                {date.toLocaleDateString('vi-VN')} {date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-4 mt-3 pt-3 border-t border-white/5">
            <View>
              <Text className="text-slate-500 text-[8px] font-bold uppercase tracking-wider">Số đơn hàng</Text>
              <Text className="text-white text-xs font-extrabold mt-0.5">{orderCount} đơn</Text>
            </View>
            <View>
              <Text className="text-slate-500 text-[8px] font-bold uppercase tracking-wider">Quãng đường</Text>
              <Text className="text-white text-xs font-extrabold mt-0.5">{item.totalDistanceKm || 0} km</Text>
            </View>
          </View>
        </View>

        <View className="bg-white/5 w-8 h-8 rounded-full items-center justify-center border border-white/10 ml-2">
          <ChevronRight size={16} color="#94a3b8" />
        </View>
      </TouchableOpacity>
    );
  };

  // First render: show a plain loading screen without className (avoids CssInterop race condition)
  if (!mounted) {
    return (
      <View style={{ flex: 1, backgroundColor: '#020617' }}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <Stack.Screen options={{ headerShown: false }} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top']}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="px-6 py-4 flex-row items-center">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-slate-800 justify-center items-center mr-4 border border-slate-700"
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-bold text-slate-50">Lịch sử chuyến đi</Text>
          <Text className="text-slate-400 text-xs">Quản lý & Giám sát vận hành</Text>
        </View>
      </View>

      {/* Quick Date Filters Pills */}
      <View className="px-6 mb-4 mt-2">
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
                className={isActive 
                  ? "px-4 py-2.5 rounded-full border bg-indigo-600 border-indigo-500" 
                  : "px-4 py-2.5 rounded-full border bg-slate-900/60 border-white/5"
                }
                activeOpacity={0.7}
              >
                <Text className={isActive ? "text-xs font-bold text-white" : "text-xs font-bold text-slate-400"}>
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
            className="flex-1 bg-slate-900/40 border border-white/5 p-3 rounded-2xl flex-row items-center justify-between"
            activeOpacity={0.7}
          >
            <View>
              <Text className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Từ ngày</Text>
              <Text className="text-white text-xs font-bold mt-0.5">{startDate.toLocaleDateString('vi-VN')}</Text>
            </View>
            <Calendar size={14} color="#10b981" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowPicker('end')}
            className="flex-1 bg-slate-900/40 border border-white/5 p-3 rounded-2xl flex-row items-center justify-between"
            activeOpacity={0.7}
          >
            <View>
              <Text className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Đến ngày</Text>
              <Text className="text-white text-xs font-bold mt-0.5">{endDate.toLocaleDateString('vi-VN')}</Text>
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

      {isLoading && !refreshing && trips.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="text-slate-400 mt-4 font-bold text-sm tracking-widest uppercase">Đang tải danh sách...</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          renderItem={renderTripItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor="#6366f1"
              colors={["#6366f1"]}
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center mt-20 px-12">
              <View className="w-24 h-24 bg-slate-900/40 rounded-[36px] justify-center items-center mb-6 border border-white/5">
                <History size={36} color="#475569" />
              </View>
              <Text className="text-white text-2xl font-black text-center tracking-tight mb-2">Trống</Text>
              <Text className="text-slate-500 text-[12px] text-center leading-5 font-medium">
                {activeFilter === 'all' 
                  ? "Không tìm thấy chuyến đi nào trong hệ thống."
                  : "Không tìm thấy chuyến đi nào trong khoảng thời gian đã chọn."
                }
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}