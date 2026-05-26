import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { VehicleStatus } from '../../../../store/useFleetStore';

interface Props {
  status: VehicleStatus;
  setStatus: (status: VehicleStatus) => void;
}

export const VehicleStatusSelector = ({ status, setStatus }: Props) => (
  <View className="mb-6">
    <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">Status</Text>
    <View className="flex-row gap-2 flex-wrap">
      {Object.values(VehicleStatus).map((s) => (
        <TouchableOpacity
          key={s}
          className={`px-4 py-2.5 rounded-xl bg-slate-800 border border-white/5 ${
            status === s ? 'bg-indigo-500 border-indigo-500' : ''
          }`}
          onPress={() => setStatus(s)}
        >
          <Text className={`text-slate-400 font-bold text-[13px] capitalize ${
            status === s ? 'text-white' : ''
          }`}>
            {s}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);
