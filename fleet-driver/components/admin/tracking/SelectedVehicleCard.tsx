import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { User, Navigation, Truck, MapPin, Phone } from 'lucide-react-native';
import { router } from 'expo-router';
import { authFetch } from '../../../lib/authFetch';
import { getStatusColor } from './trackingUtils';

interface SelectedVehicleCardProps {
  selectedVehicle: any;
  activeTrip: any | null;
  onClose: () => void;
  isFetchingDetails: boolean;
  onFetchDetails: (tripId: string) => void;
}

export const SelectedVehicleCard: React.FC<SelectedVehicleCardProps> = ({
  selectedVehicle,
  activeTrip,
  onClose,
  isFetchingDetails,
  onFetchDetails,
}) => {
  const [resolvedDriver, setResolvedDriver] = React.useState<{ id?: string; phone?: string } | null>(null);

  React.useEffect(() => {
    if (!selectedVehicle) return;
    
    // Reset state
    setResolvedDriver(null);

    // If we already have driverId and driverPhone, no need to fetch
    if (selectedVehicle.driverId && selectedVehicle.driverPhone) {
      setResolvedDriver({
        id: selectedVehicle.driverId,
        phone: selectedVehicle.driverPhone,
      });
      return;
    }

    // Otherwise, fetch all drivers and find the match by driverName (fallback for old API deployments)
    const resolveDriverData = async () => {
      try {
        const response = await authFetch('/drivers');
        if (!response.ok) return;
        const result = await response.json();
        const driversList = Array.isArray(result) ? result : (result.data || []);
        
        const matched = driversList.find((d: any) => 
          d.user?.fullName?.toLowerCase() === selectedVehicle.driverName?.toLowerCase()
        );

        if (matched) {
          setResolvedDriver({
            id: matched.id,
            phone: matched.user?.phone,
          });
        }
      } catch (err) {
        console.warn('Failed to resolve driver data via fallback:', err);
      }
    };

    resolveDriverData();
  }, [selectedVehicle?.id, selectedVehicle?.driverName, selectedVehicle?.driverId, selectedVehicle?.driverPhone]);

  if (!selectedVehicle) return null;

  return (
    <BlurView 
      intensity={95} 
      tint="light" 
      className="absolute left-4 right-4 rounded-3xl overflow-hidden p-5 border border-slate-700 shadow-2xl shadow-black/5"
      style={{ bottom: 112, backgroundColor: 'rgba(255, 255, 255, 0.96)' }}
    >
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center gap-2">
          <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getStatusColor(selectedVehicle.status) }} />
          <Text className="text-white text-xl font-extrabold">{selectedVehicle.licensePlate}</Text>
        </View>
        <TouchableOpacity onPress={onClose}>
          <Text className="text-slate-500 text-sm font-semibold">Close</Text>
        </TouchableOpacity>
      </View>

      <View className="gap-3 mb-4">
        <View className="flex-row justify-between">
          <View className="flex-row items-center gap-2 flex-1">
            <User size={16} color="#475569" />
            <Text className="text-slate-100 text-sm font-medium" numberOfLines={1}>{selectedVehicle.driverName}</Text>
          </View>
          <View className="flex-row items-center gap-2 flex-1">
            <Navigation size={16} color="#475569" />
            <Text className="text-slate-100 text-sm font-medium">{selectedVehicle.speed} km/h</Text>
          </View>
        </View>

        <View className="flex-row justify-between">
          <View className="flex-row items-center gap-2 flex-1">
            {selectedVehicle.imageUrl ? (
              <Image source={{ uri: selectedVehicle.imageUrl }} className="w-5 h-5 rounded-md bg-slate-800 border border-slate-700" resizeMode="cover" />
            ) : (
              <Truck size={16} color="#475569" />
            )}
            <Text className="text-slate-100 text-sm font-medium">{selectedVehicle.status.replace('_', ' ').toUpperCase()}</Text>
          </View>
          <View className="flex-row items-center gap-2 flex-1">
            <Text className="text-slate-500 text-xs font-semibold">Updated: </Text>
            <Text className="text-slate-100 text-sm font-semibold">Just now</Text>
          </View>
        </View>
      </View>

      {/* Render active trip destinations directly on card */}
      {activeTrip && activeTrip.tripOrders && activeTrip.tripOrders.length > 0 && (
        <View className="mt-1 pt-3 border-t border-slate-700 gap-2 mb-4">
          <View className="flex-row items-center gap-1.5 mb-1">
            <MapPin size={12} color="#059669" />
            <Text className="text-indigo-700 text-[10px] font-black uppercase tracking-wider">Thông tin địa điểm chuyến đi</Text>
          </View>
          {activeTrip.tripOrders.map((to: any) => {
            const order = to.order;
            if (!order) return null;
            return (
              <View key={order.id} className="bg-slate-800 rounded-xl p-3 border border-slate-700 gap-1.5">
                <View className="flex-row justify-between items-center">
                  <Text className="text-white text-xs font-bold font-mono">Đơn: #{order.id.substring(0, 8)}</Text>
                  <Text className="text-emerald-700 text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-500/10 rounded-full">{order.status}</Text>
                </View>
                <View className="gap-1">
                  <Text className="text-slate-300 text-xs" numberOfLines={1} ellipsizeMode="tail">
                    📍 <Text className="font-bold text-indigo-700">Lấy:</Text> {order.pickupAddress}
                  </Text>
                  <Text className="text-slate-300 text-xs" numberOfLines={1} ellipsizeMode="tail">
                    🏁 <Text className="font-bold text-emerald-700">Giao:</Text> {order.deliveryAddress}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Driver Actions (Details & Call) */}
      <View className="flex-row gap-3 mb-3">
        <TouchableOpacity
          onPress={() => {
            const driverId = selectedVehicle.driverId || resolvedDriver?.id;
            if (driverId) {
              router.push(`/admin/fleet/drivers/${driverId}` as any);
            } else {
              Alert.alert('Thông báo', 'Không tìm thấy thông tin chi tiết tài xế.');
            }
          }}
          className="flex-1 bg-indigo-600 py-3.5 rounded-2xl items-center flex-row justify-center gap-2"
          activeOpacity={0.7}
        >
          <User size={16} color="#ffffff" />
          <Text className="text-slate-950 font-black uppercase text-xs tracking-wider">Chi Tiết Tài Xế</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            const phone = selectedVehicle.driverPhone || resolvedDriver?.phone;
            if (phone) {
              Linking.openURL(`tel:${phone}`).catch(() => {
                Alert.alert('Lỗi', 'Không thể gọi cho tài xế.');
              });
            } else {
              Alert.alert('Thông báo', 'Không tìm thấy số điện thoại của tài xế.');
            }
          }}
          className="flex-1 bg-slate-800 border border-slate-700 py-3.5 rounded-2xl items-center flex-row justify-center gap-2"
          activeOpacity={0.7}
        >
          <Phone size={16} color="#059669" />
          <Text className="text-indigo-600 font-black uppercase text-xs tracking-wider">Gọi Điện</Text>
        </TouchableOpacity>
      </View>

      {selectedVehicle.tripId ? (
        <TouchableOpacity
          onPress={() => onFetchDetails(selectedVehicle.tripId!)}
          disabled={isFetchingDetails}
          className="bg-indigo-600 py-3.5 rounded-2xl items-center flex-row justify-center gap-2"
        >
          {isFetchingDetails ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text className="text-slate-950 font-black uppercase text-xs tracking-wider">Xem Chi Tiết Minh Chứng</Text>
          )}
        </TouchableOpacity>
      ) : (
        <View className="bg-slate-800 py-3.5 rounded-2xl items-center border border-slate-700">
          <Text className="text-slate-500 text-xs font-semibold">Không Có Chuyến Đi Đang Chạy</Text>
        </View>
      )}
    </BlurView>
  );
};
