import React from 'react';
import { 
  View, 
  StatusBar,
  StyleSheet
} from 'react-native';
import { MapPin, Calendar, Clock, ChevronLeft, Package, Truck, CheckCircle2, AlertTriangle, Navigation, Camera, Fuel, Route } from 'lucide-react-native';
import { useTripStore, TripStatus } from '../../store/useTripStore';
import { MapComponent, MarkerComponent, PolylineComponent, PROVIDER_GOOGLE } from '../../components/map/MapComponents';

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
            onPress={() => {
              setIsFollowing(true);
              setIsNavMode(!isNavMode);
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View
              className="w-9 h-9 rounded-full border-[3px] border-white items-center justify-center shadow-lg shadow-black/30"
              style={{
                backgroundColor: activeTrip?.status === TripStatus.IN_PROGRESS ? '#6366f1' : '#10b981',
                transform: [{ rotate: `${(location.coords.heading || 0) - 90}deg` }],
              }}
            >
              <Truck size={16} color="#fff" strokeWidth={3} />
            </View>
          </MarkerComponent>
        )}

        {/* Order Markers */}
        {activeTrip.orders.map((order: any) => (
          <React.Fragment key={order.id}>
            {order.pickupLocation && (
              <MarkerComponent
                coordinate={order.pickupLocation}
                title={`Pickup: ${order.id.substring(0, 8)}`}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View 
                  className="w-8 h-8 rounded-full border-2 border-white items-center justify-center shadow shadow-black/25"
                  style={{ backgroundColor: '#6366f1' }}
                >
                  <MapPin size={16} color="#fff" strokeWidth={3} />
                </View>
              </MarkerComponent>
            )}
            {order.deliveryLocation && (
              <MarkerComponent
                coordinate={order.deliveryLocation}
                title={`Delivery: ${order.id.substring(0, 8)}`}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View 
                  className="w-8 h-8 rounded-full border-2 border-white items-center justify-center shadow shadow-black/25"
                  style={{ backgroundColor: '#10b981' }}
                >
                  <MapPin size={16} color="#fff" strokeWidth={3} />
                </View>
              </MarkerComponent>
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



