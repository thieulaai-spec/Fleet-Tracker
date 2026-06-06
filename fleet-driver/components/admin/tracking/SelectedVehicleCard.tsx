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
import { User, Navigation, Truck, MapPin, Phone, ChevronDown, ChevronUp } from 'lucide-react-native';
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
  const [isExpanded, setIsExpanded] = React.useState(true);

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
      className="absolute left-4 right-4 rounded-3xl overflow-hidden p-4 border border-slate-700 shadow-2xl shadow-black/5"
      style={{ bottom: 112, backgroundColor: 'rgba(255, 255, 255, 0.96)' }}
    >
      {/* Top Flex Row containing large Image & Details side-by-side */}
      <View className="flex-row gap-4 items-center mb-3">
        {/* Large Vehicle Image */}
        <View className="relative">
          {selectedVehicle.imageUrl ? (
            <Image 
              source={{ uri: selectedVehicle.imageUrl }} 
              className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700" 
              resizeMode="cover" 
            />
          ) : (
            <View className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 items-center justify-center">
              <Truck size={32} color="#059669" />
            </View>
          )}
        </View>

        {/* Text Info */}
        <View className="flex-1 justify-between h-20 py-0.5">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-2">
              <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getStatusColor(selectedVehicle.status) }} />
              <Text className="text-white text-lg font-extrabold">{selectedVehicle.licensePlate}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text className="text-slate-500 text-xs font-bold">Close</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center gap-1.5">
            <User size={14} color="#64748b" />
            <Text className="text-slate-100 text-sm font-semibold" numberOfLines={1}>
              {selectedVehicle.driverName}
            </Text>
          </View>

          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <Navigation size={12} color="#64748b" />
              <Text className="text-slate-200 text-xs font-semibold">{selectedVehicle.speed} km/h</Text>
            </View>
            <Text className="text-slate-400 text-[10px] font-bold">•</Text>
            <Text className="text-indigo-600 text-xs font-extrabold uppercase">
              {selectedVehicle.status.replace('_', ' ')}
            </Text>
          </View>

          <View className="flex-row items-center gap-1">
            <Text className="text-slate-500 text-[10px] font-semibold">Updated:</Text>
            <Text className="text-slate-100 text-[10px] font-bold">Just now</Text>
          </View>
        </View>
      </View>

      {/* Render active trip destinations directly on card */}
      {activeTrip && activeTrip.tripOrders && activeTrip.tripOrders.length > 0 && (
        <View className="mt-0.5 pt-2 border-t border-slate-700 gap-1.5 mb-3">
          <TouchableOpacity 
            className="flex-row items-center justify-between mb-0.5"
            onPress={() => setIsExpanded(!isExpanded)}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-1.5">
              <MapPin size={12} color="#059669" />
              <Text className="text-indigo-700 text-[10px] font-black uppercase tracking-wider">Thông tin địa điểm chuyến đi</Text>
            </View>
            {isExpanded ? (
              <ChevronUp size={14} color="#047857" />
            ) : (
              <ChevronDown size={14} color="#047857" />
            )}
          </TouchableOpacity>
          {isExpanded && activeTrip.tripOrders.map((to: any) => {
            const order = to.order;
            if (!order) return null;
            return (
              <View key={order.id} className="bg-slate-800 rounded-xl p-2.5 border border-slate-700 gap-1">
                <View className="flex-row justify-between items-center mb-0.5">
                  <Text className="text-white text-[11px] font-bold font-mono">Đơn: #{order.id.substring(0, 8)}</Text>
                  <Text className="text-emerald-700 text-[9px] font-black uppercase px-1.5 py-0.2 bg-emerald-500/10 rounded-full">{order.status}</Text>
                </View>
                <View className="gap-0.5">
                  <Text className="text-slate-300 text-[11px]" numberOfLines={1} ellipsizeMode="tail">
                    📍 <Text className="font-bold text-indigo-700">Lấy:</Text> {order.pickupAddress}
                  </Text>
                  <Text className="text-slate-300 text-[11px]" numberOfLines={1} ellipsizeMode="tail">
                    🏁 <Text className="font-bold text-emerald-700">Giao:</Text> {order.deliveryAddress}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Driver Actions (Details & Call) */}
      <View className="flex-row gap-3 mb-2.5">
        <TouchableOpacity
          onPress={() => {
            const driverId = selectedVehicle.driverId || resolvedDriver?.id;
            if (driverId) {
              router.push(`/admin/fleet/drivers/${driverId}` as any);
            } else {
              Alert.alert('Thông báo', 'Không tìm thấy thông tin chi tiết tài xế.');
            }
          }}
          className="flex-1 bg-indigo-600 py-2.5 rounded-2xl items-center flex-row justify-center gap-2"
          activeOpacity={0.7}
        >
          <User size={14} color="#ffffff" />
          <Text className="text-slate-950 font-black uppercase text-[11px] tracking-wider">Chi Tiết Tài Xế</Text>
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
          className="flex-1 bg-slate-800 border border-slate-700 py-2.5 rounded-2xl items-center flex-row justify-center gap-2"
          activeOpacity={0.7}
        >
          <Phone size={14} color="#059669" />
          <Text className="text-indigo-600 font-black uppercase text-[11px] tracking-wider">Gọi Điện</Text>
        </TouchableOpacity>
      </View>

      {selectedVehicle.tripId ? (
        <TouchableOpacity
          onPress={() => onFetchDetails(selectedVehicle.tripId!)}
          disabled={isFetchingDetails}
          className="bg-indigo-600 py-2.5 rounded-2xl items-center flex-row justify-center gap-2"
        >
          {isFetchingDetails ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text className="text-slate-950 font-black uppercase text-[11px] tracking-wider">Xem Chi Tiết Minh Chứng</Text>
          )}
        </TouchableOpacity>
      ) : (
        <View className="bg-slate-800 py-2.5 rounded-2xl items-center border border-slate-700">
          <Text className="text-slate-500 text-[11px] font-semibold">Không Có Chuyến Đi Đang Chạy</Text>
        </View>
      )}
    </BlurView>
  );
};
