import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, ShieldCheck } from 'lucide-react-native';
import { formatTime } from './trackingUtils';

interface ProofDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  selectedVehicle: any;
  activeTrip: any;
  verifications: any[];
  onSelectImage: (url: string) => void;
}

const getStepName = (step: string) => {
  switch (step) {
    case 'accept': return 'Khởi hành';
    case 'pickup': return 'Nhận hàng';
    case 'checkpoint': return 'Chặng giữa';
    case 'delivery': return 'Bàn giao';
    default: return step;
  }
};

export const ProofDetailsModal: React.FC<ProofDetailsModalProps> = ({
  visible,
  onClose,
  selectedVehicle,
  activeTrip,
  verifications,
  onSelectImage,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1">
        <View className="absolute inset-0 bg-black/80" />
        <BlurView intensity={90} tint="light" className="flex-1 justify-end">
          <View className="bg-slate-950 rounded-t-[44px] border-t border-slate-700 p-6 shadow-2xl overflow-hidden min-h-[75%] max-h-[85%]">
            
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6 pb-4 border-b border-white/5">
              <View>
                <Text className="text-white text-xl font-black">Hành Trình Minh Chứng</Text>
                <Text className="text-indigo-400 text-[10px] font-black uppercase tracking-wider mt-1">
                  Xe: {selectedVehicle?.licensePlate} • {selectedVehicle?.driverName}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                className="bg-white/5 w-10 h-10 rounded-full items-center justify-center border border-white/10"
              >
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              
              {/* Active Orders Info Section */}
              {activeTrip && activeTrip.tripOrders && activeTrip.tripOrders.length > 0 && (
                <View className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl mb-6">
                  <Text className="text-indigo-400 text-[10px] font-black uppercase tracking-wider mb-3">Đơn hàng đang chạy</Text>
                  {activeTrip.tripOrders.map((to: any) => {
                    const order = to.order;
                    if (!order || order.status === 'delivered') return null;
                    return (
                      <View key={order.id} className="mb-4 last:mb-0">
                        <View className="flex-row justify-between items-center mb-1">
                          <Text className="text-white text-xs font-mono">Đơn: #{order.id.substring(0, 8)}</Text>
                          <Text className="text-emerald-400 text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-500/10 rounded-full">{order.status}</Text>
                        </View>
                        <Text className="text-slate-400 text-xs mt-1" numberOfLines={1}>📍 Lấy: {order.pickupAddress}</Text>
                        <Text className="text-slate-400 text-xs mt-0.5" numberOfLines={1}>🏁 Giao: {order.deliveryAddress}</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Timeline */}
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-4 pl-1">Tiến trình minh chứng chặng</Text>
              
              {verifications.length === 0 ? (
                <View className="py-12 items-center">
                  <Text className="text-slate-500 text-xs font-semibold">Chưa ghi nhận chặng minh chứng nào từ tài xế.</Text>
                </View>
              ) : (
                <View className="relative border-l-2 border-white/10 pl-5 ml-3 space-y-6 pb-6">
                  {verifications.map((v) => (
                    <View key={v.id} className="relative">
                      {/* Dot indicator */}
                      <View className="absolute -left-[27px] top-1 bg-emerald-500 w-3.5 h-3.5 rounded-full border-[3px] border-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                      
                      <View className="space-y-1.5">
                        <View className="flex-row justify-between items-center">
                          <Text className="text-slate-200 text-xs font-black uppercase tracking-wider">{getStepName(v.step)}</Text>
                          <Text className="text-slate-500 text-[10px]">
                            {formatTime(v.createdAt)}
                          </Text>
                        </View>

                        <View className="flex-row items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg w-fit">
                          <ShieldCheck size={11} color="#10b981" strokeWidth={2.5} />
                          <Text className="text-emerald-500 text-[8px] font-black uppercase tracking-wider">Đã xác thực vân tay</Text>
                        </View>

                        {v.location && (
                          <Text className="text-slate-500 text-[9px] mt-1">
                            📍 GPS: {v.location.coordinates[1].toFixed(5)}, {v.location.coordinates[0].toFixed(5)}
                          </Text>
                        )}

                        {/* Photos */}
                        <View className="flex-row gap-3 mt-2">
                          {v.facePhotoUrl && (
                            <View className="items-center">
                              <Text className="text-slate-500 text-[8px] font-black uppercase mb-1">Ảnh chân dung (ESP32)</Text>
                              <TouchableOpacity
                                onPress={() => onSelectImage(v.facePhotoUrl)}
                                className="w-16 h-16 rounded-xl border border-white/10 overflow-hidden bg-black"
                              >
                                <Image source={{ uri: v.facePhotoUrl }} className="w-full h-full object-cover" />
                              </TouchableOpacity>
                            </View>
                          )}
                          {v.cargoPhotoUrl && (
                            <View className="items-center">
                              <Text className="text-slate-500 text-[8px] font-black uppercase mb-1">Ảnh hàng hóa (Điện thoại)</Text>
                              <TouchableOpacity
                                onPress={() => onSelectImage(v.cargoPhotoUrl)}
                                className="w-16 h-16 rounded-xl border border-white/10 overflow-hidden bg-black"
                              >
                                <Image source={{ uri: v.cargoPhotoUrl }} className="w-full h-full object-cover" />
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

            </ScrollView>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
};
