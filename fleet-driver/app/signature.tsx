import React, { useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Check, RotateCcw } from 'lucide-react-native';
import { useTripStore, TripStatus, OrderStatus } from '@/store/useTripStore';
import { useGeofencing } from '@/hooks/useGeofencing';
import Toast from 'react-native-toast-message';
import { cacheDirectory, writeAsStringAsync, EncodingType, deleteAsync } from 'expo-file-system/legacy';
import { authFetch } from '@/lib/authFetch';

export default function SignatureCapture() {
  const [isUploading, setIsUploading] = useState(false);
  const signatureRef = useRef<SignatureViewRef>(null);
  const router = useRouter();
  const { orderId, tripId, photoUrl } = useLocalSearchParams();
  const { updateTripStatus, updateOrderStatus, activeTrip } = useTripStore();
  const { getCurrentLocation } = useGeofencing();

  const handleSignature = async (signature: string) => {
    if (!orderId) return;
    
    setIsUploading(true);
    try {
      // 1. Save base64 signature to a temporary file (better for Android compatibility)
      const filename = `signature_${orderId}_${Date.now()}.png`;
      const path = `${cacheDirectory}${filename}`;
      const base64Data = signature.replace('data:image/png;base64,', '');
      
      await writeAsStringAsync(path, base64Data, {
        encoding: EncodingType.Base64,
      });

      // 2. Upload signature image
      const formData = new FormData();
      // @ts-ignore
      formData.append('file', {
        uri: path,
        name: filename,
        type: 'image/png',
      });

      const uploadRes = await authFetch('/upload?folder=signatures', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Failed to upload signature');
      const { url: signatureUrl } = await uploadRes.json();

      // 3. Get location for audit
      const coords = await getCurrentLocation();
      const actionLat = coords?.latitude;
      const actionLng = coords?.longitude;

      // 4. Finalize order status via store method
      await updateOrderStatus(
        orderId as string, 
        OrderStatus.DELIVERED, 
        {
          photoUrl: photoUrl as string, 
          signatureUrl,
          actionLat,
          actionLng
        }
      );

      // 4. Check if all orders in the trip are delivered before completing the trip
      if (tripId && activeTrip && activeTrip.id === tripId) {
        // We use the updated state from the store if possible, 
        // but since updateOrderStatus calls fetchTrips, activeTrip might be updated.
        // However, to be safe, let's check the current activeTrip orders.
        // NOTE: In a real app, you might want to wait for the store to update or check the result.
        const remainingOrders = activeTrip.orders.filter(
          o => o.id !== orderId && o.status !== OrderStatus.DELIVERED
        );

        if (remainingOrders.length === 0) {
          await updateTripStatus(tripId as string, TripStatus.COMPLETED);
        }
      }

      Toast.show({
        type: 'success',
        text1: 'Delivery Completed',
        text2: 'Proof of delivery and signature saved'
      });
      
      router.dismissAll();
      router.replace('/(tabs)');
      
      // Cleanup temp file
      await deleteAsync(path, { idempotent: true });
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
