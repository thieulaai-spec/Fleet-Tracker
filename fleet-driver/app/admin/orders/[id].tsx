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
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Truck,
  Send,
  AlertCircle,
  ArrowLeft
} from 'lucide-react-native';
import { useOrderStore, OrderStatus, Order } from '../../../store/useOrderStore';
import { useFleetStore } from '../../../store/useFleetStore';
import { OrderForm } from '../../../components/admin/order/OrderForm';
import { VehicleDispatchItem } from '../../../components/admin/dispatch/VehicleDispatchItem';
import { OrderDetailHeader } from '../../../components/admin/order/OrderDetailHeader';
import { OrderDetailMap } from '../../../components/admin/order/OrderDetailMap';
import { AssignedTripCard } from '../../../components/admin/dispatch/AssignedTripCard';
import { OrderDetailInfo } from '../../../components/admin/order/OrderDetailInfo';
import { authFetch } from '../../../lib/authFetch';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getOrderById, fetchOrderById, updateOrder, deleteOrder, assignOrder, loading } = useOrderStore();
  const { suggestions, fetchSuggestions, loading: fleetLoading } = useFleetStore();
  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [verifications, setVerifications] = useState<any[]>([]);
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

      // Fetch fresh order details from backend to ensure assignedTrip is fully populated
      fetchOrderById(id as string)
        .then((freshData) => {
          setOrder(freshData);
          if (freshData?.status === OrderStatus.PENDING) {
            fetchSuggestions(freshData.id).catch(console.error);
          }
        })
        .catch(console.error);

      // Fetch verifications from backend
      authFetch(`/orders/${id}/verifications`)
        .then(async (res) => {
          if (res.ok) {
            const result = await res.json();
            const verData = result.data || result;
            setVerifications(Array.isArray(verData) ? verData : []);
          }
        })
        .catch((err) => console.error('Failed to fetch order verifications:', err));
    }
  }, [id, getOrderById, fetchOrderById, fetchSuggestions]);

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

  const canCancel = order.status === OrderStatus.PENDING || order.status === OrderStatus.ASSIGNED;

  if (isEditing) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950" edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
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
      <Stack.Screen options={{ headerShown: false }} />
      <OrderDetailHeader 
        onBack={() => router.back()}
        onEdit={() => setIsEditing(true)}
        onDelete={handleDelete}
        onCancel={handleCancel}
        canCancel={canCancel}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: order.status === OrderStatus.PENDING && selectedVehicleId ? 120 : 40 }}>
        {/* Map Preview */}
        <OrderDetailMap order={order} />

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

          {/* Assigned Driver & Vehicle Details Card */}
          <AssignedTripCard assignedTrip={order.assignedTrip} />

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

          {/* Route Details, Weight, Date, Instructions, Timeline */}
          <OrderDetailInfo order={order} verifications={verifications} />
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

