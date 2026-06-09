import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Fingerprint } from 'lucide-react-native';

interface FingerprintStatusCardProps {
  driver: any;
  onClearFingerprint: () => void;
}

export const FingerprintStatusCard: React.FC<FingerprintStatusCardProps> = ({
  driver,
  onClearFingerprint,
}) => {
  if (!driver) return null;

  if (driver.fingerprintId) {
    return (
      <View className="bg-slate-850 p-5 rounded-[24px] border border-white/5 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-xl bg-indigo-500/10 items-center justify-center">
            <Fingerprint size={20} color="#6366f1" />
          </View>
          <View>
            <Text className="text-slate-550 font-bold text-sm">Sinh trắc học vân tay</Text>
            <Text className="text-indigo-400 text-xs mt-0.5 font-medium">Mã vân tay: #{driver.fingerprintId}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onClearFingerprint}
          className="bg-red-500/10 px-3 py-2 rounded-xl border border-red-500/20"
          activeOpacity={0.7}
        >
          <Text className="text-red-400 text-xs font-extrabold uppercase">Xóa</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="bg-slate-850 p-5 rounded-[24px] border border-white/5 flex-row items-center gap-3">
      <View className="w-10 h-10 rounded-xl bg-slate-800 items-center justify-center">
        <Fingerprint size={20} color="#64748b" />
      </View>
      <View>
        <Text className="text-slate-400 font-bold text-sm">Sinh trắc học vân tay</Text>
        <Text className="text-slate-550 text-xs mt-0.5 font-medium">Chưa đăng ký vân tay</Text>
      </View>
    </View>
  );
};
