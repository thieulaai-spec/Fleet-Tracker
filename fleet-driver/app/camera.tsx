import React, { useState, useRef } from 'react';
import { Text, View, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Camera, Check, RefreshCw } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { authFetch } from '@/lib/authFetch';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const { orderId } = useLocalSearchParams();

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-black justify-center items-center px-10">
        <Text className="text-center pb-5 text-white text-base">We need your permission to show the camera</Text>
        <TouchableOpacity 
          onPress={requestPermission} 
          className="bg-indigo-500 px-8 py-4 rounded-xl"
        >
          <Text className="text-white font-bold text-lg">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current && isCameraReady) {
      try {
        const result = await cameraRef.current.takePictureAsync();
        if (result) {
          setPhoto(result.uri);
        }
      } catch (error: any) {
        console.error('Capture error:', error);
        Toast.show({
          type: 'error',
          text1: 'Capture Failed',
          text2: 'Camera not ready or layout invalid'
        });
      }
    }
  };

  const handleConfirm = async () => {
    if (!photo || !orderId) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      // @ts-ignore
      formData.append('file', {
        uri: photo,
        name: `order_${orderId}.jpg`,
        type: 'image/jpeg',
      });

      const response = await authFetch('/upload?folder=orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload photo');
      const { url } = await response.json();

      Toast.show({
        type: 'success',
        text1: 'Photo Uploaded',
        text2: 'Proof of delivery photo saved'
      });
      
      // Navigate to signature screen
      router.push({
        pathname: '/signature',
        params: { orderId, photoUrl: url }
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: error.message
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      {photo ? (
        <View className="flex-1">
          <Image source={{ uri: photo }} className="flex-1" />
          <View className="absolute bottom-10 left-0 right-0 flex-row justify-around px-10 items-center">
            <TouchableOpacity 
              className="items-center gap-2 bg-black/40 p-4 rounded-full" 
              onPress={() => setPhoto(null)}
            >
              <RefreshCw color="#fff" size={28} />
              <Text className="text-white font-bold text-xs">Retake</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`items-center gap-2 bg-emerald-500 p-5 rounded-full min-w-[140px] flex-row justify-center shadow-lg shadow-emerald-500/30 ${isUploading ? 'opacity-70' : ''}`}
              onPress={handleConfirm}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Check color="#fff" size={28} />
                  <Text className="text-white font-bold text-base ml-2">Confirm</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View className="flex-1">
          <CameraView 
            className="flex-1" 
            ref={cameraRef} 
            onCameraReady={() => setIsCameraReady(true)}
          />
          <View className="absolute inset-0 bg-transparent justify-between p-5 pt-16">
            <TouchableOpacity 
              className="self-start w-12 h-12 rounded-full bg-black/50 justify-center items-center" 
              onPress={() => router.back()}
            >
              <X color="#fff" size={24} />
            </TouchableOpacity>
            
            <View className="border-2 border-white/40 border-dashed h-[45%] rounded-[40px] justify-center items-center">
              <Text className="text-white bg-black/40 px-4 py-2 rounded-lg font-medium">Align package within frame</Text>
            </View>

            <View className="items-center mb-10">
              <TouchableOpacity 
                className={`w-20 h-20 rounded-full bg-white/20 justify-center items-center border-2 border-white/40 ${!isCameraReady ? 'opacity-50' : ''}`} 
                onPress={takePicture}
                disabled={!isCameraReady}
              >
                <View className={`w-16 h-16 rounded-full justify-center items-center shadow-lg ${!isCameraReady ? 'bg-slate-500' : 'bg-indigo-500 shadow-indigo-500/50'}`}>
                  <Camera color="#fff" size={32} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
