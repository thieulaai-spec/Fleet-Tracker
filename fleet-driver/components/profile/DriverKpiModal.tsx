import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { X, Navigation, Calendar, MapPin, Clock, AlertTriangle } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

interface DriverKpiModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeKpiDetail: 'trips' | 'completion' | 'violations' | 'score' | null;
  tripHistory: any[];
  kpi: any;
}

export const DriverKpiModal: React.FC<DriverKpiModalProps> = ({
  isOpen,
  onClose,
  activeKpiDetail,
  tripHistory,
  kpi,
}) => {
  if (!isOpen || !activeKpiDetail) return null;

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/80">
        <BlurView intensity={100} tint="light" className="bg-slate-900 rounded-t-[40px] p-8 border-t border-white/10 max-h-[80%]">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-2xl font-black text-white tracking-tight">
                {activeKpiDetail === 'trips' ? 'Trip Log' :
                 activeKpiDetail === 'completion' ? 'Completion Rate' :
                 activeKpiDetail === 'violations' ? 'Safety Violations' :
                 'Driver Score'}
              </Text>
              <Text className="text-slate-505 text-xs font-bold uppercase tracking-wider mt-1">
                {activeKpiDetail === 'trips' ? 'Trip history summary' :
                 activeKpiDetail === 'completion' ? 'Delivery performance' :
                 activeKpiDetail === 'violations' ? 'Incident & alerts report' :
                 'Overall performance rating'}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={onClose}
              className="bg-white/5 p-2.5 rounded-full border border-white/5"
            >
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Scrollable details */}
          <ScrollView className="mt-2" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {(() => {
              if (activeKpiDetail === 'trips') {
                const tripsList = tripHistory || [];
                if (tripsList.length === 0) {
                  return (
                    <View className="py-10 items-center">
                      <Navigation size={48} color="#94a3b8" opacity={0.3} />
                      <Text className="text-slate-400 text-sm mt-4">No trips completed yet</Text>
                    </View>
                  );
                }

                return (
                  <View className="gap-4">
                    {tripsList.map((trip: any, idx: number) => (
                      <View key={trip.id || idx} className="bg-slate-950 p-5 rounded-2xl border border-white/5">
                        <View className="flex-row justify-between items-center mb-3">
                          <View className="flex-row items-center gap-2">
                            <Calendar size={14} color="#6366f1" />
                            <Text className="text-white font-bold text-sm">
                              {trip.startedAt ? new Date(trip.startedAt).toLocaleDateString() : 'N/A'}
                            </Text>
                          </View>
                          <View className={`px-2 py-0.5 rounded-lg ${
                            trip.status === 'completed' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                            trip.status === 'in_progress' ? 'bg-blue-500/10 border border-blue-500/20' :
                            'bg-amber-500/10 border border-amber-500/20'
                          }`}>
                            <Text className={`text-[10px] font-black uppercase ${
                              trip.status === 'completed' ? 'text-emerald-500' :
                              trip.status === 'in_progress' ? 'text-blue-500' :
                              'text-amber-500'
                            }`}>{trip.status}</Text>
                          </View>
                        </View>
                        <View className="flex-row items-center gap-2 mb-2">
                          <MapPin size={14} color="#94a3b8" />
                          <Text className="text-slate-400 text-xs flex-1" numberOfLines={1}>
                            Vehicle: {trip.vehicle?.plateNumber || 'N/A'}
                          </Text>
                        </View>
                        <View className="flex-row justify-between items-center border-t border-white/5 pt-3 mt-1">
                          <View className="flex-row items-center gap-1">
                            <Clock size={12} color="#475569" />
                            <Text className="text-slate-505 text-[10px] font-bold">
                              {trip.startedAt ? new Date(trip.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              {trip.completedAt ? ` - ${new Date(trip.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                            </Text>
                          </View>
                          <Text className="text-white text-xs font-bold">{trip.totalDistanceKm || 0} km</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                );
              }

              if (activeKpiDetail === 'completion') {
                const completed = kpi?.completedTrips ?? 0;
                const total = kpi?.totalTrips ?? 0;
                const rate = kpi?.completionRate != null ? Number(kpi.completionRate).toFixed(0) : '0';

                return (
                  <View className="items-center py-4">
                    <View className="w-32 h-32 rounded-full border-8 border-emerald-500/20 justify-center items-center mb-6">
                      <Text className="text-4xl font-black text-white">{rate}%</Text>
                      <Text className="text-slate-550 text-[10px] font-black uppercase tracking-wider mt-1">Rate</Text>
                    </View>
                    
                    <View className="w-full bg-slate-950 p-6 rounded-3xl border border-white/5 mb-6">
                      <View className="flex-row justify-between mb-2">
                        <Text className="text-slate-400 text-sm font-bold">Completed Trips</Text>
                        <Text className="text-white text-sm font-black">{completed}</Text>
                      </View>
                      <View className="flex-row justify-between mb-4">
                        <Text className="text-slate-400 text-sm font-bold">Total Assigned</Text>
                        <Text className="text-white text-sm font-black">{total}</Text>
                      </View>
                      
                      {/* Progress Bar */}
                      <View className="w-full h-3 bg-slate-900 rounded-full overflow-hidden">
                        <View 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{ width: `${Math.min(100, Number(rate))}%` }}
                        />
                      </View>
                    </View>

                    <Text className="text-slate-400 text-sm text-center leading-5 px-4">
                      Tỷ lệ hoàn thành được tính bằng số chuyến đi thành công trên tổng số chuyến được giao. Duy trì tỷ lệ trên 95% để đạt danh hiệu tài xế xuất sắc.
                    </Text>
                  </View>
                );
              }

              if (activeKpiDetail === 'violations') {
                const speed = kpi?.speedViolations ?? 0;
                const route = kpi?.routeViolations ?? 0;
                const total = kpi?.totalViolations ?? 0;

                return (
                  <View className="py-4">
                    <View className="items-center mb-6">
                      <View className="w-20 h-20 bg-red-500/10 rounded-3xl justify-center items-center mb-4 border border-red-500/20">
                        <AlertTriangle size={36} color="#ef4444" />
                      </View>
                      <Text className="text-3xl font-black text-white">{total}</Text>
                      <Text className="text-slate-505 text-xs font-black uppercase tracking-wider mt-1">Total Infractions</Text>
                    </View>

                    <View className="bg-slate-950 p-6 rounded-3xl border border-white/5 mb-6 gap-4">
                      <View className="flex-row justify-between items-center pb-3 border-b border-white/5">
                        <View>
                          <Text className="text-white font-bold text-sm">Vượt quá tốc độ</Text>
                          <Text className="text-slate-500 text-xs mt-0.5">Speed Violations</Text>
                        </View>
                        <Text className="text-red-500 text-lg font-black">{speed}</Text>
                      </View>
                      <View className="flex-row justify-between items-center pt-1">
                        <View>
                          <Text className="text-white font-bold text-sm">Lệch lộ trình</Text>
                          <Text className="text-slate-505 text-xs mt-0.5">Route Deviation</Text>
                        </View>
                        <Text className="text-red-500 text-lg font-black">{route}</Text>
                      </View>
                    </View>

                    <Text className="text-slate-400 text-sm text-center leading-5 px-4">
                      Mỗi lỗi vi phạm sẽ trực tiếp ảnh hưởng đến Điểm đánh giá (KPI Score) của bạn. Hãy lái xe an toàn và bám sát lộ trình được hoạch định.
                    </Text>
                  </View>
                );
              }

              if (activeKpiDetail === 'score') {
                const score = kpi?.kpiScore != null ? Number(kpi.kpiScore).toFixed(1) : '100.0';
                const numericScore = Number(score);
                
                let rating = 'Xuất sắc';
                let ratingColor = 'text-emerald-500';
                if (numericScore < 70) {
                  rating = 'Cần cải thiện';
                  ratingColor = 'text-red-500';
                } else if (numericScore < 85) {
                  rating = 'Trung bình';
                  ratingColor = 'text-amber-500';
                } else if (numericScore < 95) {
                  rating = 'Khá tốt';
                  ratingColor = 'text-indigo-500';
                }

                return (
                  <View className="items-center py-4">
                    <View className="w-32 h-32 rounded-full border-8 border-yellow-500/20 justify-center items-center mb-6">
                      <Text className="text-4xl font-black text-white">{score}</Text>
                      <Text className="text-slate-550 text-[10px] font-black uppercase tracking-wider mt-1">Score</Text>
                    </View>

                    <Text className={`text-xl font-black ${ratingColor} mb-6 uppercase tracking-wider`}>
                      {rating}
                    </Text>

                    <View className="w-full bg-slate-950 p-6 rounded-3xl border border-white/5 mb-6 gap-3">
                      <Text className="text-white font-black text-xs uppercase tracking-wider mb-2">Quy tắc tính điểm</Text>
                      <View className="flex-row justify-between">
                        <Text className="text-slate-400 text-sm">Điểm xuất phát mặc định</Text>
                        <Text className="text-white text-sm font-bold">100</Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-slate-400 text-sm">Mỗi lỗi quá tốc độ</Text>
                        <Text className="text-red-500 text-sm font-bold">-5 điểm</Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-slate-400 text-sm">Mỗi lỗi lệch tuyến đường</Text>
                        <Text className="text-red-500 text-sm font-bold">-8 điểm</Text>
                      </View>
                    </View>

                    <Text className="text-slate-400 text-sm text-center leading-5 px-4">
                      Điểm số của bạn được đồng bộ tự động theo thời gian thực. Điểm số cao giúp tăng cơ hội nhận các đơn hàng có giá trị cao.
                    </Text>
                  </View>
                );
              }

              return null;
            })()}
          </ScrollView>
        </BlurView>
      </View>
    </Modal>
  );
};
