import React, { useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Check, RotateCcw } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { useTripStore, TripStatus } from '@/store/useTripStore';
import Toast from 'react-native-toast-message';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function SignatureCapture() {
  const [isUploading, setIsUploading] = useState(false);
  const signatureRef = useRef<SignatureViewRef>(null);
  const router = useRouter();
  const { orderId, tripId, photoUrl } = useLocalSearchParams();
  const { token } = useAuthStore();
  const { updateTripStatus } = useTripStore();

  const handleSignature = async (signature: string) => {
    if (!orderId) return;
    
    setIsUploading(true);
    try {
      // 1. Upload signature image
      const formData = new FormData();
      // signature is a base64 string
      // @ts-ignore
      formData.append('file', {
        uri: signature,
        name: `signature_${orderId}.png`,
        type: 'image/png',
      });

      const uploadRes = await fetch(`${API_URL}/upload?folder=signatures`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Failed to upload signature');
      const { url: signatureUrl } = await uploadRes.json();

      // 2. Finalize order and trip status
      // In this simple version, we update the whole trip to COMPLETED when the last order is signed
      // or we can just update the order status if we had per-order status updates in the UI.
      // For now, let's update the trip status with the collected data.
      
      await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: 'delivered',
          photoUrl: photoUrl,
          signatureUrl: signatureUrl
        }),
      });

      // If this was the last order, complete the trip
      // For this MVP, we'll just assume completing an order completes the trip if requested
      if (tripId) {
        await updateTripStatus(tripId as string, TripStatus.COMPLETED);
      }

      Toast.show({
        type: 'success',
        text1: 'Delivery Completed',
        text2: 'Proof of delivery and signature saved'
      });
      
      router.dismissAll();
      router.replace('/(tabs)');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEmpty = () => {
    Toast.show({
      type: 'info',
      text1: 'Signature Required',
      text2: 'Please have the customer sign before confirming'
    });
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
  };

  const handleConfirm = () => {
    signatureRef.current?.readSignature();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X color="#94a3b8" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Customer Signature</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>Please sign below to confirm delivery</Text>
      </View>

      <View style={styles.signatureContainer}>
        <SignatureScreen
          ref={signatureRef}
          onOK={handleSignature}
          onEmpty={handleEmpty}
          descriptionText="Sign here"
          clearText="Clear"
          confirmText="Confirm"
          webStyle={signatureStyle}
          autoClear={false}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <RotateCcw size={20} color="#64748b" />
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.confirmButton} 
          onPress={handleConfirm}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Check size={20} color="#fff" />
              <Text style={styles.confirmButtonText}>Confirm Delivery</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const signatureStyle = `
  .m-signature-pad {
    box-shadow: none; border: none; 
    background-color: transparent;
  }
  .m-signature-pad--body {
    bottom: 0;
  }
  .m-signature-pad--footer {
    display: none;
  }
  body,html {
    height: 100%;
    background-color: #f8fafc;
  }
`;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructions: {
    padding: 20,
    alignItems: 'center',
  },
  instructionText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  signatureContainer: {
    flex: 1,
    margin: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 40,
    gap: 15,
  },
  clearButton: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  clearButtonText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButton: {
    flex: 2,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
