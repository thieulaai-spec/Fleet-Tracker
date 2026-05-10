import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { MapPin, Calendar, Clock, ChevronLeft, Package, Truck, CheckCircle2, AlertTriangle, Navigation, Camera } from 'lucide-react-native';
import { useTripStore, TripStatus } from '../../store/useTripStore';
import Toast from 'react-native-toast-message';
import { SosButton } from '@/components/SosButton';

const getStatusColor = (status: TripStatus) => {
  switch (status) {
    case TripStatus.PENDING: return '#94a3b8';
    case TripStatus.ACCEPTED: return '#6366f1';
    case TripStatus.IN_PROGRESS: return '#3b82f6';
    case TripStatus.COMPLETED: return '#10b981';
    case TripStatus.CANCELLED: return '#ef4444';
    default: return '#94a3b8';
  }
};

export default function TripDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { tripHistory, activeTrip, pendingTrips, updateTripStatus, isLoading } = useTripStore();
  
  // Search in all categories
  const trip = activeTrip?.id === id ? activeTrip : 
               pendingTrips.find(t => t.id === id) || 
               tripHistory.find(t => t.id === id);

  if (!trip) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Trip Not Found', headerShown: true }} />
        <Text style={styles.errorText}>Trip not found or has been removed.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleStatusUpdate = (newStatus: TripStatus) => {
    Alert.alert(
      'Update Status',
      `Change trip status to ${newStatus}?`,
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
                text2: `Trip is now ${newStatus}`
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
    <View style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Trip Details',
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#fff',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
            <ChevronLeft color="#fff" size={24} />
          </TouchableOpacity>
        )
      }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.tripId}>#{trip.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) }]}>
            <Text style={styles.statusText}>{trip.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Calendar size={20} color="#94a3b8" />
            <Text style={styles.infoText}>{new Date(trip.createdAt).toLocaleDateString()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={20} color="#94a3b8" />
            <Text style={styles.infoText}>{new Date(trip.createdAt).toLocaleTimeString()}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Orders ({trip.orders.length})</Text>
        {trip.orders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Package size={20} color="#6366f1" />
              <Text style={styles.customerName}>{order.customerName}</Text>
            </View>
            <View style={styles.addressContainer}>
              <MapPin size={16} color="#ef4444" />
              <Text style={styles.addressText}>{order.address}</Text>
            </View>
            <View style={styles.orderFooter}>
              <View style={[styles.miniBadge, { backgroundColor: order.status === 'delivered' ? '#10b981' : '#f59e0b' }]}>
                <Text style={styles.miniBadgeText}>{order.status}</Text>
              </View>
              {order.deliveryLocation && (
                <TouchableOpacity 
                  style={styles.navigateMiniButton}
                  onPress={() => openNavigation(order.deliveryLocation!.latitude, order.deliveryLocation!.longitude)}
                >
                  <Navigation size={14} color="#6366f1" />
                  <Text style={styles.navigateMiniButtonText}>Navigate</Text>
                </TouchableOpacity>
              )}
              {trip.status === TripStatus.IN_PROGRESS && (
                <TouchableOpacity 
                  style={styles.cameraMiniButton}
                  onPress={() => router.push({ pathname: '/camera', params: { orderId: order.id } })}
                >
                  <Camera size={14} color="#10b981" />
                  <Text style={styles.cameraMiniButtonText}>Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Trip Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Distance</Text>
            <Text style={styles.summaryValue}>{trip.totalDistanceKm} km</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Fuel Consumption</Text>
            <Text style={styles.summaryValue}>~{(trip.totalDistanceKm * 0.1).toFixed(1)} L</Text>
          </View>
        </View>

        {/* Status Control Buttons - Only for Active Trip */}
        {activeTrip?.id === id && (
          <View style={styles.controls}>
            {trip.status === TripStatus.ACCEPTED && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#6366f1' }]}
                onPress={() => handleStatusUpdate(TripStatus.IN_PROGRESS)}
                disabled={isLoading}
              >
                {isLoading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Truck size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Start Delivery</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {trip.status === TripStatus.IN_PROGRESS && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#10b981' }]}
                onPress={() => handleStatusUpdate(TripStatus.COMPLETED)}
                disabled={isLoading}
              >
                {isLoading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <CheckCircle2 size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Complete Trip</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            
            <SosButton tripId={id as string} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tripId: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  section: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    color: '#f8fafc',
    fontSize: 16,
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  orderCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  customerName: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  addressText: {
    color: '#94a3b8',
    fontSize: 14,
    flex: 1,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  navigateMiniButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 15,
  },
  navigateMiniButtonText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '600',
  },
  cameraMiniButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 15,
  },
  cameraMiniButtonText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryCard: {
    marginTop: 20,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  summaryTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  summaryValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold',
  },
  controls: {
    marginTop: 30,
    gap: 15,
  },
  actionButton: {
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sosButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  sosButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
  },
  backButton: {
    alignSelf: 'center',
    marginTop: 20,
    padding: 10,
  },
  backButtonText: {
    color: '#6366f1',
    fontWeight: 'bold',
  }
});
