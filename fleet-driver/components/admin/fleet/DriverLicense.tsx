import React from 'react';
import { View, Text } from 'react-native';
import { ShieldCheck, Calendar } from 'lucide-react-native';
import { Driver } from '../../../store/useFleetStore';

interface DriverLicenseProps {
  driver: Driver;
}

export const DriverLicense: React.FC<DriverLicenseProps> = ({ driver }) => {
  return (
    <View className="bg-slate-800 rounded-[24px] p-5 border border-white/10">
      <Text className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-5">License Information</Text>

      <View className="flex-row items-center gap-4 mb-5">
        <ShieldCheck size={20} color="#64748b" />
        <View>
          <Text className="text-xs text-slate-500 font-semibold">Class</Text>
          <Text className="text-base text-slate-50 font-bold">
            {driver.licenseClass || "N/A"}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-4">
        <Calendar size={20} color="#64748b" />
        <View>
          <Text className="text-xs text-slate-500 font-semibold">Expiry Date</Text>
          <Text className="text-base text-slate-50 font-bold">
            {driver.licenseExpiry
              ? new Date(driver.licenseExpiry).toLocaleDateString()
              : "N/A"}
          </Text>
        </View>
      </View>
    </View>
  );
};
