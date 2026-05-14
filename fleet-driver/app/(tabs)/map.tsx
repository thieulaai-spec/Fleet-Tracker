import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions,
  Platform,
  Alert,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { 
  Navigation, 
  MapPin, 
  Truck, 
  CheckCircle2, 
  Phone, 
  Layers, 
  Target,
  ChevronRight,
  Clock,
  Info,
  RefreshCcw,
  AlertTriangle,
  User,
  ShieldCheck
} from 'lucide-react-native';
import { MapComponent, MarkerComponent, PolylineComponent, PROVIDER_GOOGLE } from '../../components/MapComponents';
import { useTripStore, TripStatus, OrderStatus } from '../../store/useTripStore';
import { socketService } from '../../lib/socket';
import Toast from 'react-native-toast-message';
import { SosButton } from '@/components/SosButton';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import * as Linking from 'expo-linking';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function ActiveTripMap() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const activeTrip = useTripStore(state => state.activeTrip);
  const updateTripStatus = useTripStore(state => state.updateTripStatus);
  const updateOrderStatus = useTripStore(state => state.updateOrderStatus);
  const fetchTrips = useTripStore(state => state.fetchTrips);
  
  const mapRef = useRef<any>(null);
  const fitTimeoutRef = useRef<any>(null);
  const watchSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const startTracking = async () => {
      try {
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        if (foregroundStatus !== 'granted') {
          if (isMounted) setErrorMsg('Permission to access location was denied');
          return;
        }

        await Location.requestBackgroundPermissionsAsync();

        const currentLocation = await Location.getCurrentPositionAsync({});
        if (isMounted) setLocation(currentLocation);

        if (watchSubscriptionRef.current) {
          watchSubscriptionRef.current.remove();
          watchSubscriptionRef.current = null;
        }

        const trackingOptions = {
          accuracy: Location.Accuracy.High,
          timeInterval: activeTrip?.status === TripStatus.IN_PROGRESS ? 5000 : 30000,
          distanceInterval: activeTrip?.status === TripStatus.IN_PROGRESS ? 10 : 100,
        };

        const subscription = await Location.watchPositionAsync(
          trackingOptions,
          (newLocation) => {
            if (isMounted) {
              setLocation(newLocation);
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
          }
        );

        if (isMounted) {
          watchSubscriptionRef.current = subscription;
        } else {
          subscription.remove();
        }
      } catch (err) {
        console.error('GPS Setup Error:', err);
        if (isMounted) setErrorMsg('Failed to initialize GPS tracking');
      }
    };

    startTracking();

    if (activeTrip?.plannedRoute && activeTrip.plannedRoute.length > 0) {
      if (fitTimeoutRef.current) clearTimeout(fitTimeoutRef.current);
      
      fitTimeoutRef.current = setTimeout(() => {
        if (isMounted && mapRef.current) {
          mapRef.current.fitToCoordinates(activeTrip.plannedRoute as any, {
            edgePadding: { top: 150, right: 60, bottom: 420, left: 60 },
            animated: true,
          });
        }
      }, 1000);
    }

    return () => {
      isMounted = false;
      if (fitTimeoutRef.current) clearTimeout(fitTimeoutRef.current);
      if (watchSubscriptionRef.current) {
        watchSubscriptionRef.current.remove();
        watchSubscriptionRef.current = null;
      }
    };
  }, [activeTrip?.id, activeTrip?.status]);

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
    const nextOrder = activeTrip.orders.find(o => o.status !== OrderStatus.DELIVERED) || activeTrip.orders[0];
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
      <View className="flex-1 bg-[#020617] justify-center items-center p-8">
        {/* Background Glows */}
        <View 
          className="absolute w-[400px] h-[400px] rounded-full bg-indigo-600/10" 
          style={{ top: '10%', left: '-20%', transform: [{ scale: 1.5 }] }} 
        />
        <View 
          className="absolute w-[350px] h-[350px] rounded-full bg-blue-600/10" 
          style={{ bottom: '10%', right: '-10%', transform: [{ scale: 1.5 }] }} 
        />

        <BlurView intensity={20} tint="dark" className="p-10 rounded-[48px] border border-slate-800/40 items-center overflow-hidden w-full max-w-[340px]">
          <LinearGradient
            colors={['#1e293b', '#0f172a']}
            className="w-28 h-28 rounded-[40px] justify-center items-center mb-10 shadow-2xl border border-slate-700/30"
          >
            <Truck size={48} color="#6366f1" strokeWidth={1.5} />
          </LinearGradient>
          
          <Text className="text-white text-4xl font-black text-center tracking-tight leading-none">NO ACTIVE{"\n"}MISSION</Text>
          <Text className="text-slate-400 text-center mt-6 leading-6 font-medium text-base">
            Stand by for incoming deployments. Fleet Intelligence is monitoring for new requests.
          </Text>

          <TouchableOpacity 
            className="mt-12 w-full overflow-hidden rounded-xl"
            onPress={() => fetchTrips()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#6366f1', '#4f46e5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="py-5 flex-row justify-center items-center gap-3"
            >
              <RefreshCcw size={20} color="#fff" />
              <Text className="text-white font-black text-base uppercase tracking-widest">Check Status</Text>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
      </View>
    );
  }

  const currentOrder = activeTrip.orders.find(o => o.status !== OrderStatus.DELIVERED);

  return (
    <View className="flex-1 bg-[#020617]">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <MapComponent
        ref={mapRef as any}
        style={{ width: width, height: height }}
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
          <MarkerComponent
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            flat
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View className="items-center justify-center">
              <View className="w-12 h-12 rounded-full bg-indigo-500/20 items-center justify-center">
                <View className="w-8 h-8 rounded-full bg-indigo-500/40 items-center justify-center">
                  <View className="w-5 h-5 rounded-full bg-indigo-500 border-2 border-white shadow-lg items-center justify-center">
                    <View className="w-1.5 h-1.5 rounded-full bg-white" />
                  </View>
                </View>
              </View>
            </View>
          </MarkerComponent>
        )}

        {activeTrip.plannedRoute && activeTrip.plannedRoute.length > 0 && (
          <PolylineComponent
            coordinates={activeTrip.plannedRoute}
            strokeColor="#6366f1"
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}

        {activeTrip.orders[0]?.pickupLocation && (
          <MarkerComponent coordinate={activeTrip.orders[0].pickupLocation}>
             <View className="w-12 h-12 items-center justify-center">
                <View className="absolute w-12 h-12 rounded-full bg-indigo-600/30 scale-125" />
                <View className="w-10 h-10 rounded-2xl justify-center items-center bg-indigo-600 border-2 border-slate-900 shadow-2xl">
                    <Truck size={20} color="#fff" />
                </View>
             </View>
          </MarkerComponent>
        )}
        
        {activeTrip.orders.map((order) => (
          order.deliveryLocation && (
            <MarkerComponent
              key={order.id}
              coordinate={order.deliveryLocation}
            >
              <View className="items-center">
                <View className={`w-14 h-14 rounded-[22px] justify-center items-center border-4 border-slate-950 shadow-2xl ${order.status === OrderStatus.DELIVERED ? 'bg-slate-700 opacity-40' : 'bg-emerald-500'}`}>
                    <MapPin size={24} color="#fff" strokeWidth={2.5} />
                    {order.status !== OrderStatus.DELIVERED && (
                    <View className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full items-center justify-center border-2 border-emerald-500">
                        <View className="w-2 h-2 bg-emerald-500 rounded-full" />
                    </View>
                    )}
                </View>
              </View>
            </MarkerComponent>
          )
        ))}
      </MapComponent>

      {/* Top Floating Dashboard */}
      <SafeAreaView className="absolute top-0 left-0 right-0 pointer-events-none">
        <View className="px-5 pt-4 pointer-events-auto">
          <BlurView intensity={35} tint="dark" className="rounded-[32px] border border-white/10 shadow-2xl overflow-hidden">
            <View className="p-5 bg-slate-900/40">
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-4">
                  <LinearGradient
                    colors={['#6366f1', '#4f46e5']}
                    className="w-14 h-14 rounded-[22px] justify-center items-center shadow-lg shadow-indigo-500/30"
                  >
                    <Navigation size={28} color="#fff" strokeWidth={2} />
                  </LinearGradient>
                  <View>
                    <Text className="text-white font-black text-xl tracking-tight uppercase">Operational Intelligence</Text>
                    <View className="flex-row items-center gap-2 mt-0.5">
                      <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                      <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">MISSION ID #{activeTrip.id.substring(0, 8)}</Text>
                    </View>
                  </View>
                </View>
                <ConnectionStatus />
              </View>

              <View className="flex-row gap-6 mt-6 pt-5 border-t border-white/5">
                <View className="flex-1 flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-2xl bg-white/5 items-center justify-center border border-white/5">
                    <Clock size={18} color="#818cf8" />
                  </View>
                  <View>
                    <Text className="text-slate-500 text-[9px] font-black uppercase tracking-wider">ETA</Text>
                    <Text className="text-slate-100 text-sm font-black tracking-tight">24 MIN</Text>
                  </View>
                </View>
                <View className="flex-1 flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-2xl bg-white/5 items-center justify-center border border-white/5">
                    <Target size={18} color="#818cf8" />
                  </View>
                  <View>
                    <Text className="text-slate-500 text-[9px] font-black uppercase tracking-wider">Distance</Text>
                    <Text className="text-slate-100 text-sm font-black tracking-tight">3.8 KM</Text>
                  </View>
                </View>
                
                <View className="justify-center">
                  <View 
                    className="px-5 py-2 rounded-2xl border border-white/5"
                    style={{ backgroundColor: getStatusColor(activeTrip.status) + '15' }}
                  >
                    <Text className="font-black text-[10px] uppercase tracking-[1.5px]" style={{ color: getStatusColor(activeTrip.status) }}>
                      {activeTrip.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </BlurView>
        </View>
      </SafeAreaView>

      {/* Map System Controls */}
      <View className="absolute right-5 bottom-[400px] gap-4">
        <TouchableOpacity 
          className="overflow-hidden rounded-[20px] shadow-2xl"
          activeOpacity={0.8}
        >
          <BlurView intensity={45} tint="dark" className="w-14 h-14 justify-center items-center border border-white/10">
            <Layers size={24} color="#94a3b8" />
          </BlurView>
        </TouchableOpacity>
        <TouchableOpacity 
          className="overflow-hidden rounded-[20px] shadow-2xl shadow-indigo-500/20"
          onPress={centerOnLocation}
          activeOpacity={0.8}
        >
          <BlurView intensity={45} tint="dark" className="w-14 h-14 justify-center items-center border border-white/10">
            <Target size={24} color="#6366f1" strokeWidth={2.5} />
          </BlurView>
        </TouchableOpacity>
      </View>

      {/* Bottom Mission Panel */}
      <View className="absolute bottom-10 left-5 right-5">
        <BlurView intensity={45} tint="dark" className="rounded-[44px] border border-white/10 shadow-2xl overflow-hidden">
          <View className="p-6 bg-slate-900/60">
            {/* Mission Progress Indicator */}
            <View className="absolute top-0 left-0 right-0 h-1.5 bg-white/5">
               <View className="h-full bg-indigo-500 w-[65%] shadow-[0_0_15px_rgba(99,102,241,0.9)]" />
            </View>

            <View className="flex-row items-center mb-8 pt-3">
              <View className="shadow-2xl">
                <LinearGradient
                  colors={currentOrder ? ['#10b981', '#059669'] : ['#334155', '#1e293b']}
                  className="w-16 h-16 rounded-xl justify-center items-center border border-white/10"
                >
                  <MapPin size={32} color="#fff" strokeWidth={2.5} />
                </LinearGradient>
              </View>
              <View className="flex-1 ml-5">
                <Text className="text-indigo-400 text-[10px] font-black uppercase tracking-[2.5px] mb-1.5">Active Destination</Text>
                <Text className="text-white text-2xl font-black tracking-tight" numberOfLines={1}>
                  {currentOrder?.address || 'Trip Completed'}
                </Text>
                {currentOrder && (
                  <View className="flex-row items-center gap-2 mt-2">
                    <View className="w-6 h-6 rounded-lg bg-white/5 items-center justify-center">
                        <User size={12} color="#94a3b8" />
                    </View>
                    <Text className="text-slate-400 text-sm font-bold tracking-tight">{currentOrder.customerName}</Text>
                    <View className="w-1.5 h-1.5 rounded-full bg-slate-700 mx-1" />
                    <ShieldCheck size={14} color="#10b981" />
                    <Text className="text-emerald-500 text-[10px] font-black uppercase">Verified</Text>
                  </View>
                )}
              </View>
              
              <View className="flex-row gap-3">
                 <TouchableOpacity 
                  className="bg-white/5 w-12 h-12 rounded-[18px] justify-center items-center border border-white/10 shadow-lg"
                  onPress={openNavigation}
                  activeOpacity={0.7}
                >
                  <Navigation size={22} color="#fff" strokeWidth={2} />
                </TouchableOpacity>
                <TouchableOpacity 
                  className="bg-white/5 w-12 h-12 rounded-[18px] justify-center items-center border border-white/10 shadow-lg"
                  activeOpacity={0.7}
                >
                  <Phone size={22} color="#fff" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Tactical Actions */}
            <View className="flex-row gap-4">
              {activeTrip.status === TripStatus.ACCEPTED && (
                <TouchableOpacity 
                  className="flex-1 h-[72px] rounded-xl overflow-hidden shadow-2xl shadow-indigo-500/30"
                  onPress={() => handleStatusUpdate(TripStatus.IN_PROGRESS)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#6366f1', '#4f46e5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="flex-1 flex-row justify-center items-center gap-3.5"
                  >
                    <Truck size={24} color="#fff" strokeWidth={2.5} />
                    <Text className="text-white font-black text-base uppercase tracking-[2px]">Deploy Trip</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {activeTrip.status === TripStatus.IN_PROGRESS && (() => {
                if (!currentOrder) {
                  return (
                    <TouchableOpacity 
                      className="flex-1 h-[72px] rounded-xl overflow-hidden shadow-2xl shadow-blue-500/30"
                      onPress={() => handleStatusUpdate(TripStatus.COMPLETED)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#3b82f6', '#2563eb']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="flex-1 flex-row justify-center items-center gap-3.5"
                      >
                        <CheckCircle2 size={24} color="#fff" strokeWidth={2.5} />
                        <Text className="text-white font-black text-base uppercase tracking-[2px]">Finalize Mission</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                }

                if (currentOrder.status === OrderStatus.ASSIGNED || currentOrder.status === OrderStatus.PENDING) {
                  return (
                    <TouchableOpacity 
                      className="flex-1 h-[72px] rounded-xl overflow-hidden shadow-2xl shadow-amber-500/30"
                      onPress={() => handleOrderStatusUpdate(currentOrder.id, OrderStatus.PICKED_UP)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#f59e0b', '#d97706']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="flex-1 flex-row justify-center items-center gap-3.5"
                      >
                        <Truck size={24} color="#fff" strokeWidth={2.5} />
                        <Text className="text-white font-black text-base uppercase tracking-[2px]">Confirm Cargo</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                }

                if (currentOrder.status === OrderStatus.PICKED_UP) {
                  return (
                    <TouchableOpacity 
                      className="flex-1 h-[72px] rounded-xl overflow-hidden shadow-2xl shadow-violet-500/30"
                      onPress={() => handleOrderStatusUpdate(currentOrder.id, OrderStatus.DELIVERING)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#8b5cf6', '#7c3aed']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="flex-1 flex-row justify-center items-center gap-3.5"
                      >
                        <Navigation size={24} color="#fff" strokeWidth={2.5} />
                        <Text className="text-white font-black text-base uppercase tracking-[2px]">Set Delivering</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                }

                return (
                  <TouchableOpacity 
                    className="flex-1 h-[72px] rounded-xl overflow-hidden shadow-2xl shadow-emerald-500/30"
                    onPress={() => {
                      router.push({
                        pathname: '/camera',
                        params: { orderId: currentOrder.id, tripId: activeTrip.id }
                      });
                    }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#10b981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className="flex-1 flex-row justify-center items-center gap-3.5"
                    >
                      <CheckCircle2 size={24} color="#fff" strokeWidth={2.5} />
                      <Text className="text-white font-black text-base uppercase tracking-[2px]">Proof of Delivery</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })()}

              <SosButton tripId={activeTrip.id} />
            </View>
          </View>
        </BlurView>
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
  { "elementType": "geometry", "stylers": [{ "color": "#020617" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#475569" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#020617" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#020617" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#334155" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1e293b" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] }
];
