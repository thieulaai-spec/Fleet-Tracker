import React from 'react';
import { View, Text, Image } from 'react-native';
import { MapPin, Scale, Calendar, Package, Clock, Fingerprint, CheckCircle2, Check, UserCheck } from 'lucide-react-native';
import { Order } from '../../../store/useOrderStore';

interface OrderDetailInfoProps {
  order: Order;
  verifications?: any[];
}

export const OrderDetailInfo: React.FC<OrderDetailInfoProps> = ({ order, verifications = [] }) => {
  return (
    <View className="gap-5">
      {/* Route Details */}
      <View className="bg-slate-900 rounded-3xl p-5 border border-white/5">
        <View className="flex-row items-center gap-2.5 mb-4">
          <MapPin size={20} color="#6366f1" />
          <Text className="text-lg font-bold text-slate-100">Route Details</Text>
        </View>
        
        <View className="flex-row gap-4">
          <View className="w-3 items-center">
            <View className="w-3 h-3 rounded-full bg-amber-500 mt-1" />
            <View className="w-0.5 flex-1 bg-white/10 my-1" />
          </View>
          <View className="flex-1 pb-4">
            <Text className="text-xs text-slate-500 font-semibold mb-1">Pickup Address</Text>
            <Text className="text-sm text-slate-300 leading-5">{order.pickupAddress}</Text>
          </View>
        </View>
        
        <View className="flex-row gap-4">
          <View className="w-3 items-center">
            <View className="w-3 h-3 rounded-full bg-emerald-500 mt-1" />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-slate-500 font-semibold mb-1">Delivery Address</Text>
            <Text className="text-sm text-slate-300 leading-5">{order.deliveryAddress}</Text>
          </View>
        </View>
      </View>

      {/* Weight & Date */}
      <View className="flex-row gap-4">
        <View className="flex-1 bg-slate-900 rounded-3xl p-5 border border-white/5">
          <View className="flex-row items-center gap-2 mb-3">
            <Scale size={18} color="#6366f1" />
            <Text className="text-sm font-bold text-slate-100">Weight</Text>
          </View>
          <Text className="text-xl font-extrabold text-white">{order.weightKg} kg</Text>
        </View>

        <View className="flex-1 bg-slate-900 rounded-3xl p-5 border border-white/5">
          <View className="flex-row items-center gap-2 mb-3">
            <Calendar size={18} color="#6366f1" />
            <Text className="text-sm font-bold text-slate-100">Date</Text>
          </View>
          <Text className="text-xl font-extrabold text-white">
            {new Date(order.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Instructions */}
      {order.description && (
        <View className="bg-slate-900 rounded-3xl p-5 border border-white/5">
          <View className="flex-row items-center gap-2.5 mb-4">
            <Package size={20} color="#6366f1" />
            <Text className="text-lg font-bold text-slate-100">Instructions</Text>
          </View>
          <Text className="text-slate-400 text-sm leading-6">{order.description}</Text>
        </View>
      )}

      {/* Timeline */}
      <View className="bg-slate-900 rounded-3xl p-5 border border-white/5">
        <View className="flex-row items-center gap-2.5 mb-6">
          <Clock size={20} color="#6366f1" />
          <Text className="text-lg font-bold text-slate-100">Timeline minh chứng</Text>
        </View>

        <View className="gap-5">
          {/* Base Step: Created */}
          <View className="flex-row gap-4">
            <View className="items-center">
              <View className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 items-center justify-center">
                <Check size={10} color="#818cf8" />
              </View>
              {((verifications && verifications.length > 0) || order.signatureUrl) && (
                <View className="w-px flex-1 bg-white/10 my-1" />
              )}
            </View>
            <View className="flex-1 pb-1">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-white text-xs font-bold">Đơn hàng được tạo</Text>
                <Text className="text-slate-500 text-[10px]">
                  {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text className="text-slate-400 text-xs">
                Khởi tạo lúc {new Date(order.createdAt).toLocaleDateString('vi-VN')}
              </Text>
            </View>
          </View>

          {/* Dynamic Verification Steps */}
          {verifications && verifications.map((ver, idx) => {
            const isLast = idx === verifications.length - 1 && !order.signatureUrl;
            const isPickupStep = ver.step === 'pickup';
            const isDeliveryStep = ver.step === 'delivery';
            const isAcceptStep = ver.step === 'accept';
            const isCheckpointStep = ver.step === 'checkpoint';
            
            let stepTitle = 'Xác thực';
            if (isAcceptStep) stepTitle = 'Chấp nhận đơn';
            else if (isPickupStep) stepTitle = 'Lấy hàng thành công';
            else if (isDeliveryStep) stepTitle = 'Giao hàng thành công';
            else if (isCheckpointStep) stepTitle = 'Mốc lộ trình';

            return (
              <View key={ver.id || idx} className="flex-row gap-4">
                <View className="items-center">
                  <View className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 items-center justify-center">
                    <Check size={10} color="#818cf8" />
                  </View>
                  {!isLast && (
                    <View className="w-px flex-1 bg-white/10 my-1" />
                  )}
                </View>

                <View className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-white text-xs font-bold">{stepTitle}</Text>
                    <Text className="text-slate-500 text-[10px]">
                      {new Date(ver.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>

                  {/* Fingerprint proof */}
                  {ver.fingerprintStatus && (
                    <View className="flex-row items-center gap-1 mb-2 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg self-start">
                      <Fingerprint size={10} color="#10b981" />
                      <Text className="text-emerald-400 text-[9px] font-bold uppercase">Vân tay đã xác minh</Text>
                    </View>
                  )}

                  {/* Photos Row */}
                  {(ver.facePhotoUrl || ver.cargoPhotoUrl) && (
                    <View className="flex-row gap-2 mt-1">
                      {ver.facePhotoUrl && (
                        <View className="flex-1">
                          <Text className="text-slate-500 text-[8px] font-bold uppercase mb-1">Face ID</Text>
                          <View className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-slate-950">
                            <Image 
                              source={{ uri: ver.facePhotoUrl }} 
                              className="w-full h-full"
                              resizeMode="cover"
                            />
                          </View>
                        </View>
                      )}

                      {ver.cargoPhotoUrl && (
                        <View className="flex-1">
                          <Text className="text-slate-500 text-[8px] font-bold uppercase mb-1">Ảnh hàng hóa</Text>
                          <View className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-slate-950">
                            <Image 
                              source={{ uri: ver.cargoPhotoUrl }} 
                              className="w-full h-full"
                              resizeMode="cover"
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {/* GPS Details */}
                  {ver.location && ver.location.coordinates && (
                    <View className="flex-row items-center gap-1.5 mt-2 bg-white/[0.03] p-1.5 rounded-lg border border-white/5">
                      <MapPin size={8} color="#a78bfa" />
                      <Text className="text-slate-400 text-[9px]" numberOfLines={1}>
                        GPS: {ver.location.coordinates[1].toFixed(5)}, {ver.location.coordinates[0].toFixed(5)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {/* Customer Signature block */}
          {order.signatureUrl && (
            <View className="flex-row gap-4">
              <View className="items-center">
                <View className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 items-center justify-center">
                  <UserCheck size={10} color="#10b981" />
                </View>
              </View>
              <View className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                <Text className="text-white text-xs font-bold mb-2">Chữ ký người nhận</Text>
                <View className="h-16 bg-slate-950/80 rounded-xl overflow-hidden items-center justify-center p-1 border border-white/10">
                  <Image 
                    source={{ uri: order.signatureUrl }} 
                    className="w-full h-full"
                    resizeMode="contain"
                  />
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};
