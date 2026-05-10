import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SectionList, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Truck, MapPin, ChevronRight, Clock, CheckCircle2, AlertCircle, History, RefreshCw, AlertTriangle, WifiOff } from 'lucide-react-native';
import { useTripStore, TripStatus } from '../../store/useTripStore';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import Toast from 'react-native-toast-message';

export default function TripsScreen() {
  const { 
    pendingTrips, 
    activeTrip, 
    tripHistory,
    fetchTrips, 
    acceptTrip, 
    rejectTrip,
    isLoading,
    error 
  } = useTripStore();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchTrips();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTrips();
    setRefreshing(false);
  };

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

  const renderTripCard = ({ item, section }: { item: any, section: any }) => {
    const isActive = section.title === 'Active Trip';
    const isHistory = section.title === 'Trip History';

    return (
      <TouchableOpacity 
        style={[styles.card, isActive && styles.activeCard, isHistory && styles.historyCard]}
        disabled={!isActive && !isHistory}
        onPress={() => isActive && router.push('/(tabs)/map')}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.tripIdBadge, isActive && styles.activeBadge]}>
            <Text style={[styles.tripIdText, isActive && styles.activeBadgeText]}>
              {item.id.substring(0, 8)}
            </Text>
          </View>
          <Text style={styles.timeText}>
            {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.routeInfo}>
            <View style={styles.iconColumn}>
              <MapPin size={18} color={isActive ? "#6366f1" : "#94a3b8"} />
              <View style={styles.dotLine} />
              <MapPin size={18} color="#10b981" />
            </View>
            <View style={styles.addressColumn}>
              <Text style={styles.addressText} numberOfLines={1}>Warehouse Alpha</Text>
              <Text style={styles.addressSubtext}>Pickup Point</Text>
              <View style={styles.spacer} />
              <Text style={styles.addressText} numberOfLines={1}>
                {item.orders?.length > 0 ? item.orders[item.orders.length - 1].address : 'No orders'}
              </Text>
              <Text style={styles.addressSubtext}>Final Delivery</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Truck size={14} color="#94a3b8" />
              <Text style={styles.statLabel}>{item.orders?.length || 0} Orders</Text>
            </View>
            <View style={styles.statItem}>
              <Clock size={14} color="#94a3b8" />
              <Text style={styles.statLabel}>{item.totalDistanceKm || 0} km</Text>
            </View>
            {isHistory && (
              <View style={[styles.statusTag, { backgroundColor: item.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                <Text style={[styles.statusTagText, { color: item.status === 'completed' ? '#10b981' : '#ef4444' }]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {section.title === 'Pending Trips' && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.rejectButton}
              onPress={() => handleRejectTrip(item.id)}
              disabled={isLoading}
            >
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.acceptButton}
              onPress={() => handleAcceptTrip(item.id)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.acceptButtonText}>Accept Trip</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {isActive && (
          <View style={styles.activeFooter}>
            <Text style={styles.activeFooterText}>Tap to continue delivery</Text>
            <ChevronRight size={16} color="#6366f1" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const sections = [
    ...(activeTrip ? [{ title: 'Active Trip', data: [activeTrip] }] : []),
    ...(pendingTrips.length > 0 ? [{ title: 'Pending Trips', data: pendingTrips }] : []),
    ...(tripHistory.length > 0 ? [{ title: 'Trip History', data: tripHistory.slice(0, 5) }] : []),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Trips</Text>
          <ConnectionStatus />
        </View>
        <Text style={styles.headerSubtitle}>View and manage your assignments</Text>
      </View>

      {isLoading && !refreshing && sections.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <SectionList
          sections={sections}
          renderItem={renderTripCard}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{title}</Text>
            </View>
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AlertCircle size={48} color="#334155" />
              <Text style={styles.emptyText}>No trips assigned at the moment</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 12,
    borderRadius: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    flex: 1,
  },
  activeTripBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIcon: {
    marginRight: 12,
  },
  bannerTitle: {
    color: '#f8fafc',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bannerSubtitle: {
    color: '#6366f1',
    fontSize: 12,
  },
  list: {
    padding: 20,
    paddingTop: 0,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  activeCard: {
    borderColor: '#6366f1',
    borderWidth: 2,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  historyCard: {
    opacity: 0.8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tripIdBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadge: {
    backgroundColor: '#6366f1',
  },
  activeBadgeText: {
    color: '#fff',
  },
  tripIdText: {
    color: '#6366f1',
    fontWeight: 'bold',
    fontSize: 12,
  },
  timeText: {
    color: '#64748b',
    fontSize: 12,
  },
  cardBody: {
    marginBottom: 20,
  },
  routeInfo: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  iconColumn: {
    alignItems: 'center',
    width: 20,
    marginRight: 15,
  },
  dotLine: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    marginVertical: 4,
  },
  addressColumn: {
    flex: 1,
  },
  addressText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '500',
  },
  addressSubtext: {
    color: '#64748b',
    fontSize: 12,
  },
  spacer: {
    height: 15,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 2,
    backgroundColor: '#6366f1',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: 'transparent',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  rejectButtonText: {
    color: '#94a3b8',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: '#64748b',
    marginTop: 15,
    fontSize: 16,
  },
  activeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.2)',
    gap: 8,
  },
  activeFooterText: {
    color: '#6366f1',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionHeader: {
    paddingVertical: 10,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
