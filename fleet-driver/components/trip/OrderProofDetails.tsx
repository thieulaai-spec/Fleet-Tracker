import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { FileText, Check, Fingerprint, MapPin } from 'lucide-react-native';
import { Order, OrderStatus } from '@/types/trip';
import { LightboxModal } from '../admin/tracking/LightboxModal';

interface OrderProofDetailsProps {
  order: Order;
  verifications: any[];
}

export const OrderProofDetails: React.FC<OrderProofDetailsProps> = ({ order, verifications = [] }) => {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const orderVers = verifications.filter(v => v.orderId === order.id);
  
  // Filter verifications based on current order status
  let visibleVers = orderVers;
  if (order.status === OrderStatus.PICKED_UP || order.status === OrderStatus.DELIVERING) {
    // Show accept, pickup, checkpoint steps
    visibleVers = orderVers.filter(v => v.step === 'accept' || v.step === 'pickup' || v.step === 'checkpoint');
  } else if (order.status === OrderStatus.ASSIGNED) {
    // Show accept step
    visibleVers = orderVers.filter(v => v.step === 'accept');
  }

  if (visibleVers.length === 0) {
    return (
      <View className="mt-4 pt-4 border-t border-white/5">
        <Text className="text-slate-500 text-xs italic text-center">Chưa có minh chứng xác thực nào được ghi nhận.</Text>
      </View>
    );
  }

  return (
    <View className="mt-4 pt-4 border-t border-white/5 gap-4">
      <View className="flex-row items-center gap-2 mb-1">
        <FileText size={12} color="#818cf8" />
        <Text className="text-indigo-400 text-xs font-black uppercase tracking-wider">Chi tiết minh chứng xác thực</Text>
      </View>
      
      <View className="gap-4">
        {visibleVers.map((ver, idx) => {
          const isPickupStep = ver.step === 'pickup';
          const isDeliveryStep = ver.step === 'delivery';
          const isAcceptStep = ver.step === 'accept';
          const isCheckpointStep = ver.step === 'checkpoint';
          
          let stepTitle = 'Xác thực';
          if (isAcceptStep) stepTitle = 'Chấp nhận đơn';
          else if (isPickupStep) stepTitle = 'Lấy hàng thành công (Đã đến lấy)';
          else if (isDeliveryStep) stepTitle = 'Bàn giao hàng thành công (Đã giao)';
          else if (isCheckpointStep) stepTitle = 'Mốc lộ trình';

          const cargoPhotos = ver.cargoPhotoUrl ? ver.cargoPhotoUrl.split(',').filter(Boolean) : [];

          return (
            <View key={ver.id || idx} className="flex-row gap-3">
              {/* Node Line */}
              <View className="items-center">
                <View className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 items-center justify-center">
                  <Check size={10} color="#818cf8" />
                </View>
                {idx !== visibleVers.length - 1 && (
                  <View className="w-px flex-1 bg-white/10 my-1" />
                )}
              </View>

              {/* Node Content */}
              <View className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                <View className="flex-row justify-between items-center mb-2.5">
                  <Text className="text-white text-xs font-black tracking-wide">{stepTitle}</Text>
                  <Text className="text-slate-500 text-[9px] font-black uppercase tracking-wider">
                    {new Date(ver.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                {/* Fingerprint proof */}
                {ver.fingerprintStatus && (
                  <View className="flex-row items-center gap-1.5 mb-3 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg self-start">
                    <Fingerprint size={10} color="#10b981" />
                    <Text className="text-emerald-400 text-[8px] font-black uppercase tracking-wider">Vân tay đã xác minh</Text>
                  </View>
                )}

                {/* Photos Row */}
                {(ver.facePhotoUrl || cargoPhotos.length > 0) && (
                  <View className="flex-row gap-3 mt-1.5">
                    {/* Face Photo */}
                    {ver.facePhotoUrl && (
                      <View className="flex-1">
                        <Text className="text-slate-500 text-[8px] font-black uppercase tracking-wider mb-1">Xác thực tài xế (Face ID)</Text>
                        <TouchableOpacity 
                          activeOpacity={0.9} 
                          onPress={() => setLightboxUrl(ver.facePhotoUrl)}
                          className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-slate-950"
                        >
                          <Image 
                            source={{ uri: ver.facePhotoUrl }} 
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Cargo Photos */}
                    {cargoPhotos.length > 0 && (
                      <View className="flex-1">
                        <Text className="text-slate-500 text-[8px] font-black uppercase tracking-wider mb-1">Ảnh thực tế hàng hóa</Text>
                        <View className="flex-row flex-wrap gap-1.5">
                          {cargoPhotos.map((photoUrl: string, pIdx: number) => (
                            <TouchableOpacity 
                              key={pIdx}
                              activeOpacity={0.9} 
                              onPress={() => setLightboxUrl(photoUrl)}
                              className={cargoPhotos.length === 1 ? "w-full aspect-square rounded-xl overflow-hidden border border-white/10 bg-slate-950" : "w-[47%] aspect-square rounded-xl overflow-hidden border border-white/10 bg-slate-950"}
                            >
                              <Image 
                                source={{ uri: photoUrl }} 
                                className="w-full h-full"
                                resizeMode="cover"
                              />
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* GPS Location Details */}
                {ver.location && ver.location.coordinates && (
                  <View className="flex-row items-center gap-1.5 mt-3 bg-white/[0.03] p-2 rounded-lg border border-white/5">
                    <MapPin size={10} color="#a78bfa" />
                    <Text className="text-slate-400 text-[9px] font-bold" numberOfLines={1}>
                      GPS: {ver.location.coordinates[1].toFixed(5)}, {ver.location.coordinates[0].toFixed(5)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {lightboxUrl && (
        <LightboxModal imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </View>
  );
};
