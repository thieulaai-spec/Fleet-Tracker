import React from 'react';
import { View, Text, TouchableOpacity, Switch, Platform } from 'react-native';
import { LucideIcon, ChevronRight } from 'lucide-react-native';

interface SettingsItemProps {
  label: string;
  sublabel?: string;
  icon: LucideIcon;
  onPress?: () => void;
  showSwitch?: boolean;
  switchValue?: boolean;
  onSwitchValueChange?: (value: boolean) => void;
  switchDisabled?: boolean;
  showChevron?: boolean;
  showDivider?: boolean;
}

export const SettingsItem: React.FC<SettingsItemProps> = ({
  label,
  sublabel,
  icon: Icon,
  onPress,
  showSwitch = false,
  switchValue = false,
  onSwitchValueChange,
  switchDisabled = false,
  showChevron = true,
  showDivider = true,
}) => {
  const Content = (
    <View className="flex-row items-center justify-between p-5">
      <View className="flex-row items-center gap-4 flex-1">
        <View className={`w-10 h-10 rounded-2xl bg-slate-800 items-center justify-center border border-white/5`}>
          <Icon size={20} color={showSwitch && switchValue ? '#10b981' : '#94a3b8'} />
        </View>
        <View className="flex-1">
          <Text className="text-slate-100 text-base font-bold tracking-tight">{label}</Text>
          {sublabel && (
            <Text className={`text-[10px] font-bold uppercase tracking-wider ${showSwitch && switchValue ? 'text-emerald-400' : 'text-slate-500'}`}>
              {sublabel}
            </Text>
          )}
        </View>
      </View>
      
      {showSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchValueChange}
          disabled={switchDisabled}
          trackColor={{ false: '#1e293b', true: '#10b981' }}
          thumbColor={Platform.OS === 'ios' ? '#ffffff' : switchValue ? '#ffffff' : '#94a3b8'}
        />
      ) : (
        showChevron && <ChevronRight size={18} color="#475569" />
      )}
    </View>
  );

  return (
    <>
      {onPress ? (
        <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
          {Content}
        </TouchableOpacity>
      ) : (
        <View>{Content}</View>
      )}
      {showDivider && <View className="h-px bg-white/5 mx-5" />}
    </>
  );
};
