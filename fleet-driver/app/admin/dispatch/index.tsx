import React, { useState, useEffect } from 'react';
import { ScrollView, Alert, View, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOrderStore, OrderStatus } from '../../../store/useOrderStore';
import { useFleetStore, VehicleStatus, Vehicle } from '../../../store/useFleetStore';
import { LinearGradient } from 'expo-linear-gradient';

// Subcomponents
import DispatchHeader from './components/DispatchHeader';
import SmartDispatchBanner from './components/SmartDispatchBanner';
import OrdersSection from './components/OrdersSection';
import VehiclesSection from './components/VehiclesSection';
import ConfirmDispatchButton from './components/ConfirmDispatchButton';

export default function DispatchCenterScreen() {
  const router = useRouter();
  const { orders, fetchOrders, assignOrder, loading: ordersLoading } = useOrderStore();
  const { vehicles, fetchVehicles, suggestions, fetchSuggestions, loading: fleetLoading } = useFleetStore();

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const getSuggestions = async () => {
      if (selectedOrderId) {
        setIsSuggestLoading(true);
        try {
          await fetchSuggestions(selectedOrderId);
        } catch (e) {
          console.error('Error fetching suggestions:', e);
        } finally {
          setIsSuggestLoading(false);
        }
      } else {
        useFleetStore.setState({ suggestions: [] });
        setSelectedVehicleId(null);
      }
    };
    getSuggestions();
  }, [selectedOrderId]);

  const loadData = async () => {
    await Promise.all([
      fetchOrders({ status: OrderStatus.PENDING }),
      fetchVehicles(),
    ]);
  };

  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING);
  const availableVehicles = vehicles.filter(v => 
    v.status === VehicleStatus.AVAILABLE && v.driverId !== null
  );

  // Partition vehicles into suggested and others, computing warning flags
  const partitionedVehicles = React.useMemo(() => {
    const activeOrder = orders.find(o => o.id === selectedOrderId);

    if (!selectedOrderId || suggestions.length === 0) {
      return {
        suggested: [],
        others: availableVehicles.map(v => {
          const remainingCapacity = v.maxCapacityKg - v.currentLoadKg;
          const capacityWarning = activeOrder ? (remainingCapacity < activeOrder.weightKg) : false;
          const licenseWarning = v.driver?.licenseExpiry ? new Date(v.driver.licenseExpiry) < new Date() : false;
          return { vehicle: v, capacityWarning, licenseWarning };
        })
      };
    }

    const suggestedList: {
      vehicle: Vehicle;
      distanceKm: number;
      rank: number;
      capacityWarning: boolean;
      licenseWarning: boolean;
    }[] = [];
    const suggestedIds = new Set<string>();

    suggestions.forEach((s, index) => {
      const av = availableVehicles.find(v => v.id === s.vehicle.id);
      if (av) {
        const remainingCapacity = av.maxCapacityKg - av.currentLoadKg;
        const capacityWarning = activeOrder ? (remainingCapacity < activeOrder.weightKg) : false;
        const licenseWarning = av.driver?.licenseExpiry ? new Date(av.driver.licenseExpiry) < new Date() : false;

        suggestedList.push({
          vehicle: av,
          distanceKm: s.distanceKm,
          rank: index,
          capacityWarning,
          licenseWarning,
        });
        suggestedIds.add(av.id);
      }
    });

    const otherList = availableVehicles
      .filter(v => !suggestedIds.has(v.id))
      .map(v => {
        const remainingCapacity = v.maxCapacityKg - v.currentLoadKg;
        const capacityWarning = activeOrder ? (remainingCapacity < activeOrder.weightKg) : false;
        const licenseWarning = v.driver?.licenseExpiry ? new Date(v.driver.licenseExpiry) < new Date() : false;
        return { vehicle: v, capacityWarning, licenseWarning };
      });

    return { suggested: suggestedList, others: otherList };
  }, [selectedOrderId, suggestions, availableVehicles, orders]);

  const handleAssign = async () => {
    if (!selectedOrderId || !selectedVehicleId) return;

    const vehicle = vehicles.find(v => v.id === selectedVehicleId);
    if (!vehicle || !vehicle.driverId) {
      Alert.alert('Error', 'Selected vehicle must have an assigned driver.');
      return;
    }

    const order = orders.find(o => o.id === selectedOrderId);
    if (!order) return;

    const remainingCapacity = vehicle.maxCapacityKg - vehicle.currentLoadKg;
    const capacityWarning = remainingCapacity < order.weightKg;
    const licenseWarning = vehicle.driver?.licenseExpiry ? new Date(vehicle.driver.licenseExpiry) < new Date() : false;

    let warningMessage = '';
    if (capacityWarning) {
      warningMessage += `⚠️ The selected vehicle does not have enough remaining capacity (${remainingCapacity} kg remaining, order requires ${order.weightKg} kg).\n\n`;
    }
    if (licenseWarning) {
      const expiryStr = vehicle.driver?.licenseExpiry 
        ? new Date(vehicle.driver.licenseExpiry).toLocaleDateString()
        : 'Unknown';
      warningMessage += `⚠️ The driver's license (${vehicle.driver?.user?.fullName}) expired on ${expiryStr}.\n\n`;
    }

    const title = warningMessage ? 'Safety Check Warnings' : 'Confirm Dispatch';
    const message = warningMessage 
      ? `${warningMessage}Are you sure you still want to assign this order to the vehicle?`
      : `Assign Order #${selectedOrderId.slice(-6).toUpperCase()} to Vehicle ${vehicle.plateNumber}?`;

    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: warningMessage ? 'Proceed Anyway' : 'Assign',
          style: warningMessage ? 'destructive' : 'default',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await assignOrder(selectedOrderId, selectedVehicleId, vehicle.driverId!);
              Alert.alert('Success', 'Order has been dispatched successfully!');
              setSelectedOrderId(null);
              setSelectedVehicleId(null);
              loadData();
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

  const isLoading = ordersLoading || fleetLoading;

  return (
    <View className="flex-1 bg-slate-950">
      {/* Decorative premium gradient background */}
      <LinearGradient
        colors={['#e6fcf0', '#f1f5f9', '#ffffff']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 0.8 }}
      />
      {/* Soft blurred decorative glowing mint/emerald circles */}
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
        <Stack.Screen 
          options={{
            headerShown: false,
          }} 
        />

        <DispatchHeader
          onBack={() => router.back()}
          onRefresh={loadData}
          isLoading={isLoading}
        />

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <OrdersSection
            pendingOrders={pendingOrders}
            selectedOrderId={selectedOrderId}
            onSelectOrder={setSelectedOrderId}
          />

          <SmartDispatchBanner
            selectedOrderId={selectedOrderId}
            isSuggestLoading={isSuggestLoading}
            suggestedCount={partitionedVehicles.suggested.length}
          />

          <VehiclesSection
            availableVehiclesCount={availableVehicles.length}
            suggestedVehicles={partitionedVehicles.suggested}
            otherVehicles={partitionedVehicles.others}
            selectedVehicleId={selectedVehicleId}
            onSelectVehicle={setSelectedVehicleId}
          />
        </ScrollView>

        <ConfirmDispatchButton
          selectedOrderId={selectedOrderId}
          selectedVehicleId={selectedVehicleId}
          isSubmitting={isSubmitting}
          onConfirm={handleAssign}
        />
      </SafeAreaView>
    </View>
  );
}
