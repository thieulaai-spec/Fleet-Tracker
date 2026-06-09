import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Users, Truck } from 'lucide-react-native';

interface FleetTabsProps {
  activeTab: 'drivers' | 'vehicles';
  onTabChange: (tab: 'drivers' | 'vehicles') => void;
}

export const FleetTabs: React.FC<FleetTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <View className="flex-row bg-slate-800 mx-5 rounded-2xl p-1 mb-4">
      <TouchableOpacity 
        className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl gap-2 ${activeTab === 'drivers' ? 'bg-indigo-500' : ''}`}
        onPress={() => onTabChange('drivers')}
        activeOpacity={0.7}
      >
        <Users size={18} color={activeTab === 'drivers' ? '#fff' : '#94a3b8'} />
        <Text className={`font-bold text-sm ${activeTab === 'drivers' ? 'text-white' : 'text-slate-400'}`}>Drivers</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl gap-2 ${activeTab === 'vehicles' ? 'bg-indigo-500' : ''}`}
        onPress={() => onTabChange('vehicles')}
        activeOpacity={0.7}
      >
        <Truck size={18} color={activeTab === 'vehicles' ? '#fff' : '#94a3b8'} />
        <Text className={`font-bold text-sm ${activeTab === 'vehicles' ? 'text-white' : 'text-slate-400'}`}>Vehicles</Text>
      </TouchableOpacity>
    </View>
  );
};
