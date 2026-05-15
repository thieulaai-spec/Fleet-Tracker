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
import { ConnectionStatus } from '../../components/ui/ConnectionStatus';
import Toast from 'react-native-toast-message';

import { TripCard } from '../../components/trip/TripCard';
import { EmptyTrips } from '../../components/trip/EmptyTrips';
import { TripSectionHeader } from '../../components/trip/TripSectionHeader';

export default function TripsScreen() {
  const router = useRouter();
  const pendingTrips = useTripStore(state => state.pendingTrips);
  const activeTrip = useTripStore(state => state.activeTrip);
  const tripHistory = useTripStore(state => state.tripHistory);
  const fetchTrips = useTripStore(state => state.fetchTrips);
  const acceptTrip = useTripStore(state => state.acceptTrip);
  const rejectTrip = useTripStore(state => state.rejectTrip);
  const isLoading = useTripStore(state => state.isLoading);

  const [refreshing, setRefreshing] = useState(false);

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
    return (
      <TripCard 
        item={item} 
        section={section} 
        onPress={() => isActive && router.push('/(tabs)/map')}
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
              <ActivityIndicator size="large" color="#6366f1" />
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
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
            }
            ListEmptyComponent={<EmptyTrips onRefresh={onRefresh} />}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

