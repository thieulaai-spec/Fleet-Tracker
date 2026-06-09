import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl, 
  ActivityIndicator, 
  StatusBar,
  TextInput
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, History, Search, X } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authFetch } from '../../lib/authFetch';
import { TripFilterPills } from '../../components/admin/trip/TripFilterPills';
import { CustomDatePickerRange } from '../../components/admin/trip/CustomDatePickerRange';
import { AdminTripCard } from '../../components/admin/trip/AdminTripCard';

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
  const [searchText, setSearchText] = useState('');

  const filteredTrips = trips.filter((trip) => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase().trim();
    
    const tripId = trip.id.toLowerCase();
    const tripIdMatch = tripId.includes(searchLower.replace(/^#/, ''));
    
    const driverName = trip.driver?.user?.fullName || '';
    const driverMatch = driverName.toLowerCase().includes(searchLower);
    
    const plateNumber = trip.vehicle?.plateNumber || '';
    const vehicleMatch = plateNumber.toLowerCase().includes(searchLower);
    
    return tripIdMatch || driverMatch || vehicleMatch;
  });

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

      {/* Search Bar */}
      <View className="px-6 mb-4">
        <View className="flex-row items-center bg-slate-900/60 border border-white/5 px-3 rounded-2xl h-12">
          <Search size={18} color="#94a3b8" />
          <TextInput
            className="flex-1 text-white text-sm ml-2.5 h-full"
            placeholder="Tìm kiếm trip ID, tài xế, biển số xe..."
            placeholderTextColor="#64748b"
            value={searchText}
            onChangeText={setSearchText}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchText.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchText('')}
              activeOpacity={0.7}
              className="p-1"
            >
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Date Filters Pills */}
      <TripFilterPills
        activeFilter={activeFilter}
        onSelectFilter={(filter) => setActiveFilter(filter)}
      />

      {/* Custom Range picker buttons */}
      {activeFilter === 'custom' && (
        <CustomDatePickerRange
          startDate={startDate}
          endDate={endDate}
          onShowPicker={(type) => setShowPicker(type)}
        />
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
          data={filteredTrips}
          renderItem={({ item }) => (
            <AdminTripCard
              item={item}
              onPress={() => router.push(`/trip/${item.id}`)}
            />
          )}
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
                {searchText
                  ? `Không tìm thấy chuyến đi nào khớp với "${searchText}".`
                  : activeFilter === 'all' 
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