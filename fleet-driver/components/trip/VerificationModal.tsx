import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { X, Cpu, Smartphone, CheckCircle2 } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useTripStore } from '../../store/useTripStore';
import { socketService } from '../../lib/socket';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';

import { StepperProgress } from './verification/StepperProgress';
import { FingerprintStep } from './verification/FingerprintStep';
import { FaceCaptureStep } from './verification/FaceCaptureStep';
import { CargoCaptureStep } from './verification/CargoCaptureStep';
import { SubmitProofStep } from './verification/SubmitProofStep';

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
  const { user } = useAuthStore();
  const fetchTrips = useTripStore((state) => state.fetchTrips);

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fingerprintProgress, setFingerprintProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [isWaitingHardware, setIsWaitingHardware] = useState(false);
  const [hasHardwareVerified, setHasHardwareVerified] = useState(false);
  
  // Mock proof data
  const [facePhoto, setFacePhoto] = useState<string>('');
  const [cargoPhoto, setCargoPhoto] = useState<string>('');

  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanIntervalRef = useRef<any>(null);

  const hasHardware = !!user?.driver?.fingerprintId;

  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      setFingerprintProgress(0);
      setIsScanning(false);
      setFacePhoto('');
      setCargoPhoto('');
      progressAnim.setValue(0);

      if (hasHardware && step === 'pickup') {
        setIsWaitingHardware(true);
        setHasHardwareVerified(false);
      } else {
        setIsWaitingHardware(false);
        setHasHardwareVerified(false);
      }
    }
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [visible, hasHardware, step]);

  useEffect(() => {
    if (visible && isWaitingHardware && !hasHardwareVerified) {
      const handleOrderVerified = (data: any) => {
        console.log('[VerificationModal] Socket order:verified received:', data);
        if (data.orderId === orderId && data.step === 'pickup') {
          setHasHardwareVerified(true);
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          fetchTrips();
          setTimeout(() => {
            onClose();
          }, 2500);
        }
      };

      socketService.on('order:verified', handleOrderVerified);
      return () => {
        socketService.off('order:verified', handleOrderVerified);
      };
    }
  }, [visible, isWaitingHardware, hasHardwareVerified, orderId, fetchTrips, onClose]);

  // Fingerprint & hardware pulse animation
  const loopAnimRef = useRef<any>(null);

  useEffect(() => {
    if (isScanning || (isWaitingHardware && !hasHardwareVerified)) {
      loopAnimRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      loopAnimRef.current.start();
    } else {
      if (loopAnimRef.current) {
        loopAnimRef.current.stop();
      }
      pulseAnim.setValue(1);
    }
    return () => {
      if (loopAnimRef.current) {
        loopAnimRef.current.stop();
      }
    };
  }, [isScanning, isWaitingHardware, hasHardwareVerified]);

  const handleFingerprintPressIn = () => {
    setIsScanning(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    let progress = 0;
    scanIntervalRef.current = setInterval(() => {
      progress += 5;
      setFingerprintProgress(progress);
      progressAnim.setValue(progress / 100);

      if (Platform.OS !== 'web' && progress % 20 === 0) {
        Haptics.selectionAsync();
      }

      if (progress >= 100) {
        clearInterval(scanIntervalRef.current);
        setIsScanning(false);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        // Mock a face photo URL
        setFacePhoto('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80');
        
        // Move to step 1 (ESP32-Cam Capture View)
        setTimeout(() => {
          setCurrentStep(1);
        }, 500);
      }
    }, 100);
  };

  const handleFingerprintPressOut = () => {
    if (fingerprintProgress < 100) {
      clearInterval(scanIntervalRef.current);
      setIsScanning(false);
      setFingerprintProgress(0);
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const captureCargoPhoto = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Mock cargo photo URL
    setCargoPhoto('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=500&q=80');
    
    // Automatically advance or show preview
    setTimeout(() => {
      setCurrentStep(3); // Success/Review state
    }, 500);
  };

  const handleSkipCargoPhoto = () => {
    // Skip optional cargo photo and go to review screen
    setCurrentStep(3);
  };

  const handleSubmitProof = async () => {
    setIsSubmitting(true);
    try {
      let coords: any = {};
      try {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      } catch (e) {
        console.log('Location fetch failed:', e);
      }

      await onSubmit({
        step,
        fingerprintStatus: true,
        facePhotoUrl: facePhoto,
        cargoPhotoUrl: cargoPhoto || undefined,
        ...coords,
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onClose();
    } catch (err) {
      console.log('Error submitting proof:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <BlurView intensity={90} tint="dark" className="flex-1 justify-end">
          <View className="bg-[#0b1329] rounded-t-[44px] border-t border-white/10 p-8 shadow-2xl overflow-hidden min-h-[60%]">
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
                <View className="items-center justify-center py-8 px-4 w-full">
                  {hasHardwareVerified ? (
                    // Success View
                    <View className="items-center w-full">
                      <Animated.View className="bg-emerald-500/20 p-6 rounded-full border border-emerald-500/30 mb-6">
                        <CheckCircle2 size={64} color="#10b981" />
                      </Animated.View>
                      <Text className="text-white text-xl font-bold text-center mb-2">
                        Xác Thực Thành Công!
                      </Text>
                      <Text className="text-slate-400 text-sm text-center px-4">
                        Thiết bị trên xe đã xác nhận vân tay & khuôn mặt. Chuyến đi của bạn đang được cập nhật...
                      </Text>
                    </View>
                  ) : (
                    // Waiting View
                    <View className="items-center w-full">
                      <View className="relative w-32 h-32 items-center justify-center mb-6">
                        <Animated.View 
                          className="absolute inset-0 bg-indigo-500/10 rounded-full border border-indigo-500/30"
                          style={{
                            transform: [{ scale: pulseAnim }],
                          }}
                        />
                        <View className="bg-indigo-950/80 p-6 rounded-full border border-indigo-500/50">
                          <Cpu size={48} color="#6366f1" />
                        </View>
                      </View>
                      
                      <Text className="text-white text-lg font-bold text-center mb-2">
                        Đang đợi thiết bị trên xe xác thực...
                      </Text>
                      
                      <Text className="text-slate-400 text-sm text-center mb-8 px-6 font-medium leading-relaxed">
                        Vui lòng đặt vân tay lên đầu đọc AS608 và nhìn thẳng vào Camera trên xe để hoàn tất.
                      </Text>

                      <View className="w-full h-[1px] bg-white/5 my-4" />

                      <TouchableOpacity
                        onPress={() => setIsWaitingHardware(false)}
                        className="flex-row items-center justify-center bg-white/5 py-3.5 px-6 rounded-2xl border border-white/10 w-full"
                      >
                        <Smartphone size={16} color="#94a3b8" />
                        <Text className="text-slate-300 font-semibold text-sm ml-2">
                          Sử dụng camera & vân tay điện thoại
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
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
                    <CargoCaptureStep
                      cargoPhoto={cargoPhoto}
                      onCapture={captureCargoPhoto}
                      onSkip={handleSkipCargoPhoto}
                    />
                  )}

                  {/* STEP 3: SUBMIT REVIEW SCREEN */}
                  {currentStep === 3 && (
                    <SubmitProofStep
                      step={step}
                      facePhoto={facePhoto}
                      cargoPhoto={cargoPhoto}
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
