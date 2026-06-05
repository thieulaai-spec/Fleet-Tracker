import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { MapComponent, MarkerComponent, PROVIDER_GOOGLE } from '../../components/map/MapComponents';
import { FleetMarker } from '../../components/map/FleetMarker';
import { useFleetTrackingStore } from '../../store/useFleetTrackingStore';
import { Layers, Maximize, MapPin } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { authFetch } from '../../lib/authFetch';
import { normalizePlate } from '../../components/admin/tracking/trackingUtils';
import { TrackingHeader } from '../../components/admin/tracking/TrackingHeader';
import { SelectedVehicleCard } from '../../components/admin/tracking/SelectedVehicleCard';
import { ProofDetailsModal } from '../../components/admin/tracking/ProofDetailsModal';
import { LightboxModal } from '../../components/admin/tracking/LightboxModal';

export default function AdminTrackingScreen() {
  const mapRef = useRef<any>(null);
  const justPressedMarkerRef = useRef<boolean>(false);
  const { vehicles, isLoading, fetchLiveLocations, startTracking, stopTracking } = useFleetTrackingStore();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(true);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Verification details states for mobile admin
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [activeTrip, setActiveTrip] = useState<any | null>(null);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const fetchActiveTripDetails = async (tripId: string, showModal = true) => {
    setIsFetchingDetails(true);
    try {
      const tripRes = await authFetch(`/trips/${tripId}`);
      if (tripRes.ok) {
        const tripData = await tripRes.json();
        setActiveTrip(tripData?.data ?? tripData);
      }
      
      const verifRes = await authFetch(`/trips/${tripId}/verifications`);
      if (verifRes.ok) {
        const verifData = await verifRes.json();
        setVerifications(verifData?.data ?? verifData);
      }
      if (showModal) {
        setIsDetailsVisible(true);
      }
    } catch (err) {
      console.log('Error fetching live tracking detail:', err);
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const vehicleList = useMemo(() => Object.values(vehicles), [vehicles]);
  const selectedVehicle = selectedVehicleId ? vehicles[selectedVehicleId] : null;

  const handleMarkerPress = useCallback((v: any) => {
    justPressedMarkerRef.current = true;
    setSelectedVehicleId(v.id);
    setIsFollowing(true);
    setIsSearching(false);
    Keyboard.dismiss();

    // Auto-fetch active trip details quietly to display order markers
    if (v.tripId) {
      fetchActiveTripDetails(v.tripId, false);
    } else {
      setActiveTrip(null);
      setVerifications([]);
    }
  }, []);

  // Filter vehicles for search list and map display
  const filteredVehicles = useMemo(() => {
    if (!searchQuery.trim()) return vehicleList;
    const query = searchQuery.toLowerCase().trim();
    const normalizedQuery = normalizePlate(query);

    return vehicleList.filter((v) => {
      const plate = v.licensePlate || '';
      const driver = v.driverName || '';
      
      return (
        normalizePlate(plate).includes(normalizedQuery) ||
        plate.toLowerCase().includes(query) ||
        driver.toLowerCase().includes(query)
      );
    });
  }, [vehicleList, searchQuery]);

  const displayedVehiclesForMap = useMemo(() => {
    if (!searchQuery.trim()) return vehicleList;
    return filteredVehicles;
  }, [vehicleList, filteredVehicles, searchQuery]);

  useEffect(() => {
    fetchLiveLocations();
    startTracking();
    return () => stopTracking();
  }, []);

  const lastAnimateTimeRef = useRef<number>(0);

  // Center on selected vehicle whenever its coordinates update (throttled to 1.5s, if following)
  useEffect(() => {
    if (selectedVehicle && isFollowing && mapRef.current) {
      const now = Date.now();
      if (now - lastAnimateTimeRef.current > 1500) {
        lastAnimateTimeRef.current = now;
        mapRef.current.animateToRegion({
          latitude: selectedVehicle.latitude,
          longitude: selectedVehicle.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        }, 500);
      }
    }
  }, [selectedVehicle?.latitude, selectedVehicle?.longitude, isFollowing]);

  const fitFleet = useCallback(() => {
    if (vehicleList.length === 0 || !mapRef.current) return;
    
    const coords = vehicleList.map(v => ({
      latitude: v.latitude,
      longitude: v.longitude,
    }));

    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
      animated: true,
    });
  }, [vehicleList]);

  const toggleMapType = useCallback(() => {
    const types: ('standard' | 'satellite' | 'hybrid')[] = ['standard', 'satellite', 'hybrid'];
    const nextIndex = (types.indexOf(mapType) + 1) % types.length;
    setMapType(types[nextIndex]);
  }, [mapType]);

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="dark" />
      
      <MapComponent
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        mapType={mapType}
        initialRegion={{
          latitude: 21.027764,
          longitude: 105.834159,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        onPanDrag={() => {
          setIsFollowing(false);
        }}
        onPress={() => {
          if (justPressedMarkerRef.current) {
            justPressedMarkerRef.current = false;
            return;
          }
          setSelectedVehicleId(null);
          setActiveTrip(null);
          setVerifications([]);
          setIsSearching(false);
          Keyboard.dismiss();
        }}
      >
        {displayedVehiclesForMap.map((vehicle) => (
          <FleetMarker 
            key={vehicle.id} 
            vehicle={vehicle} 
            onPress={handleMarkerPress}
          />
        ))}

        {/* Render Active Trip Order Markers for Selected Driver */}
        {selectedVehicle && activeTrip && activeTrip.vehicleId === selectedVehicle.id && activeTrip.tripOrders && activeTrip.tripOrders.map((to: any) => {
          const order = to.order;
          if (!order) return null;

          const getCoord = (loc: any) => {
            if (!loc) return null;
            if (loc.latitude !== undefined && loc.longitude !== undefined) {
              return { latitude: loc.latitude, longitude: loc.longitude };
            }
            if (loc.coordinates && loc.coordinates.length >= 2) {
              return { latitude: loc.coordinates[1], longitude: loc.coordinates[0] };
            }
            return null;
          };

          const pickupCoord = getCoord(order.pickupLocation);
          const deliveryCoord = getCoord(order.deliveryLocation);

          return (
            <React.Fragment key={order.id}>
              {pickupCoord && (
                <MarkerComponent
                  coordinate={pickupCoord}
                  title={`Lấy hàng: ${order.id.substring(0, 8)}`}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View 
                    className="w-8 h-8 rounded-full border-2 items-center justify-center shadow shadow-black/25"
                    style={{ backgroundColor: '#ffffff', borderColor: '#10b981' }}
                  >
                    <MapPin size={16} color="#10b981" strokeWidth={3} />
                  </View>
                </MarkerComponent>
              )}
              {deliveryCoord && (
                <MarkerComponent
                  coordinate={deliveryCoord}
                  title={`Giao hàng: ${order.id.substring(0, 8)}`}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View 
                    className="w-8 h-8 rounded-full border-2 border-white items-center justify-center shadow shadow-black/25"
                    style={{ backgroundColor: '#10b981' }}
                  >
                    <MapPin size={16} color="#fff" strokeWidth={3} />
                  </View>
                </MarkerComponent>
              )}
            </React.Fragment>
          );
        })}
      </MapComponent>

      {/* Floating Header & Search */}
      <TrackingHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearching={isSearching}
        setIsSearching={setIsSearching}
        vehicleList={vehicleList}
        filteredVehicles={filteredVehicles}
        onSelectVehicle={(id) => {
          setSelectedVehicleId(id);
          setIsFollowing(true);
          const v = vehicles[id];
          if (v && v.tripId) {
            fetchActiveTripDetails(v.tripId, false);
          } else {
            setActiveTrip(null);
            setVerifications([]);
          }
        }}
      />

      {/* Map Controls */}
      <View className="absolute right-4 top-0 bottom-0 justify-center gap-3">
        <TouchableOpacity 
          className="w-12 h-12 rounded-full bg-slate-900/80 border border-white/10" 
          style={{ justifyContent: 'center', alignItems: 'center' }}
          onPress={toggleMapType}
        >
          <Layers size={22} color="#475569" />
        </TouchableOpacity>
        <TouchableOpacity 
          className="w-12 h-12 rounded-full bg-slate-900/80 border border-white/10" 
          style={{ justifyContent: 'center', alignItems: 'center' }}
          onPress={fitFleet}
        >
          <Maximize size={22} color="#475569" />
        </TouchableOpacity>
      </View>

      {/* Selected Vehicle Card */}
      <SelectedVehicleCard
        selectedVehicle={selectedVehicle}
        activeTrip={activeTrip}
        onClose={() => setSelectedVehicleId(null)}
        isFetchingDetails={isFetchingDetails}
        onFetchDetails={fetchActiveTripDetails}
      />

      {isLoading && vehicleList.length === 0 && (
        <View className="absolute inset-0 bg-slate-900/60 items-center justify-center gap-4">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="text-slate-400 text-base">Connecting to fleet...</Text>
        </View>
      )}

      {/* MOBILE ADMIN PROOF DETAILS MODAL */}
      <ProofDetailsModal
        visible={isDetailsVisible}
        onClose={() => setIsDetailsVisible(false)}
        selectedVehicle={selectedVehicle}
        activeTrip={activeTrip}
        verifications={verifications}
        onSelectImage={setLightboxImage}
      />

      {/* MOBILE LIGHTBOX */}
      <LightboxModal
        imageUrl={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </View>
  );
}
