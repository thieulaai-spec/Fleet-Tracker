import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Keyboard,
  Image,
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
      <BlurView intensity={90} tint="light" className="p-4 rounded-[20px] overflow-hidden border border-slate-700" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center gap-2">
            <View className="w-2 h-2 rounded-full bg-red-500" />
            <Text className="text-white text-lg font-extrabold tracking-wider">Fleet Live</Text>
          </View>
          <Text className="text-slate-400 text-xs mt-0.5">
            {vehicleList.length} active vehicles
          </Text>
        </View>

        <View className="flex-row items-center bg-slate-800 rounded-xl px-3 h-10 border border-slate-700">
          <Search size={18} color="#64748b" className="mr-2" />
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
              <Text className="text-indigo-600 text-xs font-semibold ml-2">
                {searchQuery.length > 0 ? 'Clear' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </BlurView>

      {/* Search Results Dropdown */}
      {isSearching && (
        <BlurView intensity={95} tint="light" className="mt-2 rounded-2xl overflow-hidden border border-slate-700 shadow-lg shadow-black/5 z-[999]" style={{ backgroundColor: 'rgba(255, 255, 255, 0.98)' }}>
          <FlatList
            data={filteredVehicles}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            className="max-h-[220px]"
            renderItem={({ item }) => (
              <TouchableOpacity
                className="flex-row justify-between items-center py-3 px-4 border-b border-slate-700"
                onPress={() => {
                  onSelectVehicle(item.id);
                  setSearchQuery('');
                  setIsSearching(false);
                  Keyboard.dismiss();
                }}
              >
                <View className="flex-row items-center gap-3 flex-1">
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700" resizeMode="cover" />
                  ) : (
                    <View className="w-8 h-8 rounded-lg bg-emerald-500/10 justify-center items-center">
                      <Truck size={18} color={getStatusColor(item.status)} />
                    </View>
                  )}
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
