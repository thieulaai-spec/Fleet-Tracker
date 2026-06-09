import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MapPin, Map as MapIcon, ChevronRight } from 'lucide-react-native';

interface LocationSectionProps {
  type: 'pickup' | 'delivery';
  address: string;
  locationCoordinates: number[] | null;
  errors: Record<string, string>;
  onSetPickingLocation: (type: 'pickup' | 'delivery') => void;
}

export const LocationSection: React.FC<LocationSectionProps> = ({
  type,
  address,
  locationCoordinates,
  errors,
  onSetPickingLocation,
}) => {
  const isPickup = type === 'pickup';
  const addressError = isPickup ? errors.pickupAddress : errors.deliveryAddress;
  const locationError = isPickup ? errors.pickupLocation : errors.deliveryLocation;
  
  return (
    <View className="bg-slate-900 rounded-3xl p-5 border border-slate-700/50 gap-4">
      <View className="flex-row items-center gap-2.5 mb-1">
        <MapPin size={20} color={isPickup ? "#f59e0b" : "#10b981"} />
        <Text className="text-lg font-bold text-slate-50">
          {isPickup ? 'Pickup Details' : 'Delivery Details'}
        </Text>
      </View>
      
      <View className="gap-2">
        <Text className="text-sm font-semibold text-slate-400 ml-1">Address</Text>
        {address ? (
          <View className={`bg-slate-800 rounded-2xl p-4 border border-slate-700/50 gap-1.5 ${(addressError || locationError) ? 'border-red-500' : ''}`}>
            <Text className="text-[15px] font-semibold text-slate-50 leading-5" numberOfLines={2}>
              {address}
            </Text>
            {locationCoordinates && (
              <Text className="text-xs text-slate-400 font-medium">
                Coords: {locationCoordinates[1].toFixed(6)}, {locationCoordinates[0].toFixed(6)}
              </Text>
            )}
          </View>
        ) : (
          <View className={`bg-slate-800 rounded-2xl p-4 border gap-1.5 border-dashed border-slate-700 ${(addressError || locationError) ? 'border-red-500' : ''}`}>
            <Text className="text-sm text-slate-500 italic">
              No {isPickup ? 'pickup' : 'delivery'} location selected. Please select a location on the map.
            </Text>
          </View>
        )}
        {!!addressError && <Text className="text-red-500 text-xs font-semibold ml-1">{addressError}</Text>}
      </View>

      <TouchableOpacity 
        className={`flex-row items-center bg-slate-800 rounded-2xl h-[52px] px-4 gap-3 border border-slate-700/50 ${locationError ? 'border-red-500' : ''}`}
        onPress={() => onSetPickingLocation(type)}
      >
        <MapIcon size={20} color={locationCoordinates ? '#10b981' : '#64748b'} />
        <Text className={`flex-1 text-slate-500 text-[15px] font-semibold ${locationCoordinates ? 'text-indigo-500' : ''}`}>
          {locationCoordinates ? `${isPickup ? 'Pickup' : 'Delivery'} Location Set` : `Set ${isPickup ? 'Pickup' : 'Delivery'} on Map`}
        </Text>
        <ChevronRight size={20} color="#475569" />
      </TouchableOpacity>
    </View>
  );
};
