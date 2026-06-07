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
import { X, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react-native';
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
  const [expandedOrders, setExpandedOrders] = React.useState<Record<string, boolean>>({});

  const isOrderExpanded = (orderId: string, status: string) => {
    if (expandedOrders[orderId] !== undefined) {
      return expandedOrders[orderId];
    }
    return status?.toLowerCase() !== 'delivered';
  };

  const toggleOrderExpand = (orderId: string, status: string) => {
    const current = isOrderExpanded(orderId, status);
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !current,
    }));
  };

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
              
              {activeTrip && activeTrip.tripOrders && activeTrip.tripOrders.length > 0 ? (
                activeTrip.tripOrders.map((to: any) => {
                  const order = to.order;
                  if (!order) return null;
                  
                  const isExpanded = isOrderExpanded(order.id, order.status);
                  const orderVerifs = verifications.filter(v => v.orderId === order.id);
                  
                  return (
                    <View key={order.id} className="bg-slate-900/60 border border-white/5 p-4 rounded-2xl mb-4">
                      {/* Order Title & Toggler */}
                      <TouchableOpacity 
                        onPress={() => toggleOrderExpand(order.id, order.status)}
                        className="flex-row justify-between items-center"
                        activeOpacity={0.7}
                      >
                        <View className="flex-1 pr-2">
                          <View className="flex-row items-center gap-2 mb-2">
                            <Text className="text-white text-sm font-mono font-bold">Đơn: #{order.id.substring(0, 8)}</Text>
                            <Text 
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                order.status?.toLowerCase() === 'delivered' 
                                  ? 'text-slate-400 bg-slate-500/10' 
                                  : 'text-emerald-400 bg-emerald-500/10'
                              }`}
                            >
                              {order.status}
                            </Text>
                          </View>
                          <Text className="text-slate-400 text-xs" numberOfLines={1}>📍 Lấy: {order.pickupAddress}</Text>
                          <Text className="text-slate-400 text-xs mt-0.5" numberOfLines={1}>🏁 Giao: {order.deliveryAddress}</Text>
                        </View>
                        <View className="bg-white/5 w-8 h-8 rounded-full items-center justify-center border border-white/10">
                          {isExpanded ? (
                            <ChevronUp size={16} color="#94a3b8" />
                          ) : (
                            <ChevronDown size={16} color="#94a3b8" />
                          )}
                        </View>
                      </TouchableOpacity>

                      {/* Timeline (Expanded View) */}
                      {isExpanded && (
                        <View className="mt-4 pt-4 border-t border-white/5">
                          <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[2px] mb-3">TIẾN TRÌNH MINH CHỨNG</Text>
                          
                          {orderVerifs.length === 0 ? (
                            <View className="py-4 items-center">
                              <Text className="text-slate-500 text-xs font-semibold">Chưa ghi nhận chặng minh chứng nào.</Text>
                            </View>
                          ) : (
                            <View className="relative border-l border-white/10 pl-4 ml-2 space-y-4">
                              {orderVerifs.map((v) => (
                                <View key={v.id} className="relative">
                                  {/* Dot indicator */}
                                  <View className="absolute -left-[21px] top-1 bg-emerald-500 w-2.5 h-2.5 rounded-full border-2 border-slate-950 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                                  
                                  <View className="space-y-1.5">
                                    <View className="flex-row justify-between items-center">
                                      <Text className="text-slate-200 text-xs font-black uppercase tracking-wider">{getStepName(v.step)}</Text>
                                      <Text className="text-slate-500 text-[9px]">{formatTime(v.createdAt)}</Text>
                                    </View>

                                    <View className="flex-row items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md w-fit">
                                      <ShieldCheck size={10} color="#10b981" strokeWidth={2.5} />
                                      <Text className="text-emerald-500 text-[8px] font-black uppercase tracking-wider">Đã xác thực vân tay</Text>
                                    </View>

                                    {v.location && (
                                      <Text className="text-slate-500 text-[8px] mt-0.5">
                                        📍 GPS: {v.location.coordinates[1].toFixed(5)}, {v.location.coordinates[0].toFixed(5)}
                                      </Text>
                                    )}

                                    {/* Photos */}
                                    <View className="flex-row gap-3 mt-2">
                                      {v.facePhotoUrl && (
                                        <View className="items-center">
                                          <Text className="text-slate-500 text-[7px] font-bold uppercase mb-1">Ảnh chân dung (ESP32)</Text>
                                          <TouchableOpacity
                                            onPress={() => onSelectImage(v.facePhotoUrl)}
                                            className="w-12 h-12 rounded-lg border border-white/10 overflow-hidden bg-black"
                                          >
                                            <Image source={{ uri: v.facePhotoUrl }} className="w-full h-full object-cover" />
                                          </TouchableOpacity>
                                        </View>
                                      )}
                                      {(() => {
                                        const cargoPhotos = v.cargoPhotoUrl ? v.cargoPhotoUrl.split(',').filter(Boolean) : [];
                                        return cargoPhotos.map((photoUrl: string, pIdx: number) => (
                                          <View key={pIdx} className="items-center">
                                            <Text className="text-slate-500 text-[7px] font-bold uppercase mb-1">
                                              {cargoPhotos.length > 1 ? `Ảnh hàng hóa #${pIdx + 1}` : 'Ảnh hàng hóa'}
                                            </Text>
                                            <TouchableOpacity
                                              onPress={() => onSelectImage(photoUrl)}
                                              className="w-12 h-12 rounded-lg border border-white/10 overflow-hidden bg-black"
                                            >
                                              <Image source={{ uri: photoUrl }} className="w-full h-full object-cover" />
                                            </TouchableOpacity>
                                          </View>
                                        ));
                                      })()}
                                    </View>
                                  </View>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              ) : (
                <View className="py-12 items-center">
                  <Text className="text-slate-500 text-xs font-semibold">Chưa ghi nhận chặng minh chứng nào từ tài xế.</Text>
                </View>
              )}

            </ScrollView>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
};

