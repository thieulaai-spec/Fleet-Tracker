import React from 'react';
import {
  Modal,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

import { StepperProgress } from './verification/StepperProgress';
import { FingerprintStep } from './verification/FingerprintStep';
import { FaceCaptureStep } from './verification/FaceCaptureStep';
import { CargoCaptureStep } from './verification/CargoCaptureStep';
import { SubmitProofStep } from './verification/SubmitProofStep';
import { HardwareStep } from './verification/HardwareStep';
import { useVerification } from './verification/useVerification';

interface VerificationModalProps {
  visible: boolean;
  onClose: () => void;
  orderId: string;
  step: 'accept' | 'pickup' | 'checkpoint' | 'delivery';
  onSubmit: (verificationData: {
    step: string;
    fingerprintStatus: boolean;
    facePhotoUrl: string;
    cargoPhotoUrl?: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<void>;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  visible,
  onClose,
  orderId,
  step,
  onSubmit,
}) => {
  const {
    currentStep,
    setCurrentStep,
    isSubmitting,
    fingerprintProgress,
    isScanning,
    isWaitingHardware,
    hasHardwareVerified,
    facePhoto,
    cargoPhotos,
    isUploadingPhoto,
    pulseAnim,
    handleFingerprintPressIn,
    handleFingerprintPressOut,
    captureCargoPhoto,
    setCargoPhotos,
    handleNextCargoStep,
    handleSkipCargoPhoto,
    handleSubmitProof,
  } = useVerification({
    visible,
    orderId,
    step,
    onSubmit,
    onClose,
  });

  const getStepTitle = () => {
    switch (step) {
      case 'accept': return 'Xác Thực Nhận Chuyến';
      case 'pickup': return 'Minh Chứng Lấy Hàng';
      case 'checkpoint': return 'Ghi Nhận Chặng Đang Giao';
      case 'delivery': return 'Minh Chứng Bàn Giao Hàng';
      default: return 'Xác Thực Hành Trình';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => !isSubmitting && onClose()}
    >
      <View className="flex-1">
        <View className="absolute inset-0 bg-black/70" />
        <BlurView intensity={90} tint="light" className="flex-1 justify-end" style={{ backgroundColor: 'rgba(15, 23, 42, 0.3)' }}>
          <View className="bg-slate-950 rounded-t-[44px] border-t border-slate-700 p-8 shadow-2xl overflow-hidden min-h-[60%]">
            <View className="absolute -top-32 -left-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
            
            {/* Header */}
            <View className="flex-row items-center justify-between mb-8">
              <View>
                <Text className="text-white text-2xl font-black">{getStepTitle()}</Text>
                <Text className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest mt-1">Đơn Hàng: #{orderId.substring(0, 8)}</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                disabled={isSubmitting}
                className="bg-white/5 w-10 h-10 rounded-full items-center justify-center border border-white/10"
              >
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Stepper Progress */}
            {!isWaitingHardware && <StepperProgress currentStep={currentStep} step={step} />}

            {/* Step Content */}
            <View className="flex-1 justify-center items-center py-6 w-full">
              
              {isWaitingHardware ? (
                <HardwareStep
                  hasHardwareVerified={hasHardwareVerified}
                  pulseAnim={pulseAnim}
                />
              ) : (
                <>
                  {/* STEP 0: FINGERPRINT SCAN */}
                  {currentStep === 0 && (
                    <FingerprintStep
                      isScanning={isScanning}
                      fingerprintProgress={fingerprintProgress}
                      pulseAnim={pulseAnim}
                      onPressIn={handleFingerprintPressIn}
                      onPressOut={handleFingerprintPressOut}
                    />
                  )}

                  {/* STEP 1: ESP32-CAM PORTRAIT SUCCESS */}
                  {currentStep === 1 && (
                    <FaceCaptureStep
                      facePhoto={facePhoto}
                      onNext={() => step === 'accept' ? setCurrentStep(3) : setCurrentStep(2)}
                    />
                  )}

                  {/* STEP 2: PHONE CARGO CAMERA */}
                  {currentStep === 2 && (
                    isUploadingPhoto ? (
                      <View className="items-center justify-center py-12">
                        <ActivityIndicator size="large" color="#6366f1" />
                        <Text className="text-slate-400 text-sm font-bold mt-4">
                          Đang tải lên ảnh hàng hóa...
                        </Text>
                      </View>
                    ) : (
                      <CargoCaptureStep
                        cargoPhotos={cargoPhotos}
                        onCapture={captureCargoPhoto}
                        onRemove={(index) => setCargoPhotos(prev => prev.filter((_, i) => i !== index))}
                        onNext={handleNextCargoStep}
                        onSkip={handleSkipCargoPhoto}
                      />
                    )
                  )}

                  {/* STEP 3: SUBMIT REVIEW SCREEN */}
                  {currentStep === 3 && (
                    <SubmitProofStep
                      step={step}
                      facePhoto={facePhoto}
                      cargoPhotos={cargoPhotos}
                      isSubmitting={isSubmitting}
                      onSubmit={handleSubmitProof}
                    />
                  )}
                </>
              )}

            </View>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
};
