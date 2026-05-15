import React from 'react';
import { 
  View, 
  StatusBar
} from 'react-native';
import { MapComponent, MarkerComponent, PolylineComponent, PROVIDER_GOOGLE } from '../../components/map/MapComponents';
import { TripStatus } from '../../store/useTripStore';

import { NoActiveTrip } from '../../components/trip/NoActiveTrip';
import { MissionDashboard } from '../../components/map/MissionDashboard';
import { MapControls } from '../../components/map/MapControls';
import { MissionPanel } from '../../components/map/MissionPanel';
import { useMapFlow } from '../../hooks/map/useMapFlow';

export default function ActiveTripMap() {
  const {
    activeTrip,
    location,
    mapType,
    mapRef,
    currentOrder,
    handleStatusUpdate,
    handleOrderStatusUpdate,
    centerOnLocation,
    toggleMapType,
    openNavigation,
    fetchTrips,
  } = useMapFlow();

  if (!activeTrip) {
    return <NoActiveTrip onRefresh={fetchTrips} />;
  }

  return (
    <View className="flex-1 bg-slate-950">
      <StatusBar barStyle="light-content" />
      
      <MapComponent
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        mapType={mapType}
        initialRegion={{
          latitude: location?.coords.latitude || 10.762622,
          longitude: location?.coords.longitude || 106.660172,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Render Planned Route */}
        {activeTrip.plannedRoute && activeTrip.plannedRoute.length > 0 && (
          <PolylineComponent
            coordinates={activeTrip.plannedRoute}
            strokeColor="#6366f1"
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}

        {/* Current Location Marker */}
        {location && (
          <MarkerComponent
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Your Location"
            isTruck={true}
            rotation={location.coords.heading || 0}
          />
        )}

        {/* Order Markers */}
        {activeTrip.orders.map((order) => (
          <React.Fragment key={order.id}>
            <MarkerComponent
              coordinate={order.pickupLocation}
              title={`Pickup: ${order.id.substring(0, 8)}`}
              type="pickup"
              status={order.status}
            />
            <MarkerComponent
              coordinate={order.deliveryLocation}
              title={`Delivery: ${order.id.substring(0, 8)}`}
              type="delivery"
              status={order.status}
            />
          </React.Fragment>
        ))}
      </MapComponent>

      <MissionDashboard 
        activeTrip={activeTrip} 
        currentOrder={currentOrder}
      />

      <MapControls 
        onCenter={centerOnLocation}
        onToggleType={toggleMapType}
        mapType={mapType}
      />

      <MissionPanel 
        activeTrip={activeTrip}
        currentOrder={currentOrder}
        onUpdateTripStatus={handleStatusUpdate}
        onUpdateOrderStatus={handleOrderStatusUpdate}
        onNavigate={openNavigation}
      />
    </View>
  );
}
