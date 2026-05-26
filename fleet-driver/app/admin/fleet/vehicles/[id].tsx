import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Truck,
  Scale,
  User as UserIcon,
  Box,
  Cpu
} from 'lucide-react-native';
import { useFleetStore, Vehicle, VehicleStatus, VehicleType } from '../../../../store/useFleetStore';
import { VehicleForm } from '../../../../components/admin/fleet/VehicleForm';

const STATUS_CONFIG = {
  [VehicleStatus.AVAILABLE]: { label: 'Available', color: '#10b981' },
  [VehicleStatus.DELIVERING]: { label: 'Delivering', color: '#6366f1' },
  [VehicleStatus.MAINTENANCE]: { label: 'Maintenance', color: '#ef4444' },
};

const TYPE_LABELS = {
  [VehicleType.SMALL]: 'Small Van',
  [VehicleType.MEDIUM]: 'Box Truck',
  [VehicleType.LARGE]: 'Semi Truck',
};

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { vehicles, loading, updateVehicle, deleteVehicle, createVehicle } = useFleetStore();
  
  const [vehicle, setVehicle] = useState<Vehicle | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(id === 'create');

  useEffect(() => {
    if (id && id !== 'create') {
      const found = vehicles.find(v => v.id === id);
      setVehicle(found);
    }
  }, [id, vehicles]);

  const handleDelete = () => {
    Alert.alert(
      "Delete Vehicle",
      "Are you sure you want to remove this vehicle from the fleet?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteVehicle(id as string);
              router.back();
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          }
        }
      ]
    );
  };

  const handleSubmit = async (data: any) => {
    try {
      if (id === 'create') {
        await createVehicle(data);
        Alert.alert("Success", "Vehicle created successfully");
      } else {
        await updateVehicle(id as string, data);
        Alert.alert("Success", "Vehicle updated successfully");
        setIsEditing(false);
      }
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  if (loading && !vehicle && id !== 'create') {
    return (
      <SafeAreaView className="flex-1 bg-slate-950">
        <View className="flex-1 justify-center items-center gap-4">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="text-slate-400 text-base">Loading vehicle info...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!vehicle && id !== 'create') {
    return (
      <SafeAreaView className="flex-1 bg-slate-950">
        <View className="flex-1 justify-center items-center gap-4">
          <Text className="text-red-500 text-lg font-bold">Vehicle not found</Text>
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white/5 justify-center items-center">
            <Text className="text-indigo-500">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const status = vehicle ? (STATUS_CONFIG[vehicle.status] || STATUS_CONFIG[VehicleStatus.AVAILABLE]) : null;

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center px-4 py-3 gap-4">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white/5 justify-center items-center">
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="flex-1 text-xl font-extrabold text-white">{id === 'create' ? 'New Vehicle' : 'Vehicle Detail'}</Text>
        {id !== 'create' && (
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)} className="w-10 h-10 rounded-full bg-white/5 justify-center items-center">
              <Edit3 size={20} color={isEditing ? '#10b981' : '#6366f1'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} className="w-10 h-10 rounded-full bg-white/5 justify-center items-center">
              <Trash2 size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isEditing ? (
        <VehicleForm 
          initialData={vehicle}
          onSubmit={handleSubmit}
          loading={loading}
        />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {vehicle?.imageUrl ? (
            <View className="w-full h-72 bg-slate-800 rounded-b-[40px] overflow-hidden mb-6 border-b border-white/5">
              <Image 
                source={{ uri: vehicle.imageUrl }} 
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-black/50 justify-end items-center pb-8 pt-20">
                <Text className="text-4xl font-black text-white mb-3 tracking-wider" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }}>
                  {vehicle?.plateNumber}
                </Text>
                {status && (
                  <View 
                    className="flex-row items-center px-4 py-2 rounded-2xl gap-2"
                    style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
                  >
                    <View className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: status.color, shadowColor: status.color, shadowOpacity: 0.8, shadowRadius: 4 }} />
                    <Text className="text-sm font-extrabold uppercase tracking-wide text-white">{status.label}</Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View className="items-center py-10 bg-slate-800 rounded-b-[40px] border-b border-white/5 mb-6">
              <View className="w-28 h-28 rounded-full bg-emerald-500/10 justify-center items-center mb-5 border border-emerald-500/20">
                <Truck size={48} color="#10b981" />
              </View>
              <Text className="text-3xl font-black text-slate-50 mb-3 tracking-wider">{vehicle?.plateNumber}</Text>
              {status && (
                <View 
                  className="flex-row items-center px-4 py-2 rounded-2xl gap-2"
                  style={{ backgroundColor: `${status.color}15`, borderWidth: 1, borderColor: `${status.color}30` }}
                >
                  <View className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                  <Text className="text-xs font-extrabold uppercase tracking-wide" style={{ color: status.color }}>{status.label}</Text>
                </View>
              )}
            </View>
          )}

          <View className="p-5 gap-5">
            <View className="bg-slate-800 rounded-[24px] p-5 border border-white/10">
              <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-5">Specifications</Text>
              
              <View className="flex-row items-center gap-4 mb-5">
                <Box size={20} color="#64748b" />
                <View>
                  <Text className="text-xs text-slate-500 font-semibold">Type</Text>
                  <Text className="text-base text-slate-50 font-bold">{vehicle ? TYPE_LABELS[vehicle.type] : 'N/A'}</Text>
                </View>
              </View>

              <View className="flex-row items-center gap-4 mb-5">
                <Scale size={20} color="#64748b" />
                <View>
                  <Text className="text-xs text-slate-500 font-semibold">Max Capacity</Text>
                  <Text className="text-base text-slate-50 font-bold">{vehicle?.maxCapacityKg} kg</Text>
                </View>
              </View>

              <View className="flex-row items-center gap-4">
                <Cpu size={20} color="#64748b" />
                <View>
                  <Text className="text-xs text-slate-500 font-semibold">Hardware GPS Device ID</Text>
                  <Text className="text-base text-slate-50 font-bold">{vehicle?.deviceId || 'No Device Linked'}</Text>
                </View>
              </View>
            </View>

            <View className="bg-slate-800 rounded-[24px] p-5 border border-white/10">
              <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-5">Assigned Driver</Text>
              
              <View className="flex-row items-center gap-4 mb-5">
                <UserIcon size={20} color="#64748b" />
                <View>
                  <Text className="text-xs text-slate-500 font-semibold">Driver Name</Text>
                  <Text className="text-base text-slate-50 font-bold">{vehicle?.driver?.user.fullName || 'Unassigned'}</Text>
                </View>
              </View>

              {vehicle?.driver && (
                <TouchableOpacity 
                  className="bg-indigo-500/10 py-3 rounded-xl items-center mt-2"
                  onPress={() => router.push(`/admin/fleet/drivers/${vehicle.driverId}` as any)}
                >
                  <Text className="text-indigo-500 font-bold text-sm">View Driver Profile</Text>
                </TouchableOpacity>
              )}
            </View>

            <View className="bg-slate-800 rounded-[24px] p-5 border border-white/10">
              <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-5">Vehicle Health</Text>
              <View className="flex-row gap-3">
                <View className="flex-1 bg-white/5 p-4 rounded-2xl items-center">
                  <Text className="text-lg font-extrabold text-emerald-500">Good</Text>
                  <Text className="text-[11px] text-slate-500 font-bold mt-1">Condition</Text>
                </View>
                <View className="flex-1 bg-white/5 p-4 rounded-2xl items-center">
                  <Text className="text-lg font-extrabold text-emerald-500">85%</Text>
                  <Text className="text-[11px] text-slate-500 font-bold mt-1">Fuel</Text>
                </View>
                <View className="flex-1 bg-white/5 p-4 rounded-2xl items-center">
                  <Text className="text-lg font-extrabold text-emerald-500">1.2k</Text>
                  <Text className="text-[11px] text-slate-500 font-bold mt-1">KM this month</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
