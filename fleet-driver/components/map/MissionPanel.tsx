import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MapPin, Navigation, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Trip, TripStatus, OrderStatus } from '@/types/trip';
import { SosButton } from '../ui/SosButton';
import { calculateDistance } from '../../utils/geo';
import { ActionButton } from './mission-panel/ActionButton';
import { OrderDetailsSection } from './mission-panel/OrderDetailsSection';

interface MissionPanelProps {
  activeTrip: Trip;
  currentOrder: any;
  progressPercent?: number;
  location?: any;
  onNavigate: () => void;
  onUpdateTripStatus: (status: TripStatus) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onProofOfDelivery?: () => void;
  onCheckpoint?: () => void;
  selectedOrderId?: string | null;
  onSelectOrder?: (orderId: string) => void;
}

export const MissionPanel: React.FC<MissionPanelProps> = ({
  activeTrip,
  currentOrder,
  progressPercent = 0,
  location,
  onNavigate,
  onUpdateTripStatus,
  onUpdateOrderStatus,
  onProofOfDelivery,
  onCheckpoint,
  selectedOrderId,
  onSelectOrder
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const pickupDistance = React.useMemo(() => {
    if (!location || !currentOrder?.pickupLocation) return null;
    return calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      currentOrder.pickupLocation.latitude,
      currentOrder.pickupLocation.longitude
    );
  }, [location, currentOrder?.pickupLocation]);

  const isWithinPickupRange = pickupDistance !== null && pickupDistance < 200;

  const deliveryDistance = React.useMemo(() => {
    if (!location || !currentOrder?.deliveryLocation) return null;
    return calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      currentOrder.deliveryLocation.latitude,
      currentOrder.deliveryLocation.longitude
    );
  }, [location, currentOrder?.deliveryLocation]);

  const isWithinDeliveryRange = deliveryDistance !== null && deliveryDistance < 200;

  return (
    <View className="absolute bottom-32 left-4 right-4">
      <BlurView 
        intensity={95} 
        tint="light" 
        className="rounded-[24px] border border-slate-700/50 shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.96)' }}
      >
        <View className="p-4">
          <View className={`flex-row items-center pt-1.5 ${isCollapsed ? 'mb-0' : 'mb-5'}`}>
            <TouchableOpacity 
              onPress={() => setIsCollapsed(!isCollapsed)}
              activeOpacity={0.85}
              className="flex-row items-center flex-1 mr-2"
            >
              <View className="shadow-2xl">
                <LinearGradient
                  colors={currentOrder ? ['#10b981', '#059669'] : ['#334155', '#1e293b']}
                  style={{ width: 48, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}
                >
                  <MapPin size={24} color="#fff" strokeWidth={2.5} />
                </LinearGradient>
              </View>
              <View className="flex-1 min-w-0 ml-4">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-indigo-400 text-[9px] font-black uppercase tracking-[2px]">
                    {currentOrder?.status === OrderStatus.PICKED_UP || currentOrder?.status === OrderStatus.DELIVERING ? 'Delivery Point' : 'Pickup Point'}
                  </Text>
                  {currentOrder && (currentOrder.category === 'fragile' || currentOrder.category === 'dangerous' || currentOrder.priority === 'high') && (
                    <View className={`px-2 py-0.5 rounded-md flex-row items-center gap-1 ${
                      currentOrder.category === 'fragile' 
                        ? 'bg-amber-500/10 border border-amber-500/20' 
                        : 'bg-rose-500/10 border border-rose-500/20'
                    }`}>
                      <AlertTriangle size={10} color={
                        currentOrder.category === 'fragile' ? '#f59e0b' : '#ef4444'
                      } />
                      <Text className={`text-[8px] font-black uppercase ${
                        currentOrder.category === 'fragile' ? 'text-amber-500' : 'text-rose-500'
                      }`}>
                        {currentOrder.category === 'fragile' 
                          ? 'Dễ vỡ' 
                          : currentOrder.category === 'dangerous' 
                            ? 'Nguy hiểm' 
                            : 'Ưu tiên cao'}
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-white text-lg font-black tracking-tight" numberOfLines={1} ellipsizeMode="tail">
                  {currentOrder
                    ? (currentOrder.status === OrderStatus.PICKED_UP || currentOrder.status === OrderStatus.DELIVERING
                      ? currentOrder.address
                      : currentOrder.pickupAddress)
                    : 'Mission Accomplished'}
                </Text>
                
                <OrderDetailsSection
                  activeTrip={activeTrip}
                  currentOrder={currentOrder}
                  isCollapsed={isCollapsed}
                  onSelectOrder={onSelectOrder}
                />
              </View>
            </TouchableOpacity>

            <View className="flex-row gap-1.5 items-center">
              <TouchableOpacity
                className="bg-white/5 w-10 h-10 rounded-[12px] justify-center items-center border border-white/10"
                onPress={onNavigate}
                activeOpacity={0.7}
              >
                <Navigation size={18} color="#fff" strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity
                className="w-8 h-10 justify-center items-center"
                onPress={() => setIsCollapsed(!isCollapsed)}
                activeOpacity={0.7}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                {isCollapsed ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Tactical Actions */}
          {!isCollapsed && (
            <View className="flex-row gap-2.5 items-center">
              <View className="flex-1 w-full">
                <ActionButton
                  activeTrip={activeTrip}
                  currentOrder={currentOrder}
                  pickupDistance={pickupDistance}
                  deliveryDistance={deliveryDistance}
                  isWithinPickupRange={isWithinPickupRange}
                  isWithinDeliveryRange={isWithinDeliveryRange}
                  onUpdateTripStatus={onUpdateTripStatus}
                  onUpdateOrderStatus={onUpdateOrderStatus}
                  onProofOfDelivery={onProofOfDelivery}
                />
              </View>

              <View className="flex-1 w-full">
                <SosButton tripId={activeTrip.id} />
              </View>
            </View>
          )}
        </View>
      </BlurView>
    </View>
  );
};
