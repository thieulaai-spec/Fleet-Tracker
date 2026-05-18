import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Truck, User, Gauge, ChevronRight, Sparkles } from 'lucide-react-native';
import { Vehicle } from '../../store/useFleetStore';

interface VehicleDispatchItemProps {
  vehicle: Vehicle;
  isSelected: boolean;
  onPress: () => void;
  distanceKm?: number;
  rank?: number;
}

export const VehicleDispatchItem: React.FC<VehicleDispatchItemProps> = ({ 
  vehicle, 
  isSelected, 
  onPress,
  distanceKm,
  rank
}) => {
  const driverName = vehicle.driver?.user?.fullName || 'No Driver Assigned';
  const capacityPercent = Math.round((vehicle.currentLoadKg / vehicle.maxCapacityKg) * 100);
  const isOptimal = rank === 0;

  // Premium design systems styling tokens
  const containerStyle = {
    backgroundColor: isSelected 
      ? 'rgba(16, 185, 129, 0.1)' 
      : isOptimal
        ? 'rgba(30, 41, 59, 0.8)'
        : 'rgba(30, 41, 59, 0.5)',
    borderColor: isSelected 
      ? 'rgba(16, 185, 129, 0.5)' 
      : isOptimal
        ? 'rgba(245, 158, 11, 0.3)'
        : 'rgba(255, 255, 255, 0.05)',
    shadowColor: isSelected 
      ? '#10b981' 
      : isOptimal
        ? '#f59e0b'
        : 'transparent',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isSelected || isOptimal ? 0.05 : 0,
    shadowRadius: 12,
    elevation: isSelected || isOptimal ? 2 : 0,
  };

  const iconBgStyle = {
    backgroundColor: isSelected 
      ? '#10b981' 
      : isOptimal 
        ? 'rgba(245, 158, 11, 0.2)' 
        : '#334155', // slate-700
    borderColor: isOptimal ? 'rgba(245, 158, 11, 0.3)' : 'transparent',
    borderWidth: isOptimal ? 1 : 0,
  };

  const iconColor = isSelected 
    ? '#fff' 
    : isOptimal 
      ? '#f59e0b' 
      : '#94a3b8';

  return (
    <TouchableOpacity 
      onPress={onPress}
      className="p-4 mb-3 rounded-2xl border"
      style={containerStyle}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row items-center flex-1 mr-2">
          <View 
            className="w-10 h-10 rounded-xl justify-center items-center mr-3"
            style={iconBgStyle}
          >
            <Truck size={20} color={iconColor} />
          </View>
          <View className="flex-1">
            <Text className="text-slate-50 font-bold text-sm" numberOfLines={1}>{vehicle.plateNumber}</Text>
            <Text className="text-slate-400 text-[11px] uppercase" numberOfLines={1}>{vehicle.type} Truck</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-1.5 flex-wrap justify-end max-w-[50%]">
          {isOptimal && (
            <View 
              className="px-2 py-0.5 rounded-md border flex-row items-center gap-1"
              style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }}
            >
              <Sparkles size={10} color="#f59e0b" />
              <Text className="text-amber-500 text-[9px] font-bold uppercase tracking-wider">Optimal</Text>
            </View>
          )}
          {distanceKm !== undefined && (
            <View 
              className="px-2 py-0.5 rounded-md border"
              style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.2)' }}
            >
              <Text className="text-indigo-400 text-[9px] font-bold uppercase">{distanceKm.toFixed(1)} km</Text>
            </View>
          )}
          <View 
            className="px-2 py-0.5 rounded-md"
            style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
          >
            <Text className="text-emerald-500 text-[9px] font-bold uppercase">Available</Text>
          </View>
        </View>
      </View>

      <View className="flex-row items-center mb-3">
        <User size={14} color="#94a3b8" />
        <Text className="text-slate-300 text-xs ml-2 font-medium">
          {driverName}
        </Text>
      </View>

      <View className="space-y-1.5">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Gauge size={14} color="#94a3b8" />
            <Text className="text-slate-400 text-[11px] ml-1.5">Current Load</Text>
          </View>
          <Text className="text-slate-200 text-[11px] font-bold">{capacityPercent}%</Text>
        </View>
        <View className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <View 
            className={`h-full rounded-full ${capacityPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${capacityPercent}%` }}
          />
        </View>
      </View>

      {isSelected && (
        <View 
          className="mt-3 pt-3 border-t flex-row justify-end items-center"
          style={{ borderTopColor: 'rgba(16, 185, 129, 0.2)' }}
        >
          <Text className="text-emerald-400 text-[11px] font-bold mr-1">Ready to Assign</Text>
          <ChevronRight size={14} color="#10b981" />
        </View>
      )}
    </TouchableOpacity>
  );
};
