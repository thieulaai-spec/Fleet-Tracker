import React from 'react';
import { View, ScrollView, TouchableOpacity, Text } from 'react-native';
import { STATUS_CONFIG, FILTER_STATUSES } from './OrderCardItem';

interface OrderFilterPillsProps {
  activeDateFilter: string;
  onSelectDateFilter: (filter: any) => void;
  selectedStatus: string;
  onSelectStatus: (status: any) => void;
}

export const OrderFilterPills: React.FC<OrderFilterPillsProps> = ({
  activeDateFilter,
  onSelectDateFilter,
  selectedStatus,
  onSelectStatus,
}) => {
  return (
    <View>
      {/* Quick Date Filters Pills */}
      <View className="px-5 mb-4 mt-1">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 20 }}
        >
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'today', label: 'Hôm nay' },
            { id: '7days', label: '7 ngày qua' },
            { id: '30days', label: '30 ngày qua' },
            { id: 'custom', label: 'Tùy chỉnh' },
          ].map((f) => {
            const isActive = activeDateFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => onSelectDateFilter(f.id)}
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

      {/* Lifecycle Status Pills */}
      <View className="mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          <TouchableOpacity 
            className={`px-4 py-2 rounded-full bg-slate-800 border border-white/5 ${
              selectedStatus === 'all' ? 'bg-indigo-500 border-indigo-500' : ''
            }`}
            onPress={() => onSelectStatus('all')}
            activeOpacity={0.7}
          >
            <Text className={`font-semibold text-sm ${
              selectedStatus === 'all' ? 'text-white' : 'text-slate-400'
            }`}>All</Text>
          </TouchableOpacity>
          {FILTER_STATUSES.map((status) => {
            const config = STATUS_CONFIG[status];
            return (
              <TouchableOpacity 
                key={status}
                className={`px-4 py-2 rounded-full bg-slate-800 border border-white/5 ${
                  selectedStatus === status ? 'bg-indigo-500 border-indigo-500' : ''
                }`}
                onPress={() => onSelectStatus(status)}
                activeOpacity={0.7}
              >
                <Text className={`font-semibold text-sm ${
                  selectedStatus === status ? 'text-white' : 'text-slate-400'
                }`}>
                  {config?.label || status}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};
