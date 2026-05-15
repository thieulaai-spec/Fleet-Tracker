import React from 'react';
import { View, Text } from 'react-native';
import { TripStatus } from '@/types/trip';

interface TripBadgeProps {
  status: string | TripStatus;
  isActive?: boolean;
  isHistory?: boolean;
}

export const getStatusColors = (status: string | TripStatus) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return {
        bg: 'bg-amber-500/15',
        border: 'border-amber-500/25',
        text: 'text-amber-400',
      };
    case 'accepted':
    case 'in_progress':
    case 'live':
      return {
        bg: 'bg-indigo-500/20',
        border: 'border-indigo-500/30',
        text: 'text-indigo-400',
      };
    case 'completed':
    case 'delivered':
      return {
        bg: 'bg-emerald-500/15',
        border: 'border-emerald-500/25',
        text: 'text-emerald-400',
      };
    case 'cancelled':
    case 'failed':
      return {
        bg: 'bg-red-500/15',
        border: 'border-red-500/25',
        text: 'text-red-400',
      };
    default:
      return {
        bg: 'bg-slate-500/15',
        border: 'border-slate-500/25',
        text: 'text-slate-400',
      };
  }
};

export const TripBadge: React.FC<TripBadgeProps> = ({ status, isActive, isHistory }) => {
  const displayStatus = isActive ? 'Live' : status.toUpperCase().replace('_', ' ');
  const colors = getStatusColors(isActive ? 'live' : status);

  return (
    <View className={`px-4 py-1.5 rounded-full border ${colors.bg} ${colors.border}`}>
      <Text className={`text-[10px] font-black uppercase tracking-widest ${colors.text}`}>
        {displayStatus}
      </Text>
    </View>
  );
};
