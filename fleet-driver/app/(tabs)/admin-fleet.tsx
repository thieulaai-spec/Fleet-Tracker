import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  Platform,
  ScrollView,
  TextInput
} from 'react-native';
import { 
  Users, 
  Truck, 
  Plus, 
  Search, 
  ChevronRight, 
  User as UserIcon,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Settings2
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useFleetStore, Driver, Vehicle, DriverStatus, VehicleStatus, VehicleType } from '../../store/useFleetStore';

import { DriverCard } from '../../components/admin/DriverCard';
import { VehicleCard } from '../../components/admin/VehicleCard';

const DRIVER_STATUS_CONFIG = {
  [DriverStatus.AVAILABLE]: { label: 'Available', color: '#10b981' },
  [DriverStatus.ON_TRIP]: { label: 'On Trip', color: '#6366f1' },
  [DriverStatus.OFF_DUTY]: { label: 'Off Duty', color: '#94a3b8' },
};

const VEHICLE_STATUS_CONFIG = {
  [VehicleStatus.AVAILABLE]: { label: 'Available', color: '#10b981' },
  [VehicleStatus.DELIVERING]: { label: 'Delivering', color: '#6366f1' },
  [VehicleStatus.MAINTENANCE]: { label: 'Maintenance', color: '#ef4444' },
};

const VEHICLE_TYPE_LABELS = {
  [VehicleType.SMALL]: 'Small Van',
  [VehicleType.MEDIUM]: 'Box Truck',
  [VehicleType.LARGE]: 'Semi Truck',
};

const normalizePlate = (plate: string) => {
  return plate.toLowerCase().replace(/[^a-z0-9]/g, '');
};

export default function AdminFleetScreen() {
  const router = useRouter();
  const { 
    drivers, 
    vehicles, 
    loading, 
    fetchDrivers, 
    fetchVehicles 
  } = useFleetStore();

  const [activeTab, setActiveTab] = useState<'drivers' | 'vehicles'>('drivers');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    fetchDrivers();
    fetchVehicles();
  };

  const onRefresh = React.useCallback(() => {
    loadData();
  }, []);

  const filteredDrivers = useMemo(() => {
    return drivers.filter(d => {
      const fullName = d?.user?.fullName || '';
      const email = d?.user?.email || '';
      return fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
             email.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [drivers, searchQuery]);

  const filteredVehicles = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const normalizedQuery = normalizePlate(query);

    return vehicles.filter(v => {
      const plateNumber = v?.plateNumber || '';
      const type = v?.type || '';
      return (
        normalizePlate(plateNumber).includes(normalizedQuery) ||
        plateNumber.toLowerCase().includes(query) ||
        type.toLowerCase().includes(query)
      );
    });
  }, [vehicles, searchQuery]);

  const renderDriverCard = ({ item }: { item: Driver }) => (
    <DriverCard 
      driver={item} 
      onPress={() => router.push({
        pathname: '/admin/fleet/drivers/[id]',
        params: { id: item.id }
      } as any)}
    />
  );

  const renderVehicleCard = ({ item }: { item: Vehicle }) => (
    <VehicleCard 
      vehicle={item} 
      onPress={() => router.push({
        pathname: '/admin/fleet/vehicles/[id]',
        params: { id: item.id }
      } as any)}
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-row justify-between items-center px-5 pt-3 mb-5">
        <View>
          <Text className="text-base text-slate-400 font-medium">Management</Text>
          <Text className="text-3xl font-bold text-slate-50">Fleet</Text>
        </View>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity 
            className="bg-slate-800 w-12 h-12 rounded-2xl justify-center items-center border border-white/10"
            onPress={() => router.push('/admin/dispatch' as any)}
          >
            <Settings2 size={22} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity 
            className="bg-indigo-500 w-12 h-12 rounded-2xl justify-center items-center shadow-lg shadow-indigo-500/50"
            onPress={() => router.push((activeTab === 'drivers' ? '/admin/fleet/drivers/create' : '/admin/fleet/vehicles/create') as any)}
          >
            <Plus size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-row bg-slate-800 mx-5 rounded-2xl p-1 mb-4">
        <TouchableOpacity 
          className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl gap-2 ${activeTab === 'drivers' ? 'bg-indigo-500' : ''}`}
          onPress={() => setActiveTab('drivers')}
        >
          <Users size={18} color={activeTab === 'drivers' ? '#fff' : '#94a3b8'} />
          <Text className={`font-bold text-sm ${activeTab === 'drivers' ? 'text-white' : 'text-slate-400'}`}>Drivers</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl gap-2 ${activeTab === 'vehicles' ? 'bg-indigo-500' : ''}`}
          onPress={() => setActiveTab('vehicles')}
        >
          <Truck size={18} color={activeTab === 'vehicles' ? '#fff' : '#94a3b8'} />
          <Text className={`font-bold text-sm ${activeTab === 'vehicles' ? 'text-white' : 'text-slate-400'}`}>Vehicles</Text>
        </TouchableOpacity>
      </View>

      <View className="px-5 mb-4">
        <BlurView intensity={20} tint="dark" className="flex-row items-center rounded-2xl px-4 h-14 border border-white/10 overflow-hidden">
          <Search size={20} color="#64748b" className="mr-3" />
          <TextInput
            className="flex-1 text-slate-50 text-base h-full"
            placeholder={`Search ${activeTab}...`}
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </BlurView>
      </View>

      <FlatList
        data={activeTab === 'drivers' ? (filteredDrivers as (Driver | Vehicle)[]) : (filteredVehicles as (Driver | Vehicle)[])}
        renderItem={({ item }) => {
          if (activeTab === 'drivers') {
            return renderDriverCard({ item: item as Driver });
          }
          return renderVehicleCard({ item: item as Vehicle });
        }}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#6366f1" />
        }
        ListEmptyComponent={
          !loading ? (
            <View className="items-center justify-center mt-20 gap-4">
              <Activity size={64} color="#1e293b" />
              <Text className="text-slate-50 text-xl font-bold">No {activeTab} found</Text>
              <Text className="text-slate-500 text-base">Try adjusting your search</Text>
            </View>
          ) : (
            <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
          )
        }
      />
    </SafeAreaView>
  );
}
