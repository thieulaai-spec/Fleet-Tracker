import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Truck } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { getStatusColor } from './trackingUtils';

interface TrackingHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching: boolean;
  setIsSearching: (isSearching: boolean) => void;
  vehicleList: any[];
  filteredVehicles: any[];
  onSelectVehicle: (id: string) => void;
}

export const TrackingHeader: React.FC<TrackingHeaderProps> = ({
  searchQuery,
  setSearchQuery,
  isSearching,
  setIsSearching,
  vehicleList,
  filteredVehicles,
  onSelectVehicle,
}) => {
  return (
    <SafeAreaView className="absolute inset-0 p-4" pointerEvents="box-none">
      <BlurView intensity={80} tint="dark" className="p-4 rounded-[20px] overflow-hidden border border-white/10">
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center gap-2">
            <View className="w-2 h-2 rounded-full bg-red-500" />
            <Text className="text-white text-lg font-extrabold tracking-wider">Fleet Live</Text>
          </View>
          <Text className="text-slate-400 text-xs mt-0.5">
            {vehicleList.length} active vehicles
          </Text>
        </View>

        <View className="flex-row items-center bg-white/8 rounded-xl px-3 h-10 border border-white/5">
          <Search size={18} color="#94a3b8" className="mr-2" />
          <TextInput
            className="flex-1 text-white text-sm py-0"
            placeholder="Search plate or driver..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setIsSearching(true);
            }}
            onFocus={() => setIsSearching(true)}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {isSearching && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              setIsSearching(false);
              Keyboard.dismiss();
            }}>
              <Text className="text-indigo-500 text-xs font-semibold ml-2">
                {searchQuery.length > 0 ? 'Clear' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </BlurView>

      {/* Search Results Dropdown */}
      {isSearching && (
        <BlurView intensity={95} tint="dark" className="mt-2 rounded-2xl overflow-hidden border border-white/10 shadow-lg shadow-black/30 z-[999]">
          <FlatList
            data={filteredVehicles}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            className="max-h-[220px]"
            renderItem={({ item }) => (
              <TouchableOpacity
                className="flex-row justify-between items-center py-3 px-4 border-b border-white/5"
                onPress={() => {
                  onSelectVehicle(item.id);
                  setSearchQuery('');
                  setIsSearching(false);
                  Keyboard.dismiss();
                }}
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <Truck size={18} color={getStatusColor(item.status)} />
                  <View className="flex-1">
                    <Text className="text-white text-sm font-bold">{item.licensePlate}</Text>
                    <Text className="text-slate-400 text-xs mt-0.5">{item.driverName}</Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getStatusColor(item.status) }} />
                  <Text className="text-[10px] font-bold" style={{ color: getStatusColor(item.status) }}>
                    {item.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View className="p-5 items-center">
                <Text className="text-slate-500 text-sm">No vehicles match search</Text>
              </View>
            }
          />
        </BlurView>
      )}
    </SafeAreaView>
  );
};
