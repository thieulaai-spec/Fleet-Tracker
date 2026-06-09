import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Fingerprint, Settings2, Plus } from 'lucide-react-native';

interface FleetHeaderProps {
  activeTab: 'drivers' | 'vehicles';
  onClearAllFingerprints: () => void;
  onSettings: () => void;
  onAdd: () => void;
}

export const FleetHeader: React.FC<FleetHeaderProps> = ({
  activeTab,
  onClearAllFingerprints,
  onSettings,
  onAdd,
}) => {
  return (
    <View className="flex-row justify-between items-center px-5 pt-3 mb-5">
      <View>
        <Text className="text-base text-slate-400 font-medium">Management</Text>
        <Text className="text-3xl font-bold text-slate-50">Fleet</Text>
      </View>
      <View className="flex-row items-center gap-3">
        {activeTab === 'drivers' && (
          <TouchableOpacity 
            className="bg-red-500/10 w-12 h-12 rounded-2xl justify-center items-center border border-red-500/20"
            onPress={onClearAllFingerprints}
            activeOpacity={0.7}
          >
            <Fingerprint size={22} color="#ef4444" />
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          className="bg-slate-800 w-12 h-12 rounded-2xl justify-center items-center border border-white/10"
          onPress={onSettings}
          activeOpacity={0.7}
        >
          <Settings2 size={22} color="#94a3b8" />
        </TouchableOpacity>
        <TouchableOpacity 
          className="bg-indigo-500 w-12 h-12 rounded-2xl justify-center items-center shadow-lg shadow-indigo-500/50"
          onPress={onAdd}
          activeOpacity={0.7}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
