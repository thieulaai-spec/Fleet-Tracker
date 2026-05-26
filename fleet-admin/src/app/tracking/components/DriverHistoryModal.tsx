'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, MapPin, Calendar, Clock, X } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';

interface DriverHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverId: string;
  driverName: string;
}

export function DriverHistoryModal({
  isOpen,
  onClose,
  driverId,
  driverName,
}: DriverHistoryModalProps) {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && driverId) {
      setIsLoading(true);
      api.get<any[]>(`/drivers/${driverId}/verifications`)
        .then((data) => {
          setVerifications(data);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching driver verifications:', err);
          setIsLoading(false);
        });
    }
  }, [isOpen, driverId]);

  const getStepName = (step: string) => {
    switch (step) {
      case 'accept': return 'Khởi hành / Nhận chuyến';
      case 'pickup': return 'Đến lấy hàng';
      case 'checkpoint': return 'Chặng giữa đường';
      case 'delivery': return 'Hoàn thành / Bàn giao';
      default: return step;
    }
  };

  // Group verifications by Order ID
  const groupedVerifications = verifications.reduce((groups: Record<string, any[]>, v) => {
    const orderId = v.orderId;
    if (!groups[orderId]) {
      groups[orderId] = [];
    }
    groups[orderId].push(v);
    return groups;
  }, {});

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Lịch Sử Hành Trình Minh Chứng — ${driverName}`}
        size="lg"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 border-3 border-border border-t-primary rounded-full animate-spin" />
            <span className="text-text-dim text-xs">Đang tải lịch sử minh chứng...</span>
          </div>
        ) : verifications.length === 0 ? (
          <div className="text-center py-12 text-text-dim text-sm">
            Tài xế này chưa thực hiện chặng hành trình minh chứng nào.
          </div>
        ) : (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {Object.entries(groupedVerifications).map(([orderId, steps]: [string, any]) => {
              const sampleOrder = steps[0]?.order;
              return (
                <div
                  key={orderId}
                  className="bg-surface-low border border-border/80 rounded-2xl p-5 hover:border-primary/20 transition-all duration-300 shadow-sm"
                >
                  {/* Order summary */}
                  <div className="flex justify-between items-start border-b border-white/5 pb-3 mb-4">
                    <div>
                      <h4 className="text-sm font-black text-text tracking-tight m-0">
                        Đơn hàng: #{orderId.substring(0, 8)}
                      </h4>
                      <p className="text-[11px] text-text-dim m-0 mt-1">
                        Khách hàng: {sampleOrder?.customerName || 'Elite Fleet Client'}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-success/15 text-success px-2.5 py-0.5 rounded-full">
                      {sampleOrder?.status || 'Completed'}
                    </span>
                  </div>

                  {/* Verification milestones timeline */}
                  <div className="relative border-l-2 border-white/10 pl-5 ml-3 space-y-6">
                    {steps.map((v: any) => (
                      <div key={v.id} className="relative">
                        {/* Circle bullet */}
                        <div className="absolute left-[-27px] top-1 bg-primary w-3.5 h-3.5 rounded-full border-[3px] border-surface shadow-[0_0_8px_rgba(99,102,241,0.5)]" />

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-text-dim uppercase tracking-wider">
                              {getStepName(v.step)}
                            </span>
                            <span className="text-[10px] text-text-dim font-mono">
                              {format(new Date(v.createdAt), 'HH:mm - dd/MM/yyyy')}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg w-fit">
                            <ShieldCheck size={12} className="text-success" />
                            <span className="text-[9px] font-bold text-success uppercase tracking-wider">Đã xác thực vân tay</span>
                          </div>

                          {/* Coordinates */}
                          {v.location && (
                            <div className="flex items-center gap-1 text-[10px] text-text-dim mt-1">
                              <MapPin size={10} className="text-primary-light" />
                              <span>Tọa độ: {v.location.coordinates[1].toFixed(6)}, {v.location.coordinates[0].toFixed(6)}</span>
                            </div>
                          )}

                          {/* Photo previews */}
                          <div className="flex gap-4 mt-3">
                            {v.facePhotoUrl && (
                              <div className="flex flex-col gap-1 items-center">
                                <span className="text-[8px] text-text-dim uppercase font-bold tracking-wider">Ảnh chân dung (ESP32)</span>
                                <div
                                  onClick={() => setLightboxImage(v.facePhotoUrl)}
                                  className="w-20 h-20 rounded-xl border border-white/10 overflow-hidden cursor-pointer hover:border-primary transition-colors bg-black"
                                >
                                  <img src={v.facePhotoUrl} alt="ESP32 Face" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                                </div>
                              </div>
                            )}
                            {v.cargoPhotoUrl && (
                              <div className="flex flex-col gap-1 items-center">
                                <span className="text-[8px] text-text-dim uppercase font-bold tracking-wider">Ảnh hàng hóa (M.App)</span>
                                <div
                                  onClick={() => setLightboxImage(v.cargoPhotoUrl)}
                                  className="w-20 h-20 rounded-xl border border-white/10 overflow-hidden cursor-pointer hover:border-primary transition-colors bg-black"
                                >
                                  <img src={v.cargoPhotoUrl} alt="Cargo Proof" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* Lightbox / Full-screen Image viewer */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-2000 p-6 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all"
          >
            <X size={20} />
          </button>
          <img
            src={lightboxImage}
            alt="Full size proof"
            className="max-w-full max-h-[85vh] rounded-2xl border border-white/15 shadow-2xl object-contain animate-in zoom-in-95 duration-300"
          />
        </div>
      )}
    </>
  );
}
