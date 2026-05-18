import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Package, 
  MapPin, 
  Scale, 
  Clock, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock3,
  ChevronRight,
  Truck,
  Send
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useOrderStore, OrderStatus, Order } from '../../../store/useOrderStore';
import { useFleetStore } from '../../../store/useFleetStore';
import { OrderForm } from '../../../components/admin/OrderForm';
import { VehicleDispatchItem } from '../../../components/admin/VehicleDispatchItem';
import { MapComponent, MarkerComponent, PolylineComponent, PROVIDER_GOOGLE } from '../../../components/map/MapComponents';

const STATUS_CONFIG = {
  [OrderStatus.PENDING]: { label: 'Pending', color: '#f59e0b', icon: Clock3 },
  [OrderStatus.ASSIGNED]: { label: 'Assigned', color: '#6366f1', icon: Package },
  [OrderStatus.PICKED_UP]: { label: 'Picked Up', color: '#8b5cf6', icon: MapPin },
  [OrderStatus.DELIVERING]: { label: 'Delivering', color: '#0ea5e9', icon: MapPin },
  [OrderStatus.DELIVERED]: { label: 'Delivered', color: '#10b981', icon: CheckCircle2 },
  [OrderStatus.FAILED]: { label: 'Failed', color: '#ef4444', icon: AlertCircle },
  [OrderStatus.CANCELLED]: { label: 'Cancelled', color: '#94a3b8', icon: XCircle },
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getOrderById, updateOrder, deleteOrder, assignOrder, loading } = useOrderStore();
  const { suggestions, fetchSuggestions, loading: fleetLoading } = useFleetStore();
  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      const data = getOrderById(id as string);
      setOrder(data);
      if (data?.status === OrderStatus.PENDING) {
        fetchSuggestions(data.id).catch(console.error);
      }
    }
  }, [id, getOrderById, fetchSuggestions]);

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950">
        <View className="flex-1 justify-center items-center gap-4">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="text-slate-400 text-sm font-medium">Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      "Delete Order",
      "Are you sure you want to delete this order? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteOrder(order.id);
              router.back();
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          }
        }
      ]
    );
  };

  const handleUpdate = async (data: Partial<Order>) => {
    try {
      const updated = await updateOrder(order.id, data);
      setOrder(updated);
      setIsEditing(false);
      Alert.alert("Success", "Order updated successfully");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: "destructive",
          onPress: async () => {
            try {
              await updateOrder(order.id, { status: OrderStatus.CANCELLED });
              setOrder(prev => prev ? { ...prev, status: OrderStatus.CANCELLED } : undefined);
              Alert.alert("Success", "Order cancelled successfully");
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          }
        }
      ]
    );
  };

  const handleAssign = async () => {
    if (!selectedVehicleId) return;

    const suggestion = suggestions.find(s => s.vehicle.id === selectedVehicleId);
    if (!suggestion || !suggestion.vehicle.driverId) {
      Alert.alert('Error', 'Selected vehicle must have a driver assigned.');
      return;
    }

    const vehicle = suggestion.vehicle;

    Alert.alert(
      'Confirm Dispatch',
      `Assign this order to Vehicle ${vehicle.plateNumber} and Driver ${vehicle.driver?.user?.fullName || 'Assigned Driver'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Assign',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await assignOrder(order.id, selectedVehicleId, vehicle.driverId!);
              setOrder(prev => prev ? { ...prev, status: OrderStatus.ASSIGNED } : undefined);
              setSelectedVehicleId(null);
              Alert.alert('Success', 'Order has been dispatched successfully!');
            } catch (error: any) {
              Alert.alert('Dispatch Failed', error.message);
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG[OrderStatus.PENDING];
  const StatusIcon = statusConfig.icon;
  const canCancel = order.status === OrderStatus.PENDING || order.status === OrderStatus.ASSIGNED;

  if (isEditing) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950" edges={['top']}>
        <View className="flex-row items-center px-4 py-3 gap-4 border-b border-white/5 bg-slate-950">
          <TouchableOpacity 
            onPress={() => setIsEditing(false)} 
            className="w-10 h-10 rounded-full bg-white/5 justify-center items-center"
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="flex-1 text-xl font-extrabold text-white">Edit Order</Text>
        </View>
        <OrderForm 
          initialData={order} 
          onSubmit={handleUpdate} 
          loading={loading} 
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top']}>
      <View className="flex-row items-center px-4 py-3 gap-4 border-b border-white/5 bg-slate-950">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 rounded-full bg-white/5 justify-center items-center"
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="flex-1 text-xl font-extrabold text-white">Order Detail</Text>
        <View className="flex-row gap-2">
          {canCancel && (
            <TouchableOpacity 
              onPress={handleCancel} 
              className="w-10 h-10 rounded-full bg-white/5 justify-center items-center"
            >
              <XCircle size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={() => setIsEditing(true)} 
            className="w-10 h-10 rounded-full bg-white/5 justify-center items-center"
          >
            <Edit3 size={20} color="#6366f1" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleDelete} 
            className="w-10 h-10 rounded-full bg-white/5 justify-center items-center"
          >
            <Trash2 size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: order.status === OrderStatus.PENDING && selectedVehicleId ? 120 : 40 }}>
        {/* Map Preview */}
        <View className="h-56 w-full overflow-hidden relative">
          <MapComponent
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1 }}
            initialRegion={{
              latitude: (order.pickupLocation.coordinates[1] + order.deliveryLocation.coordinates[1]) / 2,
              longitude: (order.pickupLocation.coordinates[0] + order.deliveryLocation.coordinates[0]) / 2,
              latitudeDelta: Math.abs(order.pickupLocation.coordinates[1] - order.deliveryLocation.coordinates[1]) * 1.5 || 0.05,
              longitudeDelta: Math.abs(order.pickupLocation.coordinates[0] - order.deliveryLocation.coordinates[0]) * 1.5 || 0.05,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <MarkerComponent
              coordinate={{
                latitude: order.pickupLocation.coordinates[1],
                longitude: order.pickupLocation.coordinates[0],
              }}
              title="Pickup"
              pinColor="#f59e0b"
            />
            <MarkerComponent
              coordinate={{
                latitude: order.deliveryLocation.coordinates[1],
                longitude: order.deliveryLocation.coordinates[0],
              }}
              title="Delivery"
              pinColor="#10b981"
            />
            <PolylineComponent
              coordinates={[
                { latitude: order.pickupLocation.coordinates[1], longitude: order.pickupLocation.coordinates[0] },
                { latitude: order.deliveryLocation.coordinates[1], longitude: order.deliveryLocation.coordinates[0] }
              ]}
              strokeColor="#6366f1"
              strokeWidth={3}
              lineDashPattern={[5, 5]}
            />
          </MapComponent>
          <BlurView 
            intensity={20} 
            tint="dark" 
            className="justify-end"
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0, padding: 16, backgroundColor: 'rgba(15, 23, 42, 0.3)' }}
          >
            <View 
              className="flex-row items-center self-start px-3 py-1.5 rounded-xl gap-2 shadow-lg shadow-black/20"
              style={{ backgroundColor: `${statusConfig.color}CC` }}
            >
              <StatusIcon size={16} color="#fff" />
              <Text className="text-white font-extrabold text-xs uppercase tracking-wide">{statusConfig.label}</Text>
            </View>
          </BlurView>
        </View>

        {/* Info Sections */}
        <View className="p-5 gap-5">
          <View className="bg-slate-900 p-4 rounded-3xl border border-white/5">
            <Text className="text-[10px] text-slate-500 font-bold tracking-wider mb-1">ORDER REFERENCE</Text>
            <Text 
              className="text-slate-100 text-base font-bold"
              style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
            >
              {order.id.toUpperCase()}
            </Text>
          </View>

          {/* Dispatch Section */}
          {order.status === OrderStatus.PENDING && (
            <View className="bg-slate-900 rounded-3xl p-5 border border-indigo-500/20 gap-4">
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-2.5">
                  <Truck size={20} color="#6366f1" />
                  <Text className="text-lg font-bold text-slate-100">Available Resources</Text>
                </View>
                <View className="bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  <Text className="text-emerald-500 text-xs font-black">{suggestions.length}</Text>
                </View>
              </View>

              {fleetLoading ? (
                <View className="py-6 justify-center items-center gap-2">
                  <ActivityIndicator size="small" color="#6366f1" />
                  <Text className="text-slate-400 text-xs">Loading available vehicles...</Text>
                </View>
              ) : suggestions.length === 0 ? (
                <View className="bg-slate-950/40 rounded-2xl p-6 items-center border border-dashed border-slate-800">
                  <AlertCircle size={28} color="#475569" />
                  <Text className="text-slate-400 mt-2 text-center text-xs">No available vehicles with drivers</Text>
                </View>
              ) : (
                <View className="gap-1">
                  {suggestions.map((suggestion, index) => (
                    <VehicleDispatchItem
                      key={suggestion.vehicle.id}
                      vehicle={suggestion.vehicle}
                      isSelected={selectedVehicleId === suggestion.vehicle.id}
                      onPress={() => setSelectedVehicleId(suggestion.vehicle.id === selectedVehicleId ? null : suggestion.vehicle.id)}
                      distanceKm={suggestion.distanceKm}
                      rank={index}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          <View className="bg-slate-900 rounded-3xl p-5 border border-white/5">
            <View className="flex-row items-center gap-2.5 mb-4">
              <MapPin size={20} color="#6366f1" />
              <Text className="text-lg font-bold text-slate-100">Route Details</Text>
            </View>
            
            <View className="flex-row gap-4">
              <View className="w-3 items-center">
                <View className="w-3 h-3 rounded-full bg-amber-500 mt-1" />
                <View className="w-0.5 flex-1 bg-white/10 my-1" />
              </View>
              <View className="flex-1 pb-4">
                <Text className="text-xs text-slate-500 font-semibold mb-1">Pickup Address</Text>
                <Text className="text-sm text-slate-300 leading-5">{order.pickupAddress}</Text>
              </View>
            </View>
            
            <View className="flex-row gap-4">
              <View className="w-3 items-center">
                <View className="w-3 h-3 rounded-full bg-emerald-500 mt-1" />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-slate-500 font-semibold mb-1">Delivery Address</Text>
                <Text className="text-sm text-slate-300 leading-5">{order.deliveryAddress}</Text>
              </View>
            </View>
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1 bg-slate-900 rounded-3xl p-5 border border-white/5">
              <View className="flex-row items-center gap-2 mb-3">
                <Scale size={18} color="#6366f1" />
                <Text className="text-sm font-bold text-slate-100">Weight</Text>
              </View>
              <Text className="text-xl font-extrabold text-white">{order.weightKg} kg</Text>
            </View>

            <View className="flex-1 bg-slate-900 rounded-3xl p-5 border border-white/5">
              <View className="flex-row items-center gap-2 mb-3">
                <Calendar size={18} color="#6366f1" />
                <Text className="text-sm font-bold text-slate-100">Date</Text>
              </View>
              <Text className="text-xl font-extrabold text-white">
                {new Date(order.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {order.description && (
            <View className="bg-slate-900 rounded-3xl p-5 border border-white/5">
              <View className="flex-row items-center gap-2.5 mb-4">
                <Package size={20} color="#6366f1" />
                <Text className="text-lg font-bold text-slate-100">Instructions</Text>
              </View>
              <Text className="text-slate-400 text-sm leading-6">{order.description}</Text>
            </View>
          )}

          <View className="bg-slate-900 rounded-3xl p-5 border border-white/5">
            <View className="flex-row items-center gap-2.5 mb-4">
              <Clock size={20} color="#6366f1" />
              <Text className="text-lg font-bold text-slate-100">Timeline</Text>
            </View>
            <View className="flex-row items-center gap-3 mb-3">
              <View className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <Text className="text-slate-500 text-xs flex-1">
                Order created on {new Date(order.createdAt).toLocaleString()}
              </Text>
            </View>
            {order.updatedAt !== order.createdAt && (
              <View className="flex-row items-center gap-3">
                <View className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <Text className="text-slate-500 text-xs flex-1">
                  Last updated on {new Date(order.updatedAt).toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      {order.status === OrderStatus.PENDING && selectedVehicleId && (
        <View 
          className="absolute bottom-6 left-5 right-5"
          style={{
            shadowColor: '#6366f1',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.1,
            shadowRadius: 24,
            elevation: 8,
          }}
        >
          <TouchableOpacity 
            onPress={handleAssign}
            disabled={isSubmitting}
            className="bg-indigo-600 h-14 rounded-2xl flex-row justify-center items-center"
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Send size={18} color="#fff" />
                <Text className="text-white font-extrabold ml-2 text-base">Confirm Assignment</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
