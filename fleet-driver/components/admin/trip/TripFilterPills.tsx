import React from 'react';
import { View, ScrollView, TouchableOpacity, Text } from 'react-native';

interface TripFilterPillsProps {
  activeFilter: string;
  onSelectFilter: (filter: any) => void;
}

const filters = [
  { id: 'all', label: 'Tất cả' },
  { id: 'today', label: 'Hôm nay' },
  { id: '7days', label: '7 ngày qua' },
  { id: '30days', label: '30 ngày qua' },
  { id: 'custom', label: 'Tùy chỉnh' },
];

export const TripFilterPills: React.FC<TripFilterPillsProps> = ({
  activeFilter,
  onSelectFilter,
}) => {
  return (
    <View className="px-6 mb-4 mt-2">
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 20 }}
      >
        {filters.map((f) => {
          const isActive = activeFilter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              onPress={() => onSelectFilter(f.id)}
              className={isActive 
                ? "px-4 py-2.5 rounded-full border bg-indigo-600 border-indigo-500" 
                : "px-4 py-2.5 rounded-full border bg-slate-900/60 border-white/5"
              }
              activeOpacity={0.7}
            >
              <Text className={isActive ? "text-xs font-bold text-white" : "text-xs font-bold text-slate-400"}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
