import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { User } from 'lucide-react-native';

interface RecipientSectionProps {
  recipientName: string;
  onRecipientNameChange: (text: string) => void;
  recipientPhone: string;
  onRecipientPhoneChange: (text: string) => void;
  errors: Record<string, string>;
}

export const RecipientSection: React.FC<RecipientSectionProps> = ({
  recipientName,
  onRecipientNameChange,
  recipientPhone,
  onRecipientPhoneChange,
  errors,
}) => {
  return (
    <View className="bg-slate-900 rounded-3xl p-5 border border-slate-700/50 gap-4">
      <View className="flex-row items-center gap-2.5 mb-1">
        <User size={20} color="#10b981" />
        <Text className="text-lg font-bold text-slate-50">Recipient Details</Text>
      </View>
      
      <View className="gap-2">
        <Text className="text-sm font-semibold text-slate-400 ml-1">Recipient Name</Text>
        <TextInput
          className={`bg-slate-800 rounded-2xl h-[52px] px-4 text-slate-50 text-base border border-slate-700/50 ${errors.recipientName ? 'border-red-500' : ''}`}
          placeholder="Full Name"
          placeholderTextColor="#64748b"
          value={recipientName}
          onChangeText={onRecipientNameChange}
        />
        {!!errors.recipientName && <Text className="text-red-500 text-xs font-semibold ml-1">{errors.recipientName}</Text>}
      </View>

      <View className="gap-2">
        <Text className="text-sm font-semibold text-slate-400 ml-1">Recipient Phone</Text>
        <TextInput
          className={`bg-slate-800 rounded-2xl h-[52px] px-4 text-slate-50 text-base border border-slate-700/50 ${errors.recipientPhone ? 'border-red-500' : ''}`}
          placeholder="Phone Number"
          placeholderTextColor="#64748b"
          keyboardType="phone-pad"
          value={recipientPhone}
          onChangeText={onRecipientPhoneChange}
        />
        {!!errors.recipientPhone && <Text className="text-red-500 text-xs font-semibold ml-1">{errors.recipientPhone}</Text>}
      </View>
    </View>
  );
};
