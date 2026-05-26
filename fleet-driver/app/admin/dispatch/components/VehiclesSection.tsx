import React from 'react';
import { View, Text } from 'react-native';
import { AlertCircle, Sparkles } from 'lucide-react-native';
import { Vehicle } from '../../../../store/useFleetStore';
import { VehicleDispatchItem } from '../../../../components/admin/dispatch/VehicleDispatchItem';

interface SuggestedVehicle {
  vehicle: Vehicle;
  distanceKm: number;
  rank: number;
  capacityWarning: boolean;
  licenseWarning: boolean;
}

interface OtherVehicle {
  vehicle: Vehicle;
  capacityWarning: boolean;
  licenseWarning: boolean;
}

interface VehiclesSectionProps {
  availableVehiclesCount: number;
  suggestedVehicles: SuggestedVehicle[];
  otherVehicles: OtherVehicle[];
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicleId: string | null) => void;
}

const VehiclesSection: React.FC<VehiclesSectionProps> = ({
  availableVehiclesCount,
  suggestedVehicles,
  otherVehicles,
  selectedVehicleId,
  onSelectVehicle,
}) => {
  return (
    <View className="pb-6">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-slate-50 font-bold text-lg">Available Fleet</Text>
        <View className="bg-emerald-500/20 px-2 py-0.5 rounded-full">
          <Text className="text-emerald-500 text-[10px] font-bold">{availableVehiclesCount}</Text>
        </View>
      </View>

      {availableVehiclesCount === 0 ? (
        <View className="bg-slate-900/50 rounded-3xl p-8 items-center border border-dashed border-slate-800">
          <AlertCircle size={32} color="#475569" />
          <Text className="text-slate-400 mt-2 text-center text-sm">No available vehicles with active drivers found.</Text>
        </View>
      ) : (
        <View>
          {/* Render Suggested Optimal Vehicles */}
          {suggestedVehicles.length > 0 && (
            <View className="mb-4">
              <View className="flex-row items-center mb-3">
                <Sparkles size={16} color="#f59e0b" />
                <Text className="text-amber-500 font-bold text-xs uppercase tracking-wider ml-2">Optimal Recommendations</Text>
              </View>
              {suggestedVehicles.map(({ vehicle, distanceKm, rank, capacityWarning, licenseWarning }) => (
                <VehicleDispatchItem
                  key={vehicle.id}
                  vehicle={vehicle}
                  isSelected={selectedVehicleId === vehicle.id}
                  onPress={() => onSelectVehicle(vehicle.id === selectedVehicleId ? null : vehicle.id)}
                  distanceKm={distanceKm}
                  rank={rank}
                  capacityWarning={capacityWarning}
                  licenseWarning={licenseWarning}
                />
              ))}
            </View>
          )}

          {/* Render Other Vehicles */}
          <View>
            {suggestedVehicles.length > 0 && (
              <Text className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-3 mt-2">Other Resources</Text>
            )}
            {otherVehicles.map(({ vehicle, capacityWarning, licenseWarning }) => (
              <VehicleDispatchItem
                key={vehicle.id}
                vehicle={vehicle}
                isSelected={selectedVehicleId === vehicle.id}
                onPress={() => onSelectVehicle(vehicle.id === selectedVehicleId ? null : vehicle.id)}
                capacityWarning={capacityWarning}
                licenseWarning={licenseWarning}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

export default VehiclesSection;
