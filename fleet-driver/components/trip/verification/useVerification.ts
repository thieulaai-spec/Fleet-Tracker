import { useState, useEffect, useRef } from 'react';
import { Animated, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import Toast from 'react-native-toast-message';

import { useAuthStore } from '../../../store/useAuthStore';
import { useTripStore } from '../../../store/useTripStore';
import { socketService } from '../../../lib/socket';
import { authFetch } from '../../../lib/authFetch';
import { OrderStatus } from '@/types/trip';

interface UseVerificationProps {
  visible: boolean;
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
  onClose: () => void;
}

export function useVerification({
  visible,
  orderId,
  step,
  onSubmit,
  onClose,
}: UseVerificationProps) {
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
  const [cargoPhotos, setCargoPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanIntervalRef = useRef<any>(null);

  const activeTrip = useTripStore((state) => state.activeTrip);
  const hasHardware = !!activeTrip?.vehicle?.deviceId || !!activeTrip?.driver?.fingerprintId || !!user?.driver?.fingerprintId;

  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      setFingerprintProgress(0);
      setIsScanning(false);
      setFacePhoto('');
      setCargoPhotos([]);
      progressAnim.setValue(0);
      setHasHardwareVerified(false);

      if ((step === 'pickup' || step === 'delivery') && hasHardware) {
        setIsWaitingHardware(true);
      } else {
        setIsWaitingHardware(false);
      }
    }
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [visible, step, hasHardware]);

  useEffect(() => {
    let pollingInterval: any = null;

    if (visible && isWaitingHardware && !hasHardwareVerified) {
      let transitioned = false;

      const triggerSuccessTransition = (photoUrl: string) => {
        if (transitioned) return;
        transitioned = true;

        setHasHardwareVerified(true);
        if (photoUrl) {
          setFacePhoto(photoUrl);
        }
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        fetchTrips();

        if (pollingInterval) {
          clearInterval(pollingInterval);
        }

        setTimeout(() => {
          setIsWaitingHardware(false);
          if (step === 'pickup' || step === 'delivery') {
            setCurrentStep(2); // Phone cargo camera capture
          } else {
            setCurrentStep(3); // Submit review screen
          }
        }, 1500);
      };

      // 1. Socket Listener
      const handleOrderVerified = (data: any) => {
        console.log('[VerificationModal] Socket order:verified received:', data);
        if (data.orderId === orderId && data.step === step) {
          triggerSuccessTransition(data.verification?.facePhotoUrl);
        }
      };
      socketService.on('order:verified', handleOrderVerified);

      // 2. High-reliability Polling Fallback (every 3 seconds)
      const checkVerificationStatus = async () => {
        try {
          const response = await authFetch(`/orders/${orderId}/verifications`);
          if (response && response.ok) {
            const result = await response.json();
            const verifications = Array.isArray(result) ? result : (result.data || []);
            const matchedVerify = verifications.find((v: any) => v.step === step);
            if (matchedVerify) {
              console.log('[VerificationModal] Polling detected verification in DB:', matchedVerify);
              triggerSuccessTransition(matchedVerify.facePhotoUrl);
            }
          }
        } catch (err) {
          console.log('[VerificationModal] Polling error:', err);
        }
      };

      // Run immediately and poll
      checkVerificationStatus();
      pollingInterval = setInterval(checkVerificationStatus, 3000);

      return () => {
        socketService.off('order:verified', handleOrderVerified);
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
      };
    }
  }, [visible, isWaitingHardware, hasHardwareVerified, orderId, step, fetchTrips]);

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
  }, [isScanning, isWaitingHardware, hasHardwareVerified, pulseAnim]);

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

  const captureCargoPhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // 1. Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Quyền Truy Cập Bị Từ Chối',
          text2: 'Vui lòng cấp quyền sử dụng camera để chụp ảnh hàng hóa.'
        });
        return;
      }

      // 2. Launch Camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploadingPhoto(true);

        // 3. Optimize image before uploading (resize & compress)
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 1024 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        // 4. Upload photo to backend
        const formData = new FormData();
        // @ts-ignore
        formData.append('file', {
          uri: manipulatedImage.uri,
          name: `cargo_${orderId}_${step}.jpg`,
          type: 'image/jpeg',
        });

        const response = await authFetch('/upload?folder=orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Tải ảnh lên thất bại');
        }

        const resData = await response.json();
        const url = resData.data?.url || resData.url;
        if (!url) {
          throw new Error('Server không trả về URL ảnh');
        }

        setCargoPhotos(prev => [...prev, url]);
        
        Toast.show({
          type: 'success',
          text1: 'Tải Lên Thành Công',
          text2: 'Đã lưu ảnh chụp hàng hóa thực tế.'
        });
      }
    } catch (err: any) {
      console.log('[captureCargoPhoto] error:', err);
      Toast.show({
        type: 'error',
        text1: 'Lỗi Chụp Ảnh',
        text2: err.message || 'Không thể chụp hoặc upload ảnh.'
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleNextCargoStep = () => {
    setCurrentStep(3);
  };

  const handleSkipCargoPhoto = () => {
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

      const cargoPhotoStr = cargoPhotos.join(',');

      if (hasHardwareVerified) {
        // If hardware biometrics were verified, update only the cargo photo URL via PATCH
        const updateCargoPhoto = useTripStore.getState().updateCargoPhoto;
        await updateCargoPhoto(orderId, step, cargoPhotoStr);
      } else {
        // Standard phone verification flow
        await onSubmit({
          step,
          fingerprintStatus: true,
          facePhotoUrl: facePhoto,
          cargoPhotoUrl: cargoPhotoStr || undefined,
          ...coords,
        });
      }

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

  return {
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
  };
}
