import React from 'react';
import { View, Text } from 'react-native';
import { Power, Settings, Lock, Info } from 'lucide-react-native';
import { SettingsItem } from '../ui/SettingsItem';

interface SettingsSectionProps {
  isOnline: boolean;
  isUpdatingStatus: boolean;
  activeTrip: any;
  onToggleStatus: () => void;
  onOpenSecurity: () => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  isOnline,
  isUpdatingStatus,
  activeTrip,
  onToggleStatus,
  onOpenSecurity
}) => {
  return (
    <View className="px-5 mt-10">
      <View className="flex-row items-center mb-4 ml-1">
        <View className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-2" />
        <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[2px]">System Preferences</Text>
      </View>
      
      <View className="bg-slate-900/40 rounded-[32px] overflow-hidden border border-white/5">
        <SettingsItem 
          label="Duty Status"
          sublabel={isOnline ? 'Online & Available' : 'Offline / Off Duty'}
          icon={Power}
          showSwitch={true}
          switchValue={isOnline}
          onSwitchValueChange={onToggleStatus}
          switchDisabled={isUpdatingStatus || !!activeTrip}
        />

        <SettingsItem 
          label="App Configuration"
          icon={Settings}
          onPress={() => {}}
        />
        
        <SettingsItem 
          label="Security & Access"
          icon={Lock}
          onPress={onOpenSecurity}
        />
        
        <SettingsItem 
          label="Support Center"
          icon={Info}
          onPress={() => {}}
          showDivider={false}
        />
      </View>
    </View>
  );
};
