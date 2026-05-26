import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Settings2, Scale, Cpu } from 'lucide-react-native';

interface Props {
  formData: any;
  setFormData: any;
}

export const VehicleBasicInfo = ({ formData, setFormData }: Props) => (
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

    <View className="flex-row items-center bg-slate-800 rounded-2xl border border-white/5 px-4 mb-3 h-14">
      <Cpu size={20} color="#64748b" style={{ marginRight: 12 }} />
      <TextInput
        className="flex-1 color-slate-50 text-base"
        placeholder="Device ID (Hardware GPS)"
        placeholderTextColor="#64748b"
        autoCapitalize="none"
        value={formData.deviceId}
        onChangeText={(text) => setFormData({ ...formData, deviceId: text })}
      />
    </View>
  </View>
);
