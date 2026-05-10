import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions,
  Platform,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Navigation, MapPin, Truck, CheckCircle2, Phone, AlertTriangle } from 'lucide-react-native';
import { useTripStore, TripStatus, OrderStatus } from '../../store/useTripStore';
import { socketService } from '../../lib/socket';
import Toast from 'react-native-toast-message';
import { SosButton } from '@/components/SosButton';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import * as Linking from 'expo-linking';

const { width, height } = Dimensions.get('window');

export default function ActiveTripMap() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { activeTrip, updateTripStatus, updateOrderStatus } = useTripStore();
  const mapRef = useRef<MapView>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      let { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      // We also need background permission for the task to work properly
      await Location.requestBackgroundPermissionsAsync();

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      // Connect to socket when map loads
      socketService.connect();
    })();

    // Subscribe to location updates with dynamic frequency for battery optimization
    const trackingOptions = {
      accuracy: Location.Accuracy.High,
      timeInterval: activeTrip?.status === TripStatus.IN_PROGRESS ? 5000 : 30000,
      distanceInterval: activeTrip?.status === TripStatus.IN_PROGRESS ? 10 : 100,
    };

    const subscription = Location.watchPositionAsync(
      trackingOptions,
      (newLocation) => {
        setLocation(newLocation);
        // Emit location to socket
        if (activeTrip && activeTrip.status === TripStatus.IN_PROGRESS) {
          socketService.emit('gps:update', {
            tripId: activeTrip.id,
            vehicleId: activeTrip.vehicleId,
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            heading: newLocation.coords.heading || 0,
            speed: newLocation.coords.speed || 0,
            timestamp: new Date(newLocation.timestamp).toISOString(),
          });
        }
      }
    ).catch(err => {
      console.error('GPS Watch Error:', err);
      setErrorMsg('Lost GPS signal. Trying to reconnect...');
      // Fallback: try to get single position after a delay
      setTimeout(async () => {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setLocation(loc);
        } catch (e) {
          console.error('GPS Fallback Error:', e);
        }
      }, 10000);
    });

    // Fit map to route when trip loads
    if (activeTrip?.plannedRoute && activeTrip.plannedRoute.length > 0) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(activeTrip.plannedRoute as any, {
          edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
          animated: true,
        });
      }, 1000);
    }

    return () => {
      subscription.then(sub => {
        if (sub && typeof sub.remove === 'function') {
          sub.remove();
        }
      });
    };
  }, [activeTrip?.id]);

  const handleStatusUpdate = (newStatus: TripStatus) => {
    if (!activeTrip) return;

    let title = 'Update Status';
    let message = `Are you sure you want to change status to ${newStatus}?`;

    if (newStatus === TripStatus.IN_PROGRESS) {
      title = 'Start Delivery';
      message = 'Confirm that you have picked up all items and are starting the delivery route.';
    } else if (newStatus === TripStatus.COMPLETED) {
      title = 'Complete Trip';
      message = 'Confirm that all orders have been delivered successfully.';
    }

    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            try {
              await updateTripStatus(activeTrip.id, newStatus);
              socketService.emit('trip:status_change', {
                tripId: activeTrip.id,
                status: newStatus
              });
              Toast.show({
                type: 'success',
                text1: 'Status Updated',
                text2: `Trip is now ${newStatus}`
              });
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
  
  const handleOrderStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    let title = 'Update Order';
    let message = `Change order status to ${newStatus.replace('_', ' ')}?`;

    if (newStatus === OrderStatus.PICKED_UP) {
      title = 'Confirm Pickup';
      message = 'Have you successfully picked up the items for this order?';
    } else if (newStatus === OrderStatus.DELIVERING) {
      title = 'Start Delivery';
      message = 'Are you starting the delivery for this order?';
    }

    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            try {
              await updateOrderStatus(orderId, newStatus);
              socketService.emit('order:status_change', {
                orderId,
                status: newStatus
              });
              Toast.show({
                type: 'success',
                text1: 'Order Updated',
                text2: `Status is now ${newStatus.replace('_', ' ')}`
              });
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

  const centerOnLocation = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const openNavigation = () => {
    if (!activeTrip || activeTrip.orders.length === 0) return;
    const nextOrder = activeTrip.orders[0];
    const { latitude, longitude } = nextOrder.deliveryLocation || { latitude: 0, longitude: 0 };
    
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

  if (!activeTrip) {
    return (
      <View style={styles.emptyContainer}>
        <Truck size={64} color="#334155" />
        <Text style={styles.emptyTitle}>No Active Trip</Text>
        <Text style={styles.emptySubtitle}>Go to the Trips tab to accept a new assignment</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={() => useTripStore.getState().fetchTrips()}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: location?.coords.latitude || 21.0285,
          longitude: location?.coords.longitude || 105.8542,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        customMapStyle={darkMapStyle}
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Your Position"
          >
            <View style={styles.driverMarker}>
              <View style={styles.driverMarkerInner} />
            </View>
          </Marker>
        )}

        {/* Route Polyline */}
        {activeTrip.plannedRoute && activeTrip.plannedRoute.length > 0 && (
          <Polyline
            coordinates={activeTrip.plannedRoute}
            strokeColor="#6366f1"
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}

        {/* Pickup Marker (Warehouse) */}
        {activeTrip.orders[0]?.pickupLocation && (
          <Marker
            coordinate={activeTrip.orders[0].pickupLocation}
            title="Pickup: Warehouse"
          >
             <View style={[styles.markerContainer, { backgroundColor: '#6366f1' }]}>
                <Truck size={14} color="#fff" />
             </View>
          </Marker>
        )}
        
        {/* Delivery Markers */}
        {activeTrip.orders.map((order) => (
          order.deliveryLocation && (
            <Marker
              key={order.id}
              coordinate={order.deliveryLocation}
              title={`Delivery: ${order.customerName}`}
              description={order.address}
            >
              <View style={[styles.markerContainer, { backgroundColor: '#10b981' }]}>
                <MapPin size={14} color="#fff" />
              </View>
            </Marker>
          )
        ))}
      </MapView>

      <View style={styles.topOverlay}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.headerTitle}>Live Tracking</Text>
              <Text style={styles.headerSubtitle}>
                {activeTrip ? `Trip #${activeTrip.id.substring(0, 8).toUpperCase()}` : 'No active trip'}
              </Text>
            </View>
            <ConnectionStatus />
          </View>
        </View>
        <View style={styles.tripInfoCard}>
          <View style={styles.tripInfoMain}>
            <Text style={styles.tripIdText}>Trip: {activeTrip.id.substring(0, 8)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(activeTrip.status) }]}>
              <Text style={styles.statusText}>{activeTrip.status.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.etaText}>ETA: 25 mins • 4.2 km left</Text>
        </View>
      </View>

      <View style={styles.bottomOverlay}>
        <TouchableOpacity style={styles.locationButton} onPress={centerOnLocation}>
          <Navigation size={24} color="#f8fafc" />
        </TouchableOpacity>

        <View style={styles.actionsCard}>
          <View style={styles.nextStopInfo}>
            <MapPin size={24} color="#10b981" />
            <View style={styles.stopTextContainer}>
              <Text style={styles.stopLabel}>Next Stop</Text>
              <Text style={styles.stopAddress}>{activeTrip.orders[0]?.address || 'No orders'}</Text>
            </View>
            <TouchableOpacity style={styles.callButton} onPress={openNavigation}>
              <Navigation size={20} color="#6366f1" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.callButton, { marginLeft: 10 }]}>
              <Phone size={20} color="#6366f1" />
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            {activeTrip.status === TripStatus.ACCEPTED && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#6366f1' }]}
                onPress={() => handleStatusUpdate(TripStatus.IN_PROGRESS)}
              >
                <Truck size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Start Delivery</Text>
              </TouchableOpacity>
            )}

            {activeTrip.status === TripStatus.IN_PROGRESS && (() => {
              const currentOrder = activeTrip.orders.find(o => o.status !== OrderStatus.DELIVERED);
              
              if (!currentOrder) {
                return (
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}
                    onPress={() => handleStatusUpdate(TripStatus.COMPLETED)}
                  >
                    <CheckCircle2 size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Finish Trip</Text>
                  </TouchableOpacity>
                );
              }

              if (currentOrder.status === OrderStatus.ASSIGNED || currentOrder.status === OrderStatus.PENDING) {
                return (
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#f59e0b' }]}
                    onPress={() => handleOrderStatusUpdate(currentOrder.id, OrderStatus.PICKED_UP)}
                  >
                    <Truck size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Picked Up</Text>
                  </TouchableOpacity>
                );
              }

              if (currentOrder.status === OrderStatus.PICKED_UP) {
                return (
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#8b5cf6' }]}
                    onPress={() => handleOrderStatusUpdate(currentOrder.id, OrderStatus.DELIVERING)}
                  >
                    <Navigation size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Delivering</Text>
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#10b981' }]}
                  onPress={() => {
                    router.push({
                      pathname: '/camera',
                      params: { orderId: currentOrder.id, tripId: activeTrip.id }
                    });
                  }}
                >
                  <CheckCircle2 size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Complete Order</Text>
                </TouchableOpacity>
              );
            })()}

            <SosButton tripId={activeTrip.id} />
          </View>
        </View>
      </View>
    </View>
  );
}

const getStatusColor = (status: TripStatus) => {
  switch (status) {
    case TripStatus.PENDING: return '#94a3b8';
    case TripStatus.ACCEPTED: return '#6366f1';
    case TripStatus.IN_PROGRESS: return '#10b981';
    case TripStatus.COMPLETED: return '#3b82f6';
    case TripStatus.CANCELLED: return '#ef4444';
    default: return '#64748b';
  }
};

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#94a3b8" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#1e293b" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#334155" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#334155" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#1e293b" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  map: {
    width: width,
    height: height,
  },
  topOverlay: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
  },
  header: {
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
  },
  tripInfoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  tripInfoMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripIdText: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  etaText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  locationButton: {
    backgroundColor: '#1e293b',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  actionsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  nextStopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.5)',
  },
  stopTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  stopLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  stopAddress: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  callButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sosButton: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  driverMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6366f1',
  },
  markerContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  refreshButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptySubtitle: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
});
