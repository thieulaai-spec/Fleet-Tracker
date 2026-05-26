import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { User as UserIcon } from 'lucide-react-native';

interface Props {
  drivers: any[];
  selectedDriverId: string;
  setDriverId: (id: string) => void;
}

export const DriverAssigner = ({ drivers, selectedDriverId, setDriverId }: Props) => (
  <View className="mb-6">
    <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">Assign Driver</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
      <TouchableOpacity
        className={`flex-row items-center bg-slate-800 px-3.5 py-2 rounded-full mr-2 border border-white/5 gap-1.5 ${
          selectedDriverId === '' ? 'bg-indigo-500 border-indigo-500' : ''
        }`}
        onPress={() => setDriverId('')}
      >
        <Text className={`text-slate-400 text-[13px] font-semibold ${
          selectedDriverId === '' ? 'text-white' : ''
        }`}>Unassigned</Text>
      </TouchableOpacity>
      
      {drivers.map((driver) => (
        <TouchableOpacity
          key={driver.id}
          className={`flex-row items-center bg-slate-800 px-3.5 py-2 rounded-full mr-2 border border-white/5 gap-1.5 ${
            selectedDriverId === driver.id ? 'bg-indigo-500 border-indigo-500' : ''
          }`}
          onPress={() => setDriverId(driver.id)}
        >
          <UserIcon size={14} color={selectedDriverId === driver.id ? '#fff' : '#64748b'} />
          <Text className={`text-slate-400 text-[13px] font-semibold ${
            selectedDriverId === driver.id ? 'text-white' : ''
          }`}>
            {driver.user.fullName}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);
