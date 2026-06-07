import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Truck, RefreshCcw, Check, Eye } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTripStore, Trip } from '../../store/useTripStore';
import { useAuthStore } from '../../store/useAuthStore';
import Toast from 'react-native-toast-message';

interface NoActiveTripProps {
  onRefresh: () => void;
  pendingTrips?: Trip[];
}

export const NoActiveTrip: React.FC<NoActiveTripProps> = ({ onRefresh, pendingTrips = [] }) => {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);
  const pendingTrip = pendingTrips[0]; // Get the first pending trip

  const handleAcceptTrip = () => {
    if (!pendingTrip) return;

    Alert.alert(
      'Chấp nhận chuyến đi',
      'Bạn có chắc chắn muốn chấp nhận chuyến đi này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Chấp nhận', 
          onPress: async () => {
            setIsAccepting(true);
            try {
              const user = useAuthStore.getState().user;
              const hasFingerprint = !!user?.driver?.fingerprintId;
              const acceptTrip = useTripStore.getState().acceptTrip;
              await acceptTrip(pendingTrip.id);
              
              if (!hasFingerprint) {
                Alert.alert(
                  'Đăng ký vân tay lần đầu 👤',
                  'Tài xế mới! Hệ thống phát hiện bạn chưa đăng ký vân tay. Vui lòng đặt ngón tay lên cảm biến AS608 trên xe để hoàn tất đăng ký vân tay trước khi tiến hành lấy hàng.',
                  [
                    { 
                      text: 'Đã hiểu', 
                      onPress: () => {
                        onRefresh(); // Refresh trips state
                      } 
                    }
                  ]
                );
              } else {
                Toast.show({
                  type: 'success',
                  text1: 'Đã nhận chuyến 🎉',
                  text2: 'Chuyến đi đã được chấp nhận thành công.'
                });
                onRefresh();
              }
            } catch (err: any) {
              Toast.show({
                type: 'error',
                text1: 'Nhận chuyến thất bại',
                text2: err.message
              });
            } finally {
              setIsAccepting(false);
            }
          } 
        },
      ]
    );
  };

  const hasPending = pendingTrips.length > 0 && pendingTrip;

  return (
    <View className="flex-1 bg-slate-950 justify-center items-center p-8">
      {/* Background Glows */}
      <View 
        className="absolute w-[400px] h-[400px] rounded-full bg-indigo-500/10" 
        style={{ top: '10%', left: '-20%', transform: [{ scale: 1.5 }] }} 
      />
      <View 
        className="absolute w-[350px] h-[350px] rounded-full bg-blue-500/5" 
        style={{ bottom: '10%', right: '-10%', transform: [{ scale: 1.5 }] }} 
      />

      <BlurView intensity={20} tint="light" className="p-8 rounded-[48px] border border-slate-700 items-center overflow-hidden w-full max-w-[340px]">
        <LinearGradient
          colors={hasPending ? ['#e0e7ff', '#c7d2fe'] : ['#ecfdf5', '#d1fae5']}
          className="w-24 h-24 rounded-[36px] justify-center items-center mb-8 shadow-2xl border border-indigo-300/50"
        >
          <Truck size={40} color={hasPending ? '#4f46e5' : '#10b981'} strokeWidth={1.5} />
        </LinearGradient>
        
        <Text className="text-white text-3xl font-black text-center tracking-tight leading-none">
          {hasPending ? 'NEW MISSION\nPENDING' : 'NO ACTIVE\nMISSION'}
        </Text>
        
        <Text className="text-slate-400 text-center mt-5 leading-6 font-medium text-sm">
          {hasPending 
            ? `Bạn có 1 chuyến đi mới đang chờ xác nhận (${pendingTrip.orders.length} đơn hàng). Vui lòng chấp nhận để bắt đầu chỉ đường.`
            : 'Stand by for incoming deployments. Fleet Intelligence is monitoring for new requests.'}
        </Text>

        {hasPending ? (
          <View className="mt-8 w-full gap-3">
            <TouchableOpacity 
              className="w-full overflow-hidden rounded-xl"
              onPress={handleAcceptTrip}
              activeOpacity={0.8}
              disabled={isAccepting}
            >
              <LinearGradient
                colors={['#6366f1', '#4f46e5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-4 flex-row justify-center items-center gap-2"
              >
                {isAccepting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Check size={18} color="#fff" strokeWidth={2.5} />
                    <Text className="text-white font-black text-sm uppercase tracking-widest">Chấp nhận</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              className="w-full py-4 rounded-xl border border-white/10 bg-white/5 flex-row justify-center items-center gap-2"
              onPress={() => router.push(`/trip/${pendingTrip.id}`)}
              activeOpacity={0.8}
              disabled={isAccepting}
            >
              <Eye size={18} color="#94a3b8" />
              <Text className="text-slate-300 font-bold text-sm uppercase tracking-widest">Xem chi tiết</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            className="mt-10 w-full overflow-hidden rounded-xl"
            onPress={onRefresh}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="py-4 flex-row justify-center items-center gap-2"
            >
              <RefreshCcw size={18} color="#fff" />
              <Text className="text-slate-950 font-black text-sm uppercase tracking-widest">Check Status</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </BlurView>
    </View>
  );
};
