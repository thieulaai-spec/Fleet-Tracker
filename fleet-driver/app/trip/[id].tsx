import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, Linking, Platform, RefreshControl, StatusBar, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Calendar, Clock, Package, AlertTriangle } from 'lucide-react-native';
import { useTripStore, TripStatus, OrderStatus } from '../../store/useTripStore';
import { useAuthStore } from '../../store/useAuthStore';
import Toast from 'react-native-toast-message';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TripBadge } from '../../components/trip/TripBadge';
import { OrderCard } from '../../components/trip/OrderCard';
import { TripSummaryCard } from '../../components/trip/TripSummaryCard';
import { TripHeader } from '../../components/trip/TripHeader';
import { TripTimeline } from '../../components/trip/TripTimeline';
import { TripActions } from '../../components/trip/TripActions';

export default function TripDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { 
    fetchTripDetails, 
    updateTripStatus, 
    updateOrderStatus, 
    activeTrip, 
    pendingTrips, 
    tripHistory, 
    acceptTrip, 
    rejectTrip, 
    isLoading: isStoreLoading 
  } = useTripStore();
  
  const [trip, setTrip] = useState<any>(null);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (showRefresher = false) => {
    if (showRefresher) {
      setRefreshing(true);
    } else {
      setLocalLoading(true);
    }

    try {
      const data = await fetchTripDetails(id as string);
      setTrip(data.trip);
      setVerifications(data.verifications);
    } catch (err: any) {
      console.error('Failed to load trip details from API:', err);
      const localFound = (activeTrip?.id === id ? activeTrip : null) || 
                         pendingTrips.find(t => t.id === id) || 
                         tripHistory.find(t => t.id === id);
      if (localFound) {
        setTrip(localFound);
      }
    } fillAll: {
      setLocalLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleStatusUpdate = (newStatus: TripStatus) => {
    Alert.alert(
      'Cập nhật trạng thái',
      `Thay đổi trạng thái chuyến đi thành ${newStatus === TripStatus.IN_PROGRESS ? 'BẮT ĐẦU VẬN CHUYỂN' : 'HOÀN THÀNH'}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xác nhận', 
          onPress: async () => {
            try {
              await updateTripStatus(trip.id, newStatus);
              Toast.show({
                type: 'success',
                text1: 'Đã cập nhật',
                text2: `Trạng thái chuyến đi hiện tại: ${newStatus.toUpperCase()}`
              });
              if (newStatus === TripStatus.COMPLETED) {
                router.replace('/(tabs)');
              } else {
                loadData();
              }
            } catch (err: any) {
              Toast.show({
                type: 'error',
                text1: 'Cập nhật thất bại',
                text2: err.message
              });
            }
          }
        },
      ]
    );
  };

  const handleOrderStatusUpdate = async (orderId: string, status: OrderStatus, options?: any) => {
    try {
      await updateOrderStatus(orderId, status, options);
      await loadData();
    } catch (err) {
      throw err;
    }
  };

  const handleAcceptTrip = () => {
    if (!trip) return;

    Alert.alert(
      'Chấp nhận chuyến đi',
      'Bạn có chắc chắn muốn chấp nhận chuyến đi này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Chấp nhận', 
          onPress: async () => {
            try {
              const hasFingerprint = !!useAuthStore.getState().user?.driver?.fingerprintId;
              await acceptTrip(trip.id);
              
              if (!hasFingerprint) {
                Alert.alert(
                  'Đăng ký vân tay lần đầu 👤',
                  'Tài xế mới! Hệ thống phát hiện bạn chưa đăng ký vân tay. Vui lòng đặt ngón tay lên cảm biến AS608 trên xe để hoàn tất đăng ký vân tay trước khi tiến hành lấy hàng.',
                  [
                    { 
                      text: 'Đã hiểu', 
                      onPress: () => {
                        router.push('/(tabs)/map');
                      } 
                    }
                  ]
                );
              } else {
                Toast.show({
                  type: 'success',
                  text1: 'Đã nhận chuyến 🎉',
                  text2: 'Chuyến đi đã được chấp nhận thành công.'
                });
                router.push('/(tabs)/map');
              }
            } catch (err: any) {
              Toast.show({
                type: 'error',
                text1: 'Nhận chuyến thất bại',
                text2: err.message
              });
            }
          } 
        },
      ]
    );
  };

  const handleRejectTrip = () => {
    if (!trip) return;

    Alert.alert(
      'Từ chối chuyến đi',
      'Bạn có chắc chắn muốn từ chối chuyến đi này? Chuyến đi sẽ được chuyển lại phòng điều phối.',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Từ chối', 
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectTrip(trip.id);
              Toast.show({
                type: 'info',
                text1: 'Đã từ chối',
                text2: 'Chuyến đi đã được trả lại.'
              });
              router.replace('/(tabs)');
            } catch (err: any) {
              Toast.show({
                type: 'error',
                text1: 'Từ chối thất bại',
                text2: err.message
              });
            }
          } 
        },
      ]
    );
  };

  const openNavigation = (latitude: number, longitude: number) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}`,
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Lỗi', 'Không thể mở ứng dụng bản đồ');
      });
    }
  };

  const getTripDuration = () => {
    if (!trip || !trip.startedAt || !trip.completedAt) return null;
    const start = new Date(trip.startedAt).getTime();
    const end = new Date(trip.completedAt).getTime();
    const diffMs = end - start;
    if (diffMs <= 0) return null;
    
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (hours > 0) {
      return `${hours} giờ ${mins} phút`;
    }
    return `${mins} phút`;
  };

  if (localLoading && !trip) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 justify-center items-center" edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-slate-400 mt-4 font-bold text-sm tracking-widest uppercase">Đang tải dữ liệu chuyến đi...</Text>
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 justify-center items-center px-10" edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <AlertTriangle size={64} color="#ef4444" />
        <Text className="text-red-500 text-center mt-5 text-lg font-medium">Chuyến đi không tìm thấy hoặc đã bị xóa.</Text>
        <TouchableOpacity 
          className="mt-8 bg-indigo-500 px-8 py-3 rounded-xl"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold">Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isCompletedTrip = trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED;

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top']}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <Stack.Screen options={{ headerShown: false }} />
      
      <TripHeader
        onBack={() => router.back()}
        isCompletedTrip={isCompletedTrip}
      />

      <View className="flex-1">
        <View className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]" />
        <View className="absolute bottom-[-150px] left-[-150px] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]" />
        
        <ScrollView 
          contentContainerStyle={{ padding: 20, paddingTop: 32, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => loadData(true)} 
              tintColor="#6366f1"
              colors={["#6366f1"]}
            />
          }
        >
          {/* Header Info */}
          <View className="flex-row justify-between items-end mb-8">
            <View className="flex-1 mr-4">
              <Text className="text-slate-500 text-xs font-black tracking-[2px] uppercase mb-1">MÃ CHUYẾN ĐI</Text>
              <Text className="text-white text-3xl font-black italic" numberOfLines={1}>#{trip.id.substring(0, 8).toUpperCase()}</Text>
            </View>
            <TripBadge status={trip.status} />
          </View>

          {/* Quick Info Card */}
          <BlurView 
            intensity={20} 
            tint="light" 
            className="rounded-[32px] p-6 mb-8 border border-white/10 overflow-hidden"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-4">
                <View className="w-12 h-12 rounded-2xl bg-indigo-500/20 items-center justify-center border border-indigo-500/30">
                  <Calendar size={22} color="#818cf8" />
                </View>
                <View>
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-0.5">NGÀY TẠO</Text>
                  <Text className="text-white text-base font-bold">{new Date(trip.createdAt).toLocaleDateString('vi-VN')}</Text>
                </View>
              </View>
              <View className="w-px h-10 bg-white/10" />
              <View className="flex-row items-center gap-4">
                <View className="w-12 h-12 rounded-2xl bg-blue-500/20 items-center justify-center border border-blue-500/30">
                  <Clock size={22} color="#60a5fa" />
                </View>
                <View>
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-0.5">THỜI GIAN</Text>
                  <Text className="text-white text-base font-bold">{new Date(trip.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              </View>
            </View>
          </BlurView>

          <TripTimeline
            trip={trip}
            getTripDuration={getTripDuration}
          />

          {/* Orders Section */}
          <View className="flex-row items-center gap-2 mb-4 ml-1">
            <Package size={16} color="#6366f1" />
            <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px]">ĐƠN HÀNG CẦN GIAO ({trip.orders.length})</Text>
          </View>

          {trip.orders.map((order: any, index: number) => (
            <OrderCard 
              key={order.id}
              order={order}
              index={index}
              onNavigate={openNavigation}
              onProof={(orderId) => router.push({ pathname: '/camera', params: { orderId } })}
              onStatusUpdate={handleOrderStatusUpdate}
              canSubmitProof={trip.status === TripStatus.IN_PROGRESS}
              verifications={verifications}
            />
          ))}

          <TripSummaryCard 
            totalDistanceKm={trip.totalDistanceKm} 
            estimatedFuelCost={trip.estimatedFuelCost}
          />

          <TripActions
            trip={trip}
            activeTrip={activeTrip}
            isStoreLoading={isStoreLoading}
            handleAcceptTrip={handleAcceptTrip}
            handleRejectTrip={handleRejectTrip}
            handleStatusUpdate={handleStatusUpdate}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
