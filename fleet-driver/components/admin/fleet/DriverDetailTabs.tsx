import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';

interface DriverDetailTabsProps {
  activeTab: 'info' | 'journey';
  onTabChange: (tab: 'info' | 'journey') => void;
}

export const DriverDetailTabs: React.FC<DriverDetailTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <View className="flex-row border-b border-white/5 mx-5 mt-6 mb-2">
      <TouchableOpacity
        onPress={() => onTabChange('info')}
        className="flex-1 pb-3 items-center"
        style={{ borderBottomWidth: activeTab === 'info' ? 2 : 0, borderBottomColor: '#6366f1' }}
      >
        <Text className={`text-sm font-extrabold uppercase tracking-wider ${activeTab === 'info' ? 'text-indigo-400' : 'text-slate-400'}`}>Thông tin</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onTabChange('journey')}
        className="flex-1 pb-3 items-center"
        style={{ borderBottomWidth: activeTab === 'journey' ? 2 : 0, borderBottomColor: '#6366f1' }}
      >
        <Text className={`text-sm font-extrabold uppercase tracking-wider ${activeTab === 'journey' ? 'text-indigo-400' : 'text-slate-400'}`}>Hành trình minh chứng</Text>
      </TouchableOpacity>
    </View>
  );
};
