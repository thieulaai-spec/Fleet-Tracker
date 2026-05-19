import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Truck, Scale, Settings2, User as UserIcon } from 'lucide-react-native';
import { Vehicle, VehicleStatus, VehicleType, useFleetStore } from '../../store/useFleetStore';

interface VehicleFormProps {
  initialData?: Vehicle;
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({ initialData, onSubmit, loading }) => {
  const { drivers } = useFleetStore();
  const [formData, setFormData] = useState({
    plateNumber: initialData?.plateNumber || '',
    type: initialData?.type || VehicleType.MEDIUM,
    maxCapacityKg: initialData?.maxCapacityKg?.toString() || '3000',
    status: initialData?.status || VehicleStatus.AVAILABLE,
    driverId: initialData?.driverId || '',
  });

  const handleSubmit = () => {
    onSubmit({
      ...formData,
      maxCapacityKg: parseInt(formData.maxCapacityKg),
      driverId: formData.driverId || null,
    });
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View className="mb-6">
          <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">Basic Info</Text>
          
          <View className="flex-row items-center bg-slate-800 rounded-2xl border border-white/5 px-4 mb-3 h-14">
            <Settings2 size={20} color="#64748b" style={{ marginRight: 12 }} />
            <TextInput
              className="flex-1 color-slate-50 text-base"
              placeholder="Plate Number"
              placeholderTextColor="#64748b"
              autoCapitalize="characters"
              value={formData.plateNumber}
              onChangeText={(text) => setFormData({ ...formData, plateNumber: text })}
            />
          </View>

          <View className="flex-row items-center bg-slate-800 rounded-2xl border border-white/5 px-4 mb-3 h-14">
            <Scale size={20} color="#64748b" style={{ marginRight: 12 }} />
            <TextInput
              className="flex-1 color-slate-50 text-base"
              placeholder="Max Capacity (kg)"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={formData.maxCapacityKg}
              onChangeText={(text) => setFormData({ ...formData, maxCapacityKg: text })}
            />
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">Vehicle Type</Text>
          <View className="flex-row gap-2 flex-wrap">
            {Object.values(VehicleType).map((type) => (
              <TouchableOpacity
                key={type}
                className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 border border-white/5 min-w-[100px] ${
                  formData.type === type ? 'bg-emerald-500 border-emerald-500' : ''
                }`}
                onPress={() => setFormData({ ...formData, type })}
              >
                <Truck size={20} color={formData.type === type ? '#fff' : '#64748b'} />
                <Text className={`text-slate-400 font-bold text-[13px] capitalize ${
                  formData.type === type ? 'text-white' : ''
                }`}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">Status</Text>
          <View className="flex-row gap-2 flex-wrap">
            {Object.values(VehicleStatus).map((status) => (
              <TouchableOpacity
                key={status}
                className={`px-4 py-2.5 rounded-xl bg-slate-800 border border-white/5 ${
                  formData.status === status ? 'bg-indigo-500 border-indigo-500' : ''
                }`}
                onPress={() => setFormData({ ...formData, status })}
              >
                <Text className={`text-slate-400 font-bold text-[13px] capitalize ${
                  formData.status === status ? 'text-white' : ''
                }`}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">Assign Driver</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            <TouchableOpacity
              className={`flex-row items-center bg-slate-800 px-3.5 py-2 rounded-full mr-2 border border-white/5 gap-1.5 ${
                formData.driverId === '' ? 'bg-indigo-500 border-indigo-500' : ''
              }`}
              onPress={() => setFormData({ ...formData, driverId: '' })}
            >
              <Text className={`text-slate-400 text-[13px] font-semibold ${
                formData.driverId === '' ? 'text-white' : ''
              }`}>Unassigned</Text>
            </TouchableOpacity>
            
            {drivers.map((driver) => (
              <TouchableOpacity
                key={driver.id}
                className={`flex-row items-center bg-slate-800 px-3.5 py-2 rounded-full mr-2 border border-white/5 gap-1.5 ${
                  formData.driverId === driver.id ? 'bg-indigo-500 border-indigo-500' : ''
                }`}
                onPress={() => setFormData({ ...formData, driverId: driver.id })}
              >
                <UserIcon size={14} color={formData.driverId === driver.id ? '#fff' : '#64748b'} />
                <Text className={`text-slate-400 text-[13px] font-semibold ${
                  formData.driverId === driver.id ? 'text-white' : ''
                }`}>
                  {driver.user.fullName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity 
          className="bg-indigo-500 h-14 rounded-2xl justify-center items-center mt-3"
          style={{
            shadowColor: '#6366f1',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4
          }}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-bold">
              {initialData ? 'Update Vehicle' : 'Create Vehicle'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

