import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { AlertTriangle, ShieldCheck, Navigation } from 'lucide-react-native';
import { Vehicle } from '../../../store/useFleetStore';

interface VehicleJourneyTimelineProps {
  vehicle: Vehicle;
  verifications: any[];
  verificationsLoading: boolean;
  onImagePress: (imageUrl: string) => void;
}

export const VehicleJourneyTimeline: React.FC<VehicleJourneyTimelineProps> = ({
  vehicle,
  verifications,
  verificationsLoading,
  onImagePress,
}) => {
  if (verificationsLoading) {
    return <ActivityIndicator size="large" color="#10b981" className="py-12" />;
  }

  if (!(vehicle as any)?.currentTripId) {
    return (
      <View className="bg-slate-800 rounded-[24px] p-8 border border-white/10 items-center justify-center">
        <AlertTriangle size={32} color="#64748b" className="mb-3" />
        <Text className="text-slate-400 text-sm font-semibold text-center">Xe này hiện không chạy trong hành trình nào.</Text>
      </View>
    );
  }

  if (verifications.length === 0) {
    return (
      <View className="bg-slate-800 rounded-[24px] p-8 border border-white/10 items-center justify-center">
        <ActivityIndicator size="small" color="#10b981" className="mb-3" />
        <Text className="text-slate-400 text-sm font-semibold text-center">Đang chờ tài xế xác thực các chặng hành trình...</Text>
      </View>
    );
  }

  // Group verifications by Order ID
  const grouped: Record<string, any[]> = verifications.reduce((groups: any, v: any) => {
    const oId = v.orderId || 'unknown';
    if (!groups[oId]) groups[oId] = [];
    groups[oId].push(v);
    return groups;
  }, {});

  return (
    <View className="bg-slate-800 rounded-[24px] p-5 border border-white/10">
      <Text className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-6">Hành Trình Hiện Tại</Text>
      
      {Object.entries(grouped).map(([orderId, steps]: [string, any]) => {
        const sampleOrder = steps[0]?.order;
        return (
          <View key={orderId} className="mb-8 bg-slate-900/40 p-4 rounded-2xl border border-white/5">
            <View className="flex-row justify-between items-center border-b border-white/5 pb-2 mb-4">
              <View className="flex-1 mr-2">
                <Text className="text-xs font-black text-slate-300">Đơn hàng: #{orderId.substring(0, 8).toUpperCase()}</Text>
                <Text className="text-[10px] text-slate-500 mt-1" numberOfLines={1}>Khách hàng: {sampleOrder?.customerName || 'Elite Fleet Client'}</Text>
              </View>
              <View className="bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <Text className="text-[9px] font-bold text-emerald-400 uppercase">{sampleOrder?.status || 'COMPLETED'}</Text>
              </View>
            </View>

            {/* Steps Timeline */}
            <View className="border-l border-white/10 pl-5 ml-2 gap-y-6">
              {steps.map((v: any) => {
                const stepNames: Record<string, string> = {
                  accept: 'Khởi hành / Nhận chuyến',
                  pickup: 'Đến lấy hàng',
                  checkpoint: 'Chặng giữa đường',
                  delivery: 'Hoàn thành / Bàn giao'
                };
                return (
                  <View key={v.id} className="relative">
                    {/* Timeline Node dot */}
                    <View className="absolute -left-[26px] top-1.5 w-3 h-3 rounded-full bg-emerald-500 border border-slate-800 shadow shadow-emerald-500/50" />
                    
                    <View className="gap-y-1">
                      <View className="flex-row justify-between items-center">
                        <Text className="text-xs font-black text-slate-300 uppercase tracking-wide">{stepNames[v.step] || v.step}</Text>
                        <Text className="text-[9px] text-slate-500 font-mono">
                          {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg w-fit mt-1">
                        <ShieldCheck size={12} color="#10b981" />
                        <Text className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Đã xác thực vân tay</Text>
                      </View>

                      {v.location && (
                        <View className="flex-row items-center gap-1 mt-1">
                          <Navigation size={10} color="#10b981" />
                          <Text className="text-[10px] text-slate-500">Tọa độ: {v.location.coordinates[1].toFixed(6)}, {v.location.coordinates[0].toFixed(6)}</Text>
                        </View>
                      )}

                      {/* Photos Row */}
                      <View className="flex-row gap-4 mt-2">
                        {v.facePhotoUrl && (
                          <View className="items-center gap-1">
                            <Text className="text-[8px] text-slate-500 uppercase font-black tracking-wider">Chân dung (ESP32)</Text>
                            <TouchableOpacity 
                              onPress={() => onImagePress(v.facePhotoUrl)}
                              className="w-16 h-16 rounded-xl border border-white/10 overflow-hidden bg-slate-950"
                            >
                              <Image source={{ uri: v.facePhotoUrl }} className="w-full h-full" resizeMode="cover" />
                            </TouchableOpacity>
                          </View>
                        )}
                        {(() => {
                          const cargoPhotos = v.cargoPhotoUrl ? v.cargoPhotoUrl.split(',').filter(Boolean) : [];
                          return cargoPhotos.map((photoUrl: string, pIdx: number) => (
                            <View key={pIdx} className="items-center gap-1">
                              <Text className="text-[8px] text-slate-500 uppercase font-black tracking-wider">
                                {cargoPhotos.length > 1 ? `Hàng hóa #${pIdx + 1}` : 'Hàng hóa (M.App)'}
                              </Text>
                              <TouchableOpacity 
                                onPress={() => onImagePress(photoUrl)}
                                className="w-16 h-16 rounded-xl border border-white/10 overflow-hidden bg-slate-950"
                              >
                                <Image source={{ uri: photoUrl }} className="w-full h-full" resizeMode="cover" />
                              </TouchableOpacity>
                            </View>
                          ));
                        })()}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
};
