'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Activity, Navigation, Clock, User, CheckCircle2, ShieldCheck, Camera, X } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { VehiclePosition } from '../types';
import { api } from '@/lib/api';
import { DriverHistoryModal } from './DriverHistoryModal'; 

interface VehicleDetailProps {
  vehicle: VehiclePosition | null;
  onClose: () => void;
}

export function VehicleDetail({ vehicle, onClose }: VehicleDetailProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'journey'>('info');
  const [verifications, setVerifications] = useState<any[]>([]);
  const [activeTrip, setActiveTrip] = useState<any | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    if (vehicle?.currentTripId) {
      // Fetch details and verifications
      api.get<any>(`/trips/${vehicle.currentTripId}`)
        .then(trip => setActiveTrip(trip))
        .catch(err => console.error('Error fetching active trip:', err));

      api.get<any[]>(`/trips/${vehicle.currentTripId}/verifications`)
        .then(data => setVerifications(data))
        .catch(err => console.error('Error fetching verifications:', err));
    } else {
      setActiveTrip(null);
      setVerifications([]);
    }
    setActiveTab('info');
  }, [vehicle?.currentTripId]);

  if (!vehicle) return null;

  const getStepName = (step: string) => {
    switch (step) {
      case 'accept': return 'Khởi hành';
      case 'pickup': return 'Nhận hàng';
      case 'checkpoint': return 'Chặng giữa';
      case 'delivery': return 'Bàn giao';
      default: return step;
    }
  };

  return (
    <>
      <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-[360px] bg-surface/95 backdrop-blur-xl rounded-2xl border border-white/10 p-5 border-t-4 border-t-primary shadow-[0_20px_50px_rgba(0,0,0,0.4)] animate-in slide-in-from-bottom-5 duration-300 z-20 max-h-[85vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[11px] font-bold text-text-dim m-0 uppercase tracking-[0.2em]">
            Chi tiết phương tiện
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-text-dim transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Vehicle Identity */}
        <div className="flex items-center gap-4 mb-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
              vehicle.status === "active"
                ? "bg-success/20 text-success"
                : vehicle.status === "idle"
                  ? "bg-warning/20 text-warning"
                  : "bg-text-dim/20 text-text-dim"
            }`}
          >
            <Truck size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-black text-text leading-tight tracking-tight truncate">
              {vehicle.licensePlate}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  vehicle.status === "active"
                    ? "bg-success animate-pulse"
                    : vehicle.status === "idle"
                      ? "bg-warning"
                      : "bg-text-dim"
                }`}
              />
              <span className="text-[10px] font-bold text-text-dim uppercase">
                {vehicle.status === 'active' ? 'Đang chạy' : vehicle.status === 'idle' ? 'Đang chờ' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs Selector */}
        <div className="flex border-b border-white/5 mb-4">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'info' ? 'text-primary border-b-2 border-primary' : 'text-text-dim hover:text-text'
            }`}
          >
            Thông tin
          </button>
          <button
            onClick={() => setActiveTab('journey')}
            className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'journey' ? 'text-primary border-b-2 border-primary' : 'text-text-dim hover:text-text'
            }`}
          >
            Hành trình minh chứng
          </button>
        </div>

        {/* TAB 1: INFO */}
        {activeTab === 'info' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-2">
              <DetailItem
                label="Tài xế"
                value={vehicle.driverName}
                icon={<User size={14} />}
              />
              <DetailItem
                label="Tốc độ"
                value={`${vehicle.speed.toFixed(0)} km/h`}
                icon={<Navigation size={14} />}
              />
              <DetailItem
                label="Cập nhật"
                value={formatDistanceToNow(new Date(vehicle.lastUpdate), { addSuffix: true, locale: vi })}
                icon={<Clock size={14} />}
              />
            </div>

            {/* Currently Running Order Details */}
            {activeTrip && activeTrip.tripOrders && activeTrip.tripOrders.length > 0 && (
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mt-1">
                <TextHeader title="ĐƠN HÀNG ĐANG CHẠY" />
                {activeTrip.tripOrders.map((to: any) => {
                  const order = to.order;
                  if (!order || order.status === 'delivered') return null;
                  return (
                    <div key={order.id} className="mt-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-mono text-primary-light">Mã đơn: #{order.id.substring(0, 8)}</span>
                        <span className="text-[10px] uppercase font-bold text-success bg-success/15 px-2 py-0.5 rounded-full">{order.status}</span>
                      </div>
                      <div className="text-[12px] text-text">
                        <p className="m-0 text-text-dim text-[10px] uppercase font-bold tracking-wider">Điểm lấy hàng</p>
                        <p className="m-0 mt-0.5 font-medium truncate">{order.pickupAddress}</p>
                      </div>
                      <div className="text-[12px] text-text mt-2">
                        <p className="m-0 text-text-dim text-[10px] uppercase font-bold tracking-wider">Điểm giao hàng</p>
                        <p className="m-0 mt-0.5 font-medium truncate">{order.deliveryAddress}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-2">
              <button 
                onClick={() => setIsHistoryOpen(true)}
                className="flex-1 bg-primary text-white text-[11px] font-bold py-2.5 rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
              >
                Lịch sử hành trình
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: JOURNEY PROOF TIMELINE */}
        {activeTab === 'journey' && (
          <div className="flex flex-col gap-4 max-h-[40vh] overflow-y-auto pr-1">
            {!vehicle.currentTripId ? (
              <div className="text-center py-8 text-text-dim text-xs">
                Không có hành trình nào đang chạy cho xe này.
              </div>
            ) : verifications.length === 0 ? (
              <div className="text-center py-8 text-text-dim text-xs">
                Đang chờ tài xế xác thực sinh trắc chặng...
              </div>
            ) : (
              <div className="relative border-l-2 border-white/10 pl-5 ml-3 space-y-6">
                {verifications.map((v) => (
                  <div key={v.id} className="relative">
                    {/* Circle Indicator */}
                    <div className="absolute left-[-27px] top-1 bg-emerald-500 w-3.5 h-3.5 rounded-full border-[3px] border-surface shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-text-dim uppercase tracking-wider">
                          Chặng: {getStepName(v.step)}
                        </span>
                        <span className="text-[10px] text-text-dim">
                          {format(new Date(v.createdAt), 'HH:mm dd/MM')}
                        </span>
                      </div>
                      
                      {/* Biometric Scan Status */}
                      <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg w-fit mt-1">
                        <ShieldCheck size={12} className="text-success animate-pulse" />
                        <span className="text-[9px] font-bold text-success uppercase tracking-wider">Đã xác thực vân tay</span>
                      </div>

                      {/* Photo proofs */}
                      <div className="flex gap-3 mt-3">
                        {v.facePhotoUrl && (
                          <div className="flex flex-col gap-1 items-center">
                            <span className="text-[8px] text-text-dim uppercase font-bold">Chân dung (ESP32)</span>
                            <TouchableOpacity
                              onClick={() => setLightboxImage(v.facePhotoUrl)}
                              className="w-16 h-16 rounded-xl border border-white/10 overflow-hidden cursor-pointer hover:border-primary transition-colors"
                            >
                              <img src={v.facePhotoUrl} alt="ESP32 face" className="w-full h-full object-cover" />
                            </TouchableOpacity>
                          </div>
                        )}
                        {v.cargoPhotoUrl && (
                          <div className="flex flex-col gap-1 items-center">
                            <span className="text-[8px] text-text-dim uppercase font-bold">Hàng hóa (M.App)</span>
                            <TouchableOpacity
                              onClick={() => setLightboxImage(v.cargoPhotoUrl)}
                              className="w-16 h-16 rounded-xl border border-white/10 overflow-hidden cursor-pointer hover:border-primary transition-colors"
                            >
                              <img src={v.cargoPhotoUrl} alt="Cargo proof" className="w-full h-full object-cover" />
                            </TouchableOpacity>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox / Full-screen Image viewer */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-6 backdrop-blur-md animate-in fade-in duration-300"
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

      {/* Driver History Modal */}
      <DriverHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        driverId={vehicle.driverId}
        driverName={vehicle.driverName}
      />
    </>
  );
}

function DetailItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-surface-low rounded-xl border border-white/5 transition-colors hover:bg-surface-high">
      <div className="flex items-center gap-2 text-text-dim">
        <span className="text-primary-light/50">{icon}</span>
        <span className="text-[11px] font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span className="text-xs font-bold text-text">
        {value}
      </span>
    </div>
  );
}

function TextHeader({ title }: { title: string }) {
  return (
    <div className="border-l-2 border-primary pl-2 mb-2">
      <span className="text-[10px] font-black uppercase text-text-dim tracking-widest">{title}</span>
    </div>
  );
}

// Inline simulated TouchableOpacity to make react-native compatibility simple in NextJS
function TouchableOpacity({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button 
      onClick={onClick} 
      className={`text-left border-0 bg-transparent p-0 cursor-pointer block w-full focus:outline-none ${className || ''}`}
      style={{ fontFamily: 'inherit' }}
    >
      {children}
    </button>
  );
}
