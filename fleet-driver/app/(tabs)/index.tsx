import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  SectionList, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
  StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Truck, 
  MapPin, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Navigation,
  Calendar,
  Box,
  TrendingUp,
  Package,
  Route
} from 'lucide-react-native';
import { useTripStore } from '../../store/useTripStore';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import Toast from 'react-native-toast-message';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export default function TripsScreen() {
  const pendingTrips = useTripStore(state => state.pendingTrips);
  const activeTrip = useTripStore(state => state.activeTrip);
  const tripHistory = useTripStore(state => state.tripHistory);
  const fetchTrips = useTripStore(state => state.fetchTrips);
  const acceptTrip = useTripStore(state => state.acceptTrip);
  const rejectTrip = useTripStore(state => state.rejectTrip);
  const isLoading = useTripStore(state => state.isLoading);

  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchTrips();
  }, []);

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
              await acceptTrip(id);
              Toast.show({
                type: 'success',
                text1: 'Trip Accepted',
                text2: 'You have accepted the assignment.'
              });
              router.push('/(tabs)/map');
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
    
    const createdAtDate = new Date(item.createdAt);
    const dateStr = createdAtDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = createdAtDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View className="px-6 mb-6">
        <TouchableOpacity 
          className={`bg-[#0f172a]/60 rounded-[40px] overflow-hidden border border-white/10 ${isActive ? 'border-indigo-500/50 border-2' : ''}`}
          activeOpacity={0.9}
          onPress={() => isActive && router.push('/(tabs)/map')}
        >
          {Platform.OS === 'ios' && (
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          )}
          <View className="p-8">
            {/* Glow effect for active trip */}
            {isActive && (
              <View className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
            )}

            {/* Card Header */}
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center gap-4">
                <View className={`w-12 h-12 rounded-2xl justify-center items-center ${isActive ? 'bg-indigo-500 shadow-xl shadow-indigo-500/50' : 'bg-slate-800/80 border border-white/5'}`}>
                  <Truck size={24} color="#fff" strokeWidth={2.5} />
                </View>
                <View>
                  <Text className="text-white font-black text-lg tracking-tight">Trip #{item.id.substring(0, 8).toUpperCase()}</Text>
                  <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[1.5px]">{dateStr} • {timeStr}</Text>
                </View>
              </View>
              
              <View className={`px-4 py-1.5 rounded-full border ${
                isActive ? 'bg-indigo-500/20 border-indigo-500/30' : 
                isHistory ? (item.status === 'completed' ? 'bg-emerald-500/15 border-emerald-500/25' : 'bg-red-500/15 border-red-500/25') :
                'bg-amber-500/15 border-amber-500/25'
              }`}>
                <Text className={`text-[10px] font-black uppercase tracking-widest ${
                  isActive ? 'text-indigo-400' : 
                  isHistory ? (item.status === 'completed' ? 'text-emerald-400' : 'text-red-400') :
                  'text-amber-400'
                }`}>
                  {isActive ? 'Live' : item.status.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Path Info */}
            <View className="flex-row mb-8 px-1">
              <View className="items-center w-6 mr-5">
                <View className="w-4 h-4 rounded-full bg-indigo-500 border-4 border-slate-900 z-10 shadow-sm" />
                <View className="w-px flex-1 bg-slate-800 my-1 border-l border-white/10" />
                <View className="w-4 h-4 rounded-lg bg-emerald-500 border-4 border-slate-900 z-10 shadow-sm" />
              </View>
              <View className="flex-1 gap-6">
                <View>
                  <Text className="text-slate-500 text-[9px] font-black uppercase tracking-[2px] mb-1">Origin Hub</Text>
                  <Text className="text-white text-[15px] font-bold" numberOfLines={1}>Global Logistics Center - A4</Text>
                </View>
                <View>
                  <Text className="text-slate-500 text-[9px] font-black uppercase tracking-[2px] mb-1">Final Destination</Text>
                  <Text className="text-white text-[15px] font-bold" numberOfLines={1}>
                    {item.orders?.length > 0 ? item.orders[item.orders.length - 1].address : 'Unassigned Destination'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Footer Stats */}
            <View className="flex-row items-center justify-between pt-5 border-t border-white/5">
              <View className="flex-row gap-6">
                <View className="flex-row items-center gap-2">
                  <View className="bg-white/5 p-2 rounded-xl border border-white/5">
                    <Package size={16} color="#818cf8" strokeWidth={2} />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-xs">{item.orders?.length || 0}</Text>
                    <Text className="text-slate-600 text-[8px] font-black uppercase tracking-widest">Orders</Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="bg-white/5 p-2 rounded-xl border border-white/5">
                    <Route size={16} color="#10b981" strokeWidth={2} />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-xs">{item.totalDistanceKm || 0}</Text>
                    <Text className="text-slate-600 text-[8px] font-black uppercase tracking-widest">KM</Text>
                  </View>
                </View>
              </View>

              {isActive && (
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={() => router.push('/(tabs)/map')}
                  className="bg-indigo-500/10 pl-4 pr-3 py-2.5 rounded-2xl flex-row items-center gap-2 border border-indigo-500/20"
                >
                  <Text className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Active Map</Text>
                  <ChevronRight size={14} color="#818cf8" strokeWidth={2.5} />
                </TouchableOpacity>
              )}
            </View>

            {/* Actions for Pending */}
            {section.title === 'Pending Trips' && (
              <View className="flex-row gap-4 mt-8">
                <TouchableOpacity 
                  activeOpacity={0.6}
                  className="flex-1 bg-slate-800/30 h-14 rounded-2xl justify-center items-center border border-white/5"
                  onPress={() => handleRejectTrip(item.id)}
                  disabled={isLoading}
                >
                  <Text className="text-slate-500 font-black uppercase tracking-widest text-xs">Decline</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  activeOpacity={0.8}
                  className="flex-[2] h-14 rounded-2xl justify-center items-center shadow-2xl shadow-indigo-500/30 overflow-hidden"
                  onPress={() => handleAcceptTrip(item.id)}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={['#6366f1', '#4f46e5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <View className="flex-row items-center gap-2">
                      <CheckCircle2 size={16} color="#fff" strokeWidth={2.5} />
                      <Text className="text-white font-black text-xs uppercase tracking-[2px]">Accept Assignment</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  }, [isLoading, router]);

  const sections = [
    ...(activeTrip ? [{ title: 'Active Trip', data: [activeTrip] }] : []),
    ...(pendingTrips.length > 0 ? [{ title: 'Pending Trips', data: pendingTrips }] : []),
    ...(tripHistory.length > 0 ? [{ title: 'Trip History', data: tripHistory.slice(0, 5) }] : []),
  ];

  return (
    <View className="flex-1 bg-[#020617]">
      <StatusBar barStyle="light-content" />
      
      {/* Background Decorative Elements */}
      <View className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]" />
      <View className="absolute bottom-[-150px] left-[-150px] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]" />

      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-8 pt-8 pb-4 flex-row justify-between items-end">
          <View>
            <View className="flex-row items-center gap-2 mb-2">
              <View className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500" />
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
              <ActivityIndicator size="large" color="#6366f1" />
            </View>
            <Text className="text-indigo-400 font-black tracking-[4px] uppercase text-[10px]">Synchronizing Fleet</Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            renderItem={renderTripCard}
            renderSectionHeader={({ section: { title } }) => (
              <View className="px-8 pt-10 pb-6 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className={`w-2 h-2 rounded-full ${title === 'Active Trip' ? 'bg-indigo-500 shadow-lg shadow-indigo-500' : 'bg-slate-700'}`} />
                  <Text className="text-[12px] font-black text-slate-400 uppercase tracking-[2px]">{title}</Text>
                </View>
                {title === 'Trip History' && (
                  <TouchableOpacity activeOpacity={0.6}>
                    <Text className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">History Log</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 140 }}
            stickySectionHeadersEnabled={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
            }
            ListEmptyComponent={
              <View className="items-center justify-center mt-20 px-12">
                <View className="w-28 h-28 bg-[#0f172a] rounded-[45px] justify-center items-center mb-8 border border-white/5 shadow-2xl">
                  <Calendar size={40} color="#334155" strokeWidth={1.5} />
                </View>
                <Text className="text-white text-3xl font-black text-center tracking-tight mb-3">All Clear</Text>
                <Text className="text-slate-500 text-[13px] text-center leading-5 font-medium">No new assignments scheduled. Enjoy your downtime or force a sync to check again.</Text>
                
                <TouchableOpacity 
                  activeOpacity={0.7}
                  className="mt-12 bg-indigo-500/10 px-10 py-5 rounded-xl border border-indigo-500/20"
                  onPress={onRefresh}
                >
                  <Text className="text-indigo-400 font-black uppercase tracking-[2px] text-xs">Request Update</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}
