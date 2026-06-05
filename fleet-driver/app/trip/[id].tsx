import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking, Platform, RefreshControl, Image, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { MapPin, Calendar, Clock, ChevronLeft, Package, Truck, CheckCircle2, AlertTriangle, Navigation, Camera, Fuel, Route, Fingerprint, FileText, UserCheck, Check } from 'lucide-react-native';
import { useTripStore, TripStatus, OrderStatus } from '../../store/useTripStore';
import Toast from 'react-native-toast-message';
import { SosButton } from '../../components/ui/SosButton';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { TripBadge } from '../../components/trip/TripBadge';
import { OrderCard } from '../../components/trip/OrderCard';
import { TripSummaryCard } from '../../components/trip/TripSummaryCard';

export default function TripDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { fetchTripDetails, updateTripStatus, updateOrderStatus, activeTrip, pendingTrips, tripHistory, isLoading: isStoreLoading } = useTripStore();
  
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
      // Fallback to local store
      const localFound = (activeTrip?.id === id ? activeTrip : null) || 
                         pendingTrips.find(t => t.id === id) || 
                         tripHistory.find(t => t.id === id);
      if (localFound) {
        setTrip(localFound);
      }
    } finally {
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
                // Refresh data to reflect in-progress state
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
      <View className="flex-1 bg-slate-950 justify-center items-center">
        <Stack.Screen options={{ title: 'Loading...', headerShown: true }} />
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-slate-400 mt-4 font-bold text-sm tracking-widest uppercase">Đang tải dữ liệu chuyến đi...</Text>
      </View>
    );
  }

  if (!trip) {
    return (
      <View className="flex-1 bg-slate-950 justify-center items-center px-10">
        <Stack.Screen options={{ title: 'Trip Not Found', headerShown: true }} />
        <AlertTriangle size={64} color="#ef4444" />
        <Text className="text-red-500 text-center mt-5 text-lg font-medium">Chuyến đi không tìm thấy hoặc đã bị xóa.</Text>
        <TouchableOpacity 
          className="mt-8 bg-indigo-500 px-8 py-3 rounded-xl"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold">Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCompletedTrip = trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED;

  return (
    <View className="flex-1 bg-slate-950">
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <Stack.Screen options={{ 
        headerShown: true, 
        title: isCompletedTrip ? 'LỊCH SỬ CHUYẾN ĐI' : 'CHI TIẾT CHUYẾN ĐI',
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: { color: '#0f172a', fontWeight: '900', fontSize: 16 },
        headerTintColor: '#0f172a',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} className="ml-2 p-2 bg-slate-800 rounded-full">
            <ChevronLeft color="#0f172a" size={20} />
          </TouchableOpacity>
        )
      }} />

      <View className="flex-1">
        {/* Background Decorative Elements */}
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

          {/* Trip Timeline Node Grid (Premium UI for history) */}
          {isCompletedTrip && (
            <BlurView 
              intensity={10} 
              tint="light" 
              className="rounded-[32px] p-6 mb-8 border border-white/5 overflow-hidden"
            >
              <Text className="text-white text-base font-black italic mb-5 uppercase tracking-tight">Timeline hành trình</Text>
              
              <View className="gap-5">
                {/* Node 1: Dispatch */}
                <View className="flex-row gap-4">
                  <View className="items-center">
                    <View className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 items-center justify-center">
                      <Calendar size={14} color="#818cf8" />
                    </View>
                    <View className="w-px flex-1 bg-white/10 my-1" />
                  </View>
                  <View className="flex-1 pb-1">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-0.5">Bàn giao</Text>
                    <Text className="text-white text-sm font-bold">Chuyến đi được tạo & điều phối</Text>
                    <Text className="text-slate-500 text-[11px] mt-0.5">
                      {new Date(trip.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                    </Text>
                  </View>
                </View>

                {/* Node 2: Start */}
                {trip.startedAt && (
                  <View className="flex-row gap-4">
                    <View className="items-center">
                      <View className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 items-center justify-center">
                        <Truck size={14} color="#60a5fa" />
                      </View>
                      {trip.completedAt && <View className="w-px flex-1 bg-white/10 my-1" />}
                    </View>
                    <View className="flex-1 pb-1">
                      <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-0.5">Bắt đầu di chuyển</Text>
                      <Text className="text-white text-sm font-bold">Rời trạm & bắt đầu giao hàng</Text>
                      <Text className="text-slate-500 text-[11px] mt-0.5">
                        {new Date(trip.startedAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Node 3: Complete */}
                {trip.completedAt && (
                  <View className="flex-row gap-4">
                    <View className="items-center">
                      <View className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 items-center justify-center">
                        <CheckCircle2 size={14} color="#10b981" />
                      </View>
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-0.5">
                        {trip.status === TripStatus.COMPLETED ? 'Hoàn thành' : 'Hủy chuyến'}
                      </Text>
                      <Text className={trip.status === TripStatus.COMPLETED ? 'text-emerald-400 text-sm font-bold' : 'text-rose-400 text-sm font-bold'}>
                        {trip.status === TripStatus.COMPLETED ? 'Giao tất cả đơn hàng thành công' : 'Chuyến đi đã bị hủy'}
                      </Text>
                      <Text className="text-slate-500 text-[11px] mt-0.5">
                        {new Date(trip.completedAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                      </Text>
                      
                      {getTripDuration() && (
                        <View className="bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl self-start mt-2">
                          <Text className="text-emerald-400 text-[10px] font-black uppercase">
                            Thời gian vận hành: {getTripDuration()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>
            </BlurView>
          )}

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

          {/* Stats Summary */}
          <TripSummaryCard 
            totalDistanceKm={trip.totalDistanceKm} 
            estimatedFuelCost={trip.estimatedFuelCost}
          />

          {/* Action Buttons (Only for non-completed active trip) */}
          {!isCompletedTrip && activeTrip?.id === id && (
            <View className="mt-10 gap-4">
              {trip.status === TripStatus.ACCEPTED && (
                <TouchableOpacity 
                  activeOpacity={0.9}
                  onPress={() => handleStatusUpdate(TripStatus.IN_PROGRESS)}
                  disabled={isStoreLoading}
                >
                  <LinearGradient
                    colors={["#6366f1", "#4f46e5"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="h-20 rounded-[32px] flex-row items-center justify-center gap-4 shadow-xl shadow-indigo-500/40"
                  >
                    {isStoreLoading ? <ActivityIndicator color="#fff" /> : (
                      <>
                        <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                          <Truck size={20} color="#fff" />
                        </View>
                        <Text className="text-white text-xl font-black italic tracking-widest">BẮT ĐẦU VẬN CHUYỂN</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {trip.status === TripStatus.IN_PROGRESS && (
                <TouchableOpacity 
                  activeOpacity={0.9}
                  onPress={() => handleStatusUpdate(TripStatus.COMPLETED)}
                  disabled={isStoreLoading}
                >
                  <LinearGradient
                    colors={["#10b981", "#059669"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="h-20 rounded-[32px] flex-row items-center justify-center gap-4 shadow-xl shadow-emerald-500/40"
                  >
                    {isStoreLoading ? <ActivityIndicator color="#fff" /> : (
                      <>
                        <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                          <CheckCircle2 size={20} color="#fff" />
                        </View>
                        <Text className="text-white text-xl font-black italic tracking-widest">HOÀN THÀNH CHUYẾN ĐI</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              )}
              
              <SosButton tripId={id as string} />
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
