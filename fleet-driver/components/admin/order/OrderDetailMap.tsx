import React from 'react';
import { View, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { MapComponent, MarkerComponent, PolylineComponent, PROVIDER_GOOGLE } from '../../map/MapComponents';
import { Order, OrderStatus } from '../../../store/useOrderStore';
import { Clock3, Package, MapPin, CheckCircle2, AlertCircle, XCircle } from 'lucide-react-native';

const STATUS_CONFIG = {
  [OrderStatus.PENDING]: { label: 'Pending', color: '#f59e0b', icon: Clock3 },
  [OrderStatus.ASSIGNED]: { label: 'Assigned', color: '#6366f1', icon: Package },
  [OrderStatus.PICKED_UP]: { label: 'Picked Up', color: '#8b5cf6', icon: MapPin },
  [OrderStatus.DELIVERING]: { label: 'Delivering', color: '#0ea5e9', icon: MapPin },
  [OrderStatus.DELIVERED]: { label: 'Delivered', color: '#10b981', icon: CheckCircle2 },
  [OrderStatus.FAILED]: { label: 'Failed', color: '#ef4444', icon: AlertCircle },
  [OrderStatus.CANCELLED]: { label: 'Cancelled', color: '#94a3b8', icon: XCircle },
};

interface OrderDetailMapProps {
  order: Order;
}

export const OrderDetailMap: React.FC<OrderDetailMapProps> = ({ order }) => {
  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG[OrderStatus.PENDING];
  const StatusIcon = statusConfig.icon;

  const latDelta = Math.abs(order.pickupLocation.coordinates[1] - order.deliveryLocation.coordinates[1]) * 1.5 || 0.05;
  const lngDelta = Math.abs(order.pickupLocation.coordinates[0] - order.deliveryLocation.coordinates[0]) * 1.5 || 0.05;

  return (
    <View className="h-56 w-full overflow-hidden relative">
      <MapComponent
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: (order.pickupLocation.coordinates[1] + order.deliveryLocation.coordinates[1]) / 2,
          longitude: (order.pickupLocation.coordinates[0] + order.deliveryLocation.coordinates[0]) / 2,
          latitudeDelta: latDelta,
          longitudeDelta: lngDelta,
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
  );
};
