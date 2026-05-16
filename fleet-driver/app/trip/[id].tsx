import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { MapPin, Calendar, Clock, ChevronLeft, Package, Truck, CheckCircle2, AlertTriangle, Navigation, Camera, Fuel, Route } from 'lucide-react-native';
import { useTripStore, TripStatus } from '../../store/useTripStore';
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
  const { tripHistory, activeTrip, pendingTrips, updateTripStatus, updateOrderStatus, isLoading } = useTripStore();
  
  const trip = activeTrip?.id === id ? activeTrip : 
               pendingTrips.find(t => t.id === id) || 
               tripHistory.find(t => t.id === id);

  if (!trip) {
    return (
      <View className="flex-1 bg-slate-950 justify-center items-center px-10">
        <Stack.Screen options={{ title: 'Trip Not Found', headerShown: true }} />
        <AlertTriangle size={64} color="#ef4444" />
        <Text className="text-red-500 text-center mt-5 text-lg font-medium">Trip not found or has been removed.</Text>
        <TouchableOpacity 
          className="mt-8 bg-indigo-500 px-8 py-3 rounded-xl"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleStatusUpdate = (newStatus: TripStatus) => {
    Alert.alert(
      'Update Status',
      `Change trip status to ${newStatus.replace('_', ' ')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            try {
              await updateTripStatus(trip.id, newStatus);
              Toast.show({
                type: 'success',
                text1: 'Status Updated',
                text2: `Trip is now ${newStatus.replace('_', ' ')}`
              });
              if (newStatus === TripStatus.COMPLETED) {
                router.replace('/(tabs)');
              }
            } catch (err: any) {
              Toast.show({
                type: 'error',
                text1: 'Update Failed',
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
        Alert.alert('Error', 'Could not open map application');
      });
    }
  };

  return (
    <View className="flex-1 bg-slate-950">
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'TRIP DETAILS',
        headerStyle: { backgroundColor: '#0f172a' },
        headerTitleStyle: { color: '#fff', fontWeight: '900', fontSize: 16 },
        headerTintColor: '#fff',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} className="ml-2 p-2 bg-white/5 rounded-full">
            <ChevronLeft color="#fff" size={20} />
          </TouchableOpacity>
        )
      }} />

      <LinearGradient colors={["#0f172a", "#1e293b"]} className="flex-1">
        {/* Background Glow */}
        <View className="absolute top-[-50px] right-[-50px] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px]" />
        
        <ScrollView 
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Info */}
          <View className="flex-row justify-between items-end mb-8">
            <View className="flex-1 mr-4">
              <Text className="text-slate-500 text-xs font-black tracking-[2px] uppercase mb-1">TRIP ID</Text>
              <Text className="text-white text-3xl font-black italic" numberOfLines={1}>#{trip.id.substring(0, 8).toUpperCase()}</Text>
            </View>
            <TripBadge status={trip.status} />
          </View>

          {/* Quick Info Card */}
          <BlurView 
            intensity={20} 
            tint="dark" 
            className="rounded-[32px] p-6 mb-8 border border-white/10 overflow-hidden"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-4">
                <View className="w-12 h-12 rounded-2xl bg-indigo-500/20 items-center justify-center border border-indigo-500/30">
                  <Calendar size={22} color="#818cf8" />
                </View>
                <View>
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-0.5">DATE</Text>
                  <Text className="text-white text-base font-bold">{new Date(trip.createdAt).toLocaleDateString()}</Text>
                </View>
              </View>
              <View className="w-px h-10 bg-white/10" />
              <View className="flex-row items-center gap-4">
                <View className="w-12 h-12 rounded-2xl bg-blue-500/20 items-center justify-center border border-blue-500/30">
                  <Clock size={22} color="#60a5fa" />
                </View>
                <View>
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-0.5">TIME</Text>
                  <Text className="text-white text-base font-bold">{new Date(trip.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              </View>
            </View>
          </BlurView>

          {/* Orders Section */}
          <View className="flex-row items-center gap-2 mb-4 ml-1">
            <Package size={16} color="#6366f1" />
            <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px]">DELIVERIES ({trip.orders.length})</Text>
          </View>

          {trip.orders.map((order, index) => (
            <OrderCard 
              key={order.id}
              order={order}
              index={index}
              onNavigate={openNavigation}
              onProof={(orderId) => router.push({ pathname: '/camera', params: { orderId } })}
              onStatusUpdate={updateOrderStatus}
              canSubmitProof={trip.status === TripStatus.IN_PROGRESS}
            />
          ))}

          {/* Stats Summary */}
          <TripSummaryCard totalDistanceKm={trip.totalDistanceKm} />

          {/* Action Buttons */}
          {activeTrip?.id === id && (
            <View className="mt-10 gap-4">
              {trip.status === TripStatus.ACCEPTED && (
                <TouchableOpacity 
                  activeOpacity={0.9}
                  onPress={() => handleStatusUpdate(TripStatus.IN_PROGRESS)}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={["#6366f1", "#4f46e5"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="h-20 rounded-[32px] flex-row items-center justify-center gap-4 shadow-xl shadow-indigo-500/40"
                  >
                    {isLoading ? <ActivityIndicator color="#fff" /> : (
                      <>
                        <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                          <Truck size={20} color="#fff" />
                        </View>
                        <Text className="text-white text-xl font-black italic tracking-widest">START DELIVERY</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {trip.status === TripStatus.IN_PROGRESS && (
                <TouchableOpacity 
                  activeOpacity={0.9}
                  onPress={() => handleStatusUpdate(TripStatus.COMPLETED)}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={["#10b981", "#059669"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="h-20 rounded-[32px] flex-row items-center justify-center gap-4 shadow-xl shadow-emerald-500/40"
                  >
                    {isLoading ? <ActivityIndicator color="#fff" /> : (
                      <>
                        <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                          <CheckCircle2 size={20} color="#fff" />
                        </View>
                        <Text className="text-white text-xl font-black italic tracking-widest">COMPLETE TRIP</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              )}
              
              <SosButton tripId={id as string} />
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
