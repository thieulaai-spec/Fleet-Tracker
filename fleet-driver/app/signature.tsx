import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Check, RotateCcw } from 'lucide-react-native';
import { useTripStore, TripStatus, OrderStatus } from '@/store/useTripStore';
import { useGeofencing } from '@/hooks/useGeofencing';
import Toast from 'react-native-toast-message';
import { cacheDirectory, writeAsStringAsync, EncodingType, deleteAsync } from 'expo-file-system/legacy';
import { authFetch } from '@/lib/authFetch';
import { formatError } from '@/utils/error';

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
      const resJson = await uploadRes.json();
      const signatureUrl = resJson.data?.url || resJson.url;
      if (!signatureUrl) {
        throw new Error('No URL returned from server');
      }

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
        text2: formatError(error, 'Failed to complete delivery')
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
    <View className="flex-1 bg-slate-950">
      <View className="flex-row justify-between items-center px-5 pt-[60px] pb-5">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 rounded-full bg-slate-800 justify-center items-center"
        >
          <X color="#94a3b8" size={24} />
        </TouchableOpacity>
        <Text className="text-slate-50 text-lg font-bold">Customer Signature</Text>
        <View className="w-6" />
      </View>

      <View className="p-5 items-center">
        <Text className="text-slate-400 text-base">Please sign below to confirm delivery</Text>
      </View>

      <View className="flex-1 m-5 bg-slate-50 rounded-xl overflow-hidden border border-slate-700">
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

      <View className="flex-row p-5 pb-10 gap-[15px]">
        <TouchableOpacity 
          className="flex-1 h-[56px] rounded-[14px] bg-slate-800 flex-row justify-center items-center gap-2 border border-slate-700" 
          onPress={handleClear}
        >
          <RotateCcw size={20} color="#64748b" />
          <Text className="text-slate-400 font-semibold text-base">Clear</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="flex-[2] h-[56px] rounded-[14px] bg-emerald-500 flex-row justify-center items-center gap-2" 
          onPress={handleConfirm}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Check size={20} color="#fff" />
              <Text className="text-white font-bold text-base">Confirm Delivery</Text>
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
