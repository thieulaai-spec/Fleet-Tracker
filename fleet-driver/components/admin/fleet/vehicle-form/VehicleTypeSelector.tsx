import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Truck } from 'lucide-react-native';
import { VehicleType } from '../../../../store/useFleetStore';

interface Props {
  type: VehicleType;
  setType: (type: VehicleType) => void;
}

export const VehicleTypeSelector = ({ type, setType }: Props) => (
  <View className="mb-6">
    <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">Vehicle Type</Text>
    <View className="flex-row gap-2 flex-wrap">
      {Object.values(VehicleType).map((t) => (
        <TouchableOpacity
          key={t}
          className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 border border-white/5 min-w-[100px] ${
            type === t ? 'bg-emerald-500 border-emerald-500' : ''
          }`}
          onPress={() => setType(t)}
        >
          <Truck size={20} color={type === t ? '#fff' : '#64748b'} />
          <Text className={`text-slate-400 font-bold text-[13px] capitalize ${
            type === t ? 'text-white' : ''
          }`}>
            {t}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);
