import React from 'react';
import { 
  View, 
  StatusBar,
  StyleSheet
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
    routeData,
    handleStatusUpdate,
    handleOrderStatusUpdate,
    handleProofOfDelivery,
    centerOnLocation,
    toggleMapType,
    openNavigation,
    zoomToDestination,
    fetchTrips,
    isFollowing,
    setIsFollowing,
    isNavMode,
    setIsNavMode,
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
        style={StyleSheet.absoluteFillObject}
        onPanDrag={() => {
          setIsFollowing(false);
          setIsNavMode(false);
        }}
        initialRegion={{
          latitude: location?.coords.latitude || 10.762622,
          longitude: location?.coords.longitude || 106.660172,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Render Planned Trip Route */}
        {activeTrip.plannedRoute && activeTrip.plannedRoute.length > 0 && (
          <PolylineComponent
            coordinates={activeTrip.plannedRoute}
            strokeColor="#6366f1"
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}

        {/* Render Live Dynamic Route (Google Maps style) */}
        {routeData && (
          <PolylineComponent
            coordinates={routeData.coordinates}
            strokeColor="#10b981"
            strokeWidth={6}
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
            rotation={location.coords.heading || 0}
            onPress={() => {
              setIsFollowing(true);
              setIsNavMode(!isNavMode);
            }}
          />
        )}

        {/* Order Markers */}
        {activeTrip.orders.map((order: any) => (
          <React.Fragment key={order.id}>
            {order.pickupLocation && (
              <MarkerComponent
                coordinate={order.pickupLocation}
                title={`Pickup: ${order.id.substring(0, 8)}`}
              />
            )}
            {order.deliveryLocation && (
              <MarkerComponent
                coordinate={order.deliveryLocation}
                title={`Delivery: ${order.id.substring(0, 8)}`}
              />
            )}
          </React.Fragment>
        ))}
      </MapComponent>

      <MissionDashboard 
        activeTrip={activeTrip} 
        currentOrder={currentOrder}
        routeData={routeData}
      />

      <MapControls 
        onCenter={centerOnLocation}
        onToggleType={toggleMapType}
        onZoomToDestination={zoomToDestination}
        mapType={mapType}
        isFollowing={isFollowing}
        isNavMode={isNavMode}
      />

      <MissionPanel 
        activeTrip={activeTrip}
        currentOrder={currentOrder}
        onUpdateTripStatus={handleStatusUpdate}
        onUpdateOrderStatus={handleOrderStatusUpdate}
        onProofOfDelivery={handleProofOfDelivery}
        onNavigate={openNavigation}
      />
    </View>
  );
}
