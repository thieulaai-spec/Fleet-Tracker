import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  SectionList, 
  RefreshControl,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTripStore } from '../../store/useTripStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ConnectionStatus } from '../../components/ui/ConnectionStatus';
import Toast from 'react-native-toast-message';
import { authFetch } from '../../lib/authFetch';

import { TripCard } from '../../components/trip/TripCard';
import { EmptyTrips } from '../../components/trip/EmptyTrips';
import { TripSectionHeader } from '../../components/trip/TripSectionHeader';

export default function TripsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const pendingTrips = useTripStore(state => state.pendingTrips);
  const activeTrip = useTripStore(state => state.activeTrip);
  const tripHistory = useTripStore(state => state.tripHistory);
  const fetchTrips = useTripStore(state => state.fetchTrips);
  const acceptTrip = useTripStore(state => state.acceptTrip);
  const rejectTrip = useTripStore(state => state.rejectTrip);
  const isLoading = useTripStore(state => state.isLoading);

  const [refreshing, setRefreshing] = useState(false);

  const fingerprintIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const startFingerprintCheck = () => {
    if (fingerprintIntervalRef.current) {
      clearInterval(fingerprintIntervalRef.current);
    }

    Toast.show({
      type: 'info',
      text1: 'Yêu cầu đăng ký vân tay 👤',
      text2: 'Vui lòng đặt ngón tay lên cảm biến AS608 trên xe để hoàn tất đăng ký.',
      visibilityTime: 4000
    });

    let checkCount = 0;

    fingerprintIntervalRef.current = setInterval(async () => {
      try {
        const response = await authFetch('/auth/me');
        if (response.ok) {
          const data = await response.json();
          const userData = data?.data ?? data;
          
          if (userData?.driver?.fingerprintId) {
            useAuthStore.getState().updateUser({ driver: userData.driver });
            
            if (fingerprintIntervalRef.current) {
              clearInterval(fingerprintIntervalRef.current);
              fingerprintIntervalRef.current = null;
            }
            
            Toast.hide();
            Toast.show({
              type: 'success',
              text1: 'Đăng ký thành công 🎉',
              text2: 'Vân tay của bạn đã được ghi nhận vào hệ thống.',
              visibilityTime: 5000
            });
          } else {
            checkCount++;
            // Only show UI Toast warning every 3 cycles (15 seconds) to prevent layout lag & overlaps
            if (checkCount % 3 === 0) {
              Toast.hide();
              Toast.show({
                type: 'info',
                text1: 'Nhắc nhở đăng ký vân tay 👤',
                text2: 'Vui lòng đặt ngón tay lên cảm biến AS608 trên xe.',
                visibilityTime: 3000
              });
            }
          }
        }
      } catch (error) {
        console.error('Error checking fingerprint status:', error);
      }
    }, 5000);
  };

  useEffect(() => {
    return () => {
      if (fingerprintIntervalRef.current) {
        clearInterval(fingerprintIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (user?.role?.toUpperCase() === 'ADMIN') {
      router.replace('/(tabs)/admin-dashboard');
      return;
    }
    fetchTrips();
  }, [user]);

  useEffect(() => {
    if (user?.role?.toUpperCase() === 'ADMIN') return;

    if (!isLoading) {
      if (activeTrip && !user?.driver?.fingerprintId) {
        if (!fingerprintIntervalRef.current) {
          startFingerprintCheck();
        }
      } else {
        if (fingerprintIntervalRef.current) {
          clearInterval(fingerprintIntervalRef.current);
          fingerprintIntervalRef.current = null;
          Toast.hide();
        }
      }
    }
  }, [user, activeTrip, isLoading]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchTrips();
    setRefreshing(false);
  }, [fetchTrips]);

  const handleAcceptTrip = (id: string) => {
    Alert.alert(
      'Accept Trip',
      'Are you sure you want to accept this trip assignment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Accept', 
          onPress: async () => {
            try {
              const hasFingerprint = !!user?.driver?.fingerprintId;
              await acceptTrip(id);
              
              if (!hasFingerprint) {
                Alert.alert(
                  'Đăng ký vân tay lần đầu 👤',
                  'Tài xế mới! Hệ thống phát hiện bạn chưa đăng ký vân tay. Vui lòng đặt ngón tay lên cảm biến AS608 trên xe để hoàn tất đăng ký vân tay trước khi tiến hành lấy hàng.',
                  [
                    { 
                      text: 'Đã hiểu', 
                      onPress: () => {
                        startFingerprintCheck();
                        router.push('/(tabs)/map');
                      } 
                    }
                  ]
                );
              } else {
                Toast.show({
                  type: 'success',
                  text1: 'Trip Accepted',
                  text2: 'You have accepted the assignment.'
                });
                router.push('/(tabs)/map');
              }
            } catch (err: any) {
              Toast.show({
                type: 'error',
                text1: 'Failed to Accept',
                text2: err.message
              });
            }
          } 
        },
      ]
    );
  };

  const handleRejectTrip = (id: string) => {
    Alert.alert(
      'Reject Trip',
      'Are you sure you want to reject this trip? This will return it to the pending pool.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reject', 
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectTrip(id);
              Toast.show({
                type: 'info',
                text1: 'Trip Rejected',
                text2: 'The assignment has been returned.'
              });
            } catch (err: any) {
              Toast.show({
                type: 'error',
                text1: 'Failed to Reject',
                text2: err.message
              });
            }
          } 
        },
      ]
    );
  };

  const renderTripCard = React.useCallback(({ item, section }: { item: any, section: any }) => {
    const isActive = section.title === 'Active Trip';
    const isHistory = section.title === 'Trip History';
    const isPending = section.title === 'Pending Trips';

    const handlePress = () => {
      if (isActive) {
        router.push('/(tabs)/map');
      } else if (isHistory || isPending) {
        router.push(`/trip/${item.id}`);
      }
    };

    return (
      <TripCard 
        item={item} 
        section={section} 
        onPress={handlePress}
        onAccept={handleAcceptTrip}
        onReject={handleRejectTrip}
        isLoading={isLoading}
      />
    );
  }, [isLoading, router]);

  const sections = [
    ...(activeTrip ? [{ title: 'Active Trip', data: [activeTrip] }] : []),
    ...(pendingTrips.length > 0 ? [{ title: 'Pending Trips', data: pendingTrips }] : []),
    ...(tripHistory.length > 0 ? [{ title: 'Trip History', data: tripHistory.slice(0, 5) }] : []),
  ];

  return (
    <View className="flex-1 bg-slate-950">
      <StatusBar barStyle="dark-content" />
      
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
            <Text className="text-5xl font-black text-white tracking-tighter">My Trips</Text>
          </View>
          <View className="pb-2">
            <ConnectionStatus />
          </View>
        </View>

        {isLoading && !refreshing && sections.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <View className="w-20 h-20 bg-indigo-500/10 rounded-3xl items-center justify-center border border-indigo-500/20 mb-6">
              <ActivityIndicator size="large" color="#10b981" />
            </View>
            <Text className="text-indigo-400 font-black tracking-[4px] uppercase text-[10px]">Synchronizing Fleet</Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            renderItem={renderTripCard}
            renderSectionHeader={({ section: { title } }) => <TripSectionHeader title={title} />}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 140 }}
            stickySectionHeadersEnabled={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
            }
            ListEmptyComponent={<EmptyTrips onRefresh={onRefresh} />}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

