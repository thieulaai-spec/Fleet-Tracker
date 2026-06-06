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
  Package, 
  Search, 
  Plus, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Scale,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock3,
  Timer,
  User
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useOrderStore, OrderStatus, Order } from '../../store/useOrderStore';

const STATUS_CONFIG = {
  [OrderStatus.PENDING]: { label: 'Pending', color: '#f59e0b', icon: Clock3 },
  [OrderStatus.ASSIGNED]: { label: 'Assigned', color: '#6366f1', icon: Package },
  [OrderStatus.PICKED_UP]: { label: 'Picked Up', color: '#8b5cf6', icon: MapPin },
  [OrderStatus.DELIVERING]: { label: 'Delivering', color: '#0ea5e9', icon: MapPin },
  [OrderStatus.DELIVERED]: { label: 'Delivered', color: '#10b981', icon: CheckCircle2 },
  [OrderStatus.FAILED]: { label: 'Failed', color: '#ef4444', icon: AlertCircle },
  [OrderStatus.CANCELLED]: { label: 'Cancelled', color: '#94a3b8', icon: XCircle },
};

const FILTER_STATUSES = [
  OrderStatus.PENDING,
  OrderStatus.ASSIGNED,
  OrderStatus.DELIVERING,
  OrderStatus.DELIVERED,
  OrderStatus.FAILED,
];

// ─── Countdown helper ───────────────────────────────────────────────
function useCountdown(deadline?: string) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!deadline) { setRemaining(null); return; }
    const calc = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      setRemaining(diff);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return remaining;
}

function formatCountdown(ms: number | null): { text: string; color: string } {
  if (ms === null) return { text: '', color: '#64748b' };
  if (ms <= 0) return { text: 'Overdue', color: '#ef4444' };
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const color = ms < 3600_000 ? '#ef4444' : ms < 7_200_000 ? '#f59e0b' : '#10b981';
  if (d > 0) return { text: `${d}d ${h}h ${m}m`, color };
  if (h > 0) return { text: `${h}h ${m}m ${s}s`, color };
  return { text: `${m}m ${s}s`, color };
}

// ─── OrderCardItem (needs hooks → must be a proper component) ─────────
function OrderCardItem({ item, onPress }: { item: Order; onPress: () => void }) {
  const config = STATUS_CONFIG[item.status] || STATUS_CONFIG[OrderStatus.PENDING];
  const StatusIcon = config.icon;
  const remaining = useCountdown(item.deliveryDeadline);
  const countdown = formatCountdown(remaining);
  const isActive = ![OrderStatus.DELIVERED, OrderStatus.FAILED, OrderStatus.CANCELLED].includes(item.status);

  return (
    <TouchableOpacity
      className="bg-slate-800 rounded-3xl p-5 mb-4 border border-white/10"
      onPress={onPress}
    >
      {/* Header row: ORDER ID + recipient + status */}
      <View className="flex-row justify-between items-start mb-4">
        <View className="gap-[2px] flex-1 mr-4">
          <Text className="text-[10px] text-slate-500 font-bold tracking-wider">ORDER ID</Text>
          <Text className="text-sm text-slate-50 font-bold">#{item.id.slice(0, 8).toUpperCase()}</Text>
          {item.recipientName ? (
            <View className="flex-row items-center gap-1 mt-1">
              <User size={11} color="#6366f1" />
              <Text className="text-indigo-300 text-[11px] font-semibold" numberOfLines={1}>
                {item.recipientName}
              </Text>
            </View>
          ) : null}
        </View>
        <View className="flex-row items-center px-[10px] py-1 rounded-xl gap-1.5" style={{ backgroundColor: `${config.color}20` }}>
          <StatusIcon size={14} color={config.color} />
          <Text className="text-xs font-bold" style={{ color: config.color }}>{config.label}</Text>
        </View>
      </View>

      {/* Route */}
      <View className="mb-5">
        <View className="flex-row items-center gap-3">
          <View className="w-2 h-2 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
          <Text className="text-slate-300 text-sm flex-1" numberOfLines={1}>{item.pickupAddress}</Text>
        </View>
        <View className="w-[2px] h-3 bg-white/10 ml-[3px] my-1" />
        <View className="flex-row items-center gap-3">
          <View className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10b981' }} />
          <Text className="text-slate-300 text-sm flex-1" numberOfLines={1}>{item.deliveryAddress}</Text>
        </View>
      </View>

      {/* Footer: weight + countdown/date + chevron */}
      <View className="flex-row items-center pt-4 border-t border-white/5 gap-3">
        <View className="flex-row items-center gap-1.5">
          <Scale size={16} color="#94a3b8" />
          <Text className="text-slate-400 text-[13px] font-semibold">{item.weightKg} kg</Text>
        </View>
        {item.deliveryDeadline && isActive ? (
          <View className="flex-row items-center gap-1.5 flex-1">
            <Timer size={14} color={countdown.color} />
            <Text className="text-[12px] font-bold" style={{ color: countdown.color }} numberOfLines={1}>
              {countdown.text}
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center gap-1.5 flex-1">
            <Clock size={16} color="#94a3b8" />
            <Text className="text-slate-400 text-[13px] font-semibold">
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        )}
        <ChevronRight size={20} color="#475569" />
      </View>
    </TouchableOpacity>
  );
}

export default function AdminOrdersScreen() {
  const router = useRouter();
  const { status } = useLocalSearchParams<{ status?: string }>();
  const { orders, loading, fetchOrders } = useOrderStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');

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
      
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, searchQuery, selectedStatus]);

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
      {/* Decorative premium gradient background */}
      <LinearGradient
        colors={['#e6fcf0', '#f1f5f9', '#ffffff']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 0.8 }}
      />
      {/* Soft blurred decorative glowing mint/emerald circles */}
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
          >
            <Plus size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View className="px-5 mb-4">
          <BlurView intensity={40} tint="light" className="flex-row items-center rounded-2xl px-4 h-[52px] border border-white/10 overflow-hidden">
            <Search size={20} color="#64748b" className="mr-3" />
            <TextInput
              placeholder="Search orders, addresses..."
              placeholderTextColor="#64748b"
              className="flex-1 text-slate-50 text-base"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </BlurView>
        </View>

        <View className="mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
            <TouchableOpacity 
              className={`px-4 py-2 rounded-full bg-slate-800 border border-white/5 ${
                selectedStatus === 'all' ? 'bg-indigo-500 border-indigo-500' : ''
              }`}
              onPress={() => setSelectedStatus('all')}
            >
              <Text className={`font-semibold text-sm ${
                selectedStatus === 'all' ? 'text-white' : 'text-slate-400'
              }`}>All</Text>
            </TouchableOpacity>
            {FILTER_STATUSES.map((status) => {
              const config = STATUS_CONFIG[status];
              return (
                <TouchableOpacity 
                  key={status}
                  className={`px-4 py-2 rounded-full bg-slate-800 border border-white/5 ${
                    selectedStatus === status ? 'bg-indigo-500 border-indigo-500' : ''
                  }`}
                  onPress={() => setSelectedStatus(status)}
                >
                  <Text className={`font-semibold text-sm ${
                    selectedStatus === status ? 'text-white' : 'text-slate-400'
                  }`}>
                    {config?.label || status}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

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
                <Text className="text-slate-50 text-xl font-bold">No Orders Found</Text>
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

