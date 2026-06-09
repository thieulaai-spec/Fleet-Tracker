import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert
} from 'react-native';
import { 
  Search, 
  Activity
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { useFleetStore, Driver, Vehicle } from '../../store/useFleetStore';

import { DriverCard } from '../../components/admin/fleet/DriverCard';
import { VehicleCard } from '../../components/admin/fleet/VehicleCard';
import { FleetHeader } from '../../components/admin/fleet/FleetHeader';
import { FleetTabs } from '../../components/admin/fleet/FleetTabs';

const normalizePlate = (plate: string) => {
  return plate.toLowerCase().replace(/[^a-z0-9]/g, '');
};

export default function AdminFleetScreen() {
  const router = useRouter();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const { 
    drivers, 
    vehicles, 
    loading, 
    fetchDrivers, 
    fetchVehicles,
    clearAllFingerprints
  } = useFleetStore();

  const [activeTab, setActiveTab] = useState<'drivers' | 'vehicles'>('drivers');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (tab === 'vehicles' || tab === 'drivers') {
      setActiveTab(tab);
    }
  }, [tab]);

  const handleClearAllFingerprints = () => {
    Alert.alert(
      "Xóa tất cả vân tay",
      "Bạn có chắc chắn muốn xóa toàn bộ đăng ký vân tay của tất cả tài xế trong hệ thống và bộ nhớ phần cứng của tất cả xe? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa tất cả", 
          style: "destructive", 
          onPress: async () => {
            try {
              await clearAllFingerprints();
              Toast.show({
                type: 'success',
                text1: 'Thành công 🎉',
                text2: 'Đã xóa toàn bộ vân tay tài xế trên cơ sở dữ liệu.',
                visibilityTime: 4000
              });
              Alert.alert(
                "Đã yêu cầu xóa",
                "Đã gửi lệnh xóa đến tất cả thiết bị phần cứng. Hệ thống sẽ hiển thị thông báo thời gian thực ngay khi từng xe hoàn tất việc xóa vân tay."
              );
            } catch (error: any) {
              Alert.alert("Thất bại", error.message || "Không thể xóa vân tay.");
            }
          }
        }
      ]
    );
  };

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
    <View className="flex-1 bg-slate-950">
      <LinearGradient
        colors={['#e6fcf0', '#f1f5f9', '#ffffff']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 0.8 }}
      />
      <View 
        style={{
          position: 'absolute',
          top: -80,
          right: -80,
          width: 280,
          height: 280,
          borderRadius: 140,
          backgroundColor: '#34d399',
          opacity: 0.15,
        }}
      />
      <View 
        style={{
          position: 'absolute',
          top: 250,
          left: -120,
          width: 300,
          height: 300,
          borderRadius: 150,
          backgroundColor: '#10b981',
          opacity: 0.1,
        }}
      />
      <View 
        style={{
          position: 'absolute',
          bottom: 100,
          right: -100,
          width: 320,
          height: 320,
          borderRadius: 160,
          backgroundColor: '#a7f3d0',
          opacity: 0.2,
        }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        <FleetHeader
          activeTab={activeTab}
          onClearAllFingerprints={handleClearAllFingerprints}
          onSettings={() => router.push('/admin/dispatch' as any)}
          onAdd={() => router.push((activeTab === 'drivers' ? '/admin/fleet/drivers/create' : '/admin/fleet/vehicles/create') as any)}
        />

        <FleetTabs
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
        />

        <View className="px-5 mb-4">
          <BlurView intensity={20} tint="light" className="flex-row items-center rounded-2xl px-4 h-14 border border-white/10 overflow-hidden">
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
            <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#059669" />
          }
          ListEmptyComponent={
            !loading ? (
              <View className="items-center justify-center mt-20 gap-4">
                <Activity size={64} color="#1e293b" />
                <Text className="text-slate-50 text-xl font-bold">No {activeTab} found</Text>
                <Text className="text-slate-500 text-base">Try adjusting your search</Text>
              </View>
            ) : (
              <ActivityIndicator size="large" color="#059669" style={{ marginTop: 40 }} />
            )
          }
        />
      </SafeAreaView>
    </View>
  );
}
