import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

interface TripSectionHeaderProps {
  title: string;
}

export const TripSectionHeader: React.FC<TripSectionHeaderProps> = ({ title }) => {
  const router = useRouter();
  return (
    <View className="px-8 pt-10 pb-6 flex-row items-center justify-between">
      <View className="flex-row items-center gap-3">
        <View 
          className={`w-2 h-2 rounded-full ${title === 'Active Trip' ? 'bg-indigo-500' : 'bg-slate-700'}`} 
          style={{ 
            elevation: title === 'Active Trip' ? 10 : 0,
            shadowColor: title === 'Active Trip' ? '#6366f1' : 'transparent',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: title === 'Active Trip' ? 0.5 : 0,
            shadowRadius: 10
          }} 
        />
        <Text className="text-[12px] font-black text-slate-400 uppercase tracking-[2px]">
          {title === 'Active Trip' ? 'Hành trình đang chạy' :
           title === 'Pending Trips' ? 'Chuyến đi đang chờ' :
           title === 'Trip History' ? 'Lịch sử chuyến đi' : title}
        </Text>
      </View>
      {title === 'Trip History' && (
        <TouchableOpacity activeOpacity={0.6} onPress={() => router.push('/trip/history')}>
          <Text className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Xem tất cả</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
