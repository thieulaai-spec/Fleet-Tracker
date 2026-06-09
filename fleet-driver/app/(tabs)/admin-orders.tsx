import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  StyleSheet
} from 'react-native';
import { 
  Search, 
  Plus, 
  Calendar,
  Package
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useOrderStore, OrderStatus, Order } from '../../store/useOrderStore';
import { OrderCardItem } from '../../components/admin/order/OrderCardItem';
import { OrderFilterPills } from '../../components/admin/order/OrderFilterPills';

type FilterDateType = 'all' | 'today' | '7days' | '30days' | 'custom';

export default function AdminOrdersScreen() {
  const router = useRouter();
  const { status } = useLocalSearchParams<{ status?: string }>();
  const { orders, loading, fetchOrders } = useOrderStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [activeDateFilter, setActiveDateFilter] = useState<FilterDateType>('all');
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    if (activeDateFilter === 'all') {
      setStartDate(null);
      setEndDate(null);
    } else if (activeDateFilter === 'today') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      setStartDate(start);
      setEndDate(end);
    } else if (activeDateFilter === '7days') {
      const start = new Date(Date.now() - 7 * 24 * 3600000);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      setStartDate(start);
      setEndDate(end);
    } else if (activeDateFilter === '30days') {
      const start = new Date(Date.now() - 30 * 24 * 3600000);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      setStartDate(start);
      setEndDate(end);
    }
  }, [activeDateFilter]);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (status) {
      setSelectedStatus(status as OrderStatus | 'all');
    }
  }, [status]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const id = order?.id || '';
      const pickupAddress = order?.pickupAddress || '';
      const deliveryAddress = order?.deliveryAddress || '';
      const matchesSearch = 
        id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pickupAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
      
      let matchesDate = true;
      if (order.createdAt) {
        const orderTime = new Date(order.createdAt).getTime();
        if (startDate && orderTime < startDate.getTime()) {
          matchesDate = false;
        }
        if (endDate && orderTime > endDate.getTime()) {
          matchesDate = false;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, searchQuery, selectedStatus, startDate, endDate]);

  const renderOrderCard = useCallback(({ item }: { item: Order }) => (
    <OrderCardItem
      item={item}
      onPress={() => router.push({
        pathname: '/admin/orders/[id]',
        params: { id: item.id }
      })}
    />
  ), [router]);

  return (
    <View className="flex-1 bg-slate-950">
      <LinearGradient
        colors={['#e6fcf0', '#f1f5f9', '#ffffff']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 0.8 }}
      />
      <View 
        style={{
          position: 'absolute',
          top: -80,
          right: -80,
          width: 280,
          height: 280,
          borderRadius: 140,
          backgroundColor: '#34d399',
          opacity: 0.15,
        }}
      />
      <View 
        style={{
          position: 'absolute',
          top: 250,
          left: -120,
          width: 300,
          height: 300,
          borderRadius: 150,
          backgroundColor: '#10b981',
          opacity: 0.1,
        }}
      />
      <View 
        style={{
          position: 'absolute',
          bottom: 100,
          right: -100,
          width: 320,
          height: 320,
          borderRadius: 160,
          backgroundColor: '#a7f3d0',
          opacity: 0.2,
        }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row justify-between items-center px-5 pt-[10px] mb-5">
          <View>
            <Text className="text-base text-slate-400 font-medium">Logistics</Text>
            <Text className="text-3xl font-bold text-slate-50">Order Fleet</Text>
          </View>
          <TouchableOpacity 
            className="bg-indigo-500 w-12 h-12 rounded-2xl justify-center items-center shadow-lg shadow-indigo-500/30"
            onPress={() => router.push('/admin/orders/create')}
            activeOpacity={0.7}
          >
            <Plus size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View className="px-5 mb-4">
          <BlurView intensity={40} tint="light" className="w-full flex-row items-center rounded-2xl px-4 h-[52px] border border-white/10 overflow-hidden">
            <Search size={20} color="#64748b" className="mr-3" />
            <TextInput
              placeholder="Search orders, addresses..."
              placeholderTextColor="#64748b"
              className="flex-1 text-slate-50 text-base h-full"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </BlurView>
        </View>

        <OrderFilterPills
          activeDateFilter={activeDateFilter}
          onSelectDateFilter={(filter) => setActiveDateFilter(filter)}
          selectedStatus={selectedStatus}
          onSelectStatus={(status) => setSelectedStatus(status)}
        />

        {/* Custom Range picker buttons */}
        {activeDateFilter === 'custom' && (
          <View className="px-5 mb-4 flex-row gap-3">
            <TouchableOpacity
              onPress={() => setShowPicker('start')}
              className="flex-1 bg-slate-900/40 border border-white/5 p-3 rounded-2xl flex-row items-center justify-between"
              activeOpacity={0.7}
            >
              <View>
                <Text className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Từ ngày</Text>
                <Text className="text-white text-xs font-bold mt-0.5">
                  {startDate ? startDate.toLocaleDateString('vi-VN') : '--/--/----'}
                </Text>
              </View>
              <Calendar size={14} color="#10b981" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowPicker('end')}
              className="flex-1 bg-slate-900/40 border border-white/5 p-3 rounded-2xl flex-row items-center justify-between"
              activeOpacity={0.7}
            >
              <View>
                <Text className="text-[8px] font-black uppercase text-slate-550 tracking-wider">Đến ngày</Text>
                <Text className="text-white text-xs font-bold mt-0.5">
                  {endDate ? endDate.toLocaleDateString('vi-VN') : '--/--/----'}
                </Text>
              </View>
              <Calendar size={14} color="#10b981" />
            </TouchableOpacity>
          </View>
        )}

        {/* Date Picker Component */}
        {showPicker && (
          <DateTimePicker
            value={showPicker === 'start' ? (startDate || new Date()) : (endDate || new Date())}
            mode="date"
            display="default"
            maximumDate={new Date()}
            minimumDate={showPicker === 'end' ? (startDate || undefined) : undefined}
            onChange={(event, date) => {
              setShowPicker(null);
              if (date) {
                if (showPicker === 'start') {
                  const start = new Date(date);
                  start.setHours(0, 0, 0, 0);
                  if (endDate && start > endDate) {
                    setEndDate(start);
                  }
                  setStartDate(start);
                } else {
                  const end = new Date(date);
                  end.setHours(23, 59, 59, 999);
                  setEndDate(end);
                }
              }
            }}
          />
        )}

        <FlatList
          data={filteredOrders}
          renderItem={renderOrderCard}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl 
              refreshing={loading} 
              onRefresh={fetchOrders} 
              tintColor="#059669"
            />
          }
          ListEmptyComponent={
            !loading ? (
              <View className="items-center justify-center mt-20 gap-4">
                <Package size={64} color="#1e293b" />
                <Text className="text-slate-550 text-xl font-bold">No Orders Found</Text>
                <Text className="text-slate-500 text-base">Try adjusting your search or filters</Text>
              </View>
            ) : (
              <ActivityIndicator size="large" color="#059669" style={{ marginTop: 40 }} />
            )
          }
        />
      </SafeAreaView>
    </View>
  );
}
