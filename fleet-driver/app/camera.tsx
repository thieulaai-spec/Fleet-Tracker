import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Camera, Check, RefreshCw } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';
import Toast from 'react-native-toast-message';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const { token } = useAuthStore();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      const result = await cameraRef.current.takePictureAsync();
      if (result) {
        setPhoto(result.uri);
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

      const response = await fetch(`${API_URL}/upload?folder=orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
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
    <View style={styles.container}>
      {photo ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo }} style={styles.preview} />
          <View style={styles.controls}>
            <TouchableOpacity style={styles.iconButton} onPress={() => setPhoto(null)}>
              <RefreshCw color="#fff" size={32} />
              <Text style={styles.iconText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.iconButton, styles.confirmButton]} 
              onPress={handleConfirm}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Check color="#fff" size={32} />
                  <Text style={styles.iconText}>Confirm</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <CameraView style={styles.camera} ref={cameraRef}>
          <View style={styles.overlay}>
            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
              <X color="#fff" size={24} />
            </TouchableOpacity>
            
            <View style={styles.guideline}>
              <Text style={styles.guidelineText}>Align package within frame</Text>
            </View>

            <View style={styles.bottomControls}>
              <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                <View style={styles.captureButtonInner}>
                  <Camera color="#fff" size={32} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: '#fff',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  closeButton: {
    alignSelf: 'flex-start',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideline: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderStyle: 'dashed',
    height: '40%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guidelineText: {
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  bottomControls: {
    alignItems: 'center',
    marginBottom: 40,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    flex: 1,
  },
  preview: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
  },
  iconButton: {
    alignItems: 'center',
    gap: 8,
  },
  confirmButton: {
    backgroundColor: '#10b981',
    padding: 15,
    borderRadius: 40,
    minWidth: 120,
  },
  iconText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 15,
    borderRadius: 8,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loader: {
    marginVertical: 10,
  }
});
