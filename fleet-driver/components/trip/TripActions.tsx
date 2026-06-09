import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Truck, CheckCircle2, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TripStatus } from '../../store/useTripStore';
import { SosButton } from '../ui/SosButton';

interface TripActionsProps {
  trip: any;
  activeTrip: any;
  isStoreLoading: boolean;
  handleAcceptTrip: () => void;
  handleRejectTrip: () => void;
  handleStatusUpdate: (status: TripStatus) => void;
}

export const TripActions: React.FC<TripActionsProps> = ({
  trip,
  activeTrip,
  isStoreLoading,
  handleAcceptTrip,
  handleRejectTrip,
  handleStatusUpdate,
}) => {
  const isCompletedTrip = trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED;

  return (
    <View className="mt-10 gap-4">
      {/* Action Buttons for Pending Trip */}
      {trip.status === TripStatus.PENDING && (
        <>
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={handleAcceptTrip}
            disabled={isStoreLoading}
          >
            <LinearGradient
              colors={["#6366f1", "#4f46e5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="h-20 rounded-[32px] flex-row items-center justify-center gap-4 shadow-xl shadow-indigo-500/40"
            >
              {isStoreLoading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                    <Check size={20} color="#fff" />
                  </View>
                  <Text className="text-white text-xl font-black italic tracking-widest">CHẤP NHẬN CHUYẾN ĐI</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={handleRejectTrip}
            disabled={isStoreLoading}
            className="h-16 rounded-[28px] border border-rose-500/30 bg-rose-500/5 flex-row items-center justify-center gap-3"
          >
            <Text className="text-rose-400 font-black text-sm uppercase tracking-wider">Từ chối chuyến đi</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Action Buttons (Only for non-completed active trip) */}
      {!isCompletedTrip && activeTrip?.id === trip.id && (
        <>
          {trip.status === TripStatus.ACCEPTED && (
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => handleStatusUpdate(TripStatus.IN_PROGRESS)}
              disabled={isStoreLoading}
            >
              <LinearGradient
                colors={["#6366f1", "#4f46e5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="h-20 rounded-[32px] flex-row items-center justify-center gap-4 shadow-xl shadow-indigo-500/40"
              >
                {isStoreLoading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                      <Truck size={20} color="#fff" />
                    </View>
                    <Text className="text-white text-xl font-black italic tracking-widest">BẮT ĐẦU VẬN CHUYỂN</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {trip.status === TripStatus.IN_PROGRESS && (
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => handleStatusUpdate(TripStatus.COMPLETED)}
              disabled={isStoreLoading}
            >
              <LinearGradient
                colors={["#10b981", "#059669"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="h-20 rounded-[32px] flex-row items-center justify-center gap-4 shadow-xl shadow-emerald-500/40"
              >
                {isStoreLoading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                      <CheckCircle2 size={20} color="#fff" />
                    </View>
                    <Text className="text-white text-xl font-black italic tracking-widest">HOÀN THÀNH CHUYẾN ĐI</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
          
          <SosButton tripId={trip.id} />
        </>
      )}
    </View>
  );
};
