import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, FlatList, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapComponent, PROVIDER_GOOGLE } from '../../components/map/MapComponents';
import { FleetMarker } from '../../components/map/FleetMarker';
import { useFleetTrackingStore } from '../../store/useFleetTrackingStore';
import { Layers, Maximize, Search, Truck, User, Navigation } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';

const normalizePlate = (plate: string) => {
  return plate.toLowerCase().replace(/[^a-z0-9]/g, '');
};

export default function AdminTrackingScreen() {
  const mapRef = useRef<any>(null);
  const { vehicles, isLoading, fetchLiveLocations, startTracking, stopTracking } = useFleetTrackingStore();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const vehicleList = useMemo(() => Object.values(vehicles), [vehicles]);
  const selectedVehicle = selectedVehicleId ? vehicles[selectedVehicleId] : null;

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

  // Center on selected vehicle whenever its coordinates update
  useEffect(() => {
    if (selectedVehicle && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: selectedVehicle.latitude,
        longitude: selectedVehicle.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      }, 500);
    }
  }, [selectedVehicle?.latitude, selectedVehicle?.longitude]);

  const fitFleet = () => {
    if (vehicleList.length === 0 || !mapRef.current) return;
    
    const coords = vehicleList.map(v => ({
      latitude: v.latitude,
      longitude: v.longitude,
    }));

    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
      animated: true,
    });
  };

  const toggleMapType = () => {
    const types: ('standard' | 'satellite' | 'hybrid')[] = ['standard', 'satellite', 'hybrid'];
    const nextIndex = (types.indexOf(mapType) + 1) % types.length;
    setMapType(types[nextIndex]);
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      
      <MapComponent
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        mapType={mapType}
        initialRegion={{
          latitude: 10.762622,
          longitude: 106.660172,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        onPress={() => {
          setSelectedVehicleId(null);
          setIsSearching(false);
          Keyboard.dismiss();
        }}
      >
        {displayedVehiclesForMap.map((vehicle) => (
          <FleetMarker 
            key={vehicle.id} 
            vehicle={vehicle} 
            onPress={(v) => {
              setSelectedVehicleId(v.id);
              setIsSearching(false);
              Keyboard.dismiss();
            }}
          />
        ))}
      </MapComponent>

      {/* Floating Header */}
      <SafeAreaView className="absolute inset-0 p-4" pointerEvents="box-none">
        <BlurView intensity={80} tint="dark" className="p-4 rounded-[20px] overflow-hidden border border-white/10">
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center gap-2">
              <View className="w-2 h-2 rounded-full bg-red-500" />
              <Text className="text-white text-lg font-extrabold tracking-wider">Fleet Live</Text>
            </View>
            <Text className="text-slate-400 text-xs mt-0.5">
              {vehicleList.length} active vehicles
            </Text>
          </View>

          <View className="flex-row items-center bg-white/8 rounded-xl px-3 h-10 border border-white/5">
            <Search size={18} color="#94a3b8" className="mr-2" />
            <TextInput
              className="flex-1 text-white text-sm py-0"
              placeholder="Search plate or driver..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setIsSearching(true);
              }}
              onFocus={() => setIsSearching(true)}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                setIsSearching(false);
                Keyboard.dismiss();
              }}>
                <Text className="text-indigo-500 text-xs font-semibold ml-2">Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </BlurView>

        {/* Search Results Dropdown */}
        {isSearching && searchQuery.trim().length > 0 && (
          <BlurView intensity={95} tint="dark" className="mt-2 rounded-2xl overflow-hidden border border-white/10 shadow-lg shadow-black/30 z-[999]">
            <FlatList
              data={filteredVehicles}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              className="max-h-[220px]"
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="flex-row justify-between items-center py-3 px-4 border-b border-white/5"
                  onPress={() => {
                    setSelectedVehicleId(item.id);
                    setSearchQuery('');
                    setIsSearching(false);
                    Keyboard.dismiss();
                  }}
                >
                  <View className="flex-row items-center gap-3 flex-1">
                    <Truck size={18} color={getStatusColor(item.status)} />
                    <View className="flex-1">
                      <Text className="text-white text-sm font-bold">{item.licensePlate}</Text>
                      <Text className="text-slate-400 text-xs mt-0.5">{item.driverName}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getStatusColor(item.status) }} />
                    <Text className="text-[10px] font-bold" style={{ color: getStatusColor(item.status) }}>
                      {item.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View className="p-5 items-center">
                  <Text className="text-slate-500 text-sm">No vehicles match search</Text>
                </View>
              }
            />
          </BlurView>
        )}

        {/* Map Controls */}
        <View className="absolute right-4 top-[170px] gap-3">
          <TouchableOpacity className="w-12 h-12 rounded-full bg-slate-900/80 items-center justify-center border border-white/10" onPress={toggleMapType}>
            <Layers size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity className="w-12 h-12 rounded-full bg-slate-900/80 items-center justify-center border border-white/10" onPress={fitFleet}>
            <Maximize size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Selected Vehicle Card */}
        {selectedVehicle && (
          <BlurView intensity={95} tint="dark" className="absolute bottom-10 left-4 right-4 rounded-3xl overflow-hidden p-5 border border-white/15 shadow-2xl shadow-black/30">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center gap-2">
                <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getStatusColor(selectedVehicle.status) }} />
                <Text className="text-white text-xl font-extrabold">{selectedVehicle.licensePlate}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedVehicleId(null)}>
                <Text className="text-slate-400 text-sm">Close</Text>
              </TouchableOpacity>
            </View>

            <View className="gap-3 mb-5">
              <View className="flex-row justify-between">
                <View className="flex-row items-center gap-2 flex-1">
                  <User size={16} color="#94a3b8" />
                  <Text className="text-slate-100 text-sm font-medium">{selectedVehicle.driverName}</Text>
                </View>
                <View className="flex-row items-center gap-2 flex-1">
                  <Navigation size={16} color="#94a3b8" />
                  <Text className="text-slate-100 text-sm font-medium">{selectedVehicle.speed} km/h</Text>
                </View>
              </View>

              <View className="flex-row justify-between">
                <View className="flex-row items-center gap-2 flex-1">
                  <Truck size={16} color="#94a3b8" />
                  <Text className="text-slate-100 text-sm font-medium">{selectedVehicle.status.replace('_', ' ').toUpperCase()}</Text>
                </View>
                <View className="flex-row items-center gap-2 flex-1">
                  <Text className="text-slate-500 text-xs">Last update: </Text>
                  <Text className="text-slate-100 text-sm font-medium">Just now</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity className="bg-indigo-500 py-3.5 rounded-2xl items-center">
              <Text className="text-white font-bold text-base">View Details</Text>
            </TouchableOpacity>
          </BlurView>
        )}

        {isLoading && vehicleList.length === 0 && (
          <View className="absolute inset-0 bg-slate-900/60 items-center justify-center gap-4">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className="text-slate-400 text-base">Connecting to fleet...</Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'available': return '#10b981';
    case 'on_trip': return '#6366f1';
    case 'maintenance': return '#f59e0b';
    default: return '#64748b';
  }
};
