import React, { useState } from 'react';
import { 
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Text
} from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { Vehicle, VehicleStatus, VehicleType, useFleetStore } from '../../store/useFleetStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatError } from '../../utils/error';
import { VehicleImagePicker } from './vehicle-form/VehicleImagePicker';
import { VehicleBasicInfo } from './vehicle-form/VehicleBasicInfo';
import { VehicleTypeSelector } from './vehicle-form/VehicleTypeSelector';
import { VehicleStatusSelector } from './vehicle-form/VehicleStatusSelector';
import { DriverAssigner } from './vehicle-form/DriverAssigner';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

interface VehicleFormProps {
  initialData?: Vehicle;
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({ initialData, onSubmit, loading }) => {
  const { drivers } = useFleetStore();
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    plateNumber: initialData?.plateNumber || '',
    type: initialData?.type || VehicleType.MEDIUM,
    maxCapacityKg: initialData?.maxCapacityKg?.toString() || '3000',
    status: initialData?.status || VehicleStatus.AVAILABLE,
    driverId: initialData?.driverId || '',
    deviceId: initialData?.deviceId || '',
    imageUrl: initialData?.imageUrl || '',
  });

  const uploadImage = async (uri: string): Promise<string> => {
    try {
      const { token } = useAuthStore.getState();
      
      const filename = uri.split('/').pop() || 'vehicle.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const fileType = match ? `image/${match[1]}` : `image/jpeg`;

      const uploadData = new FormData();
      uploadData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: filename,
        type: fileType,
      } as any);

      const response = await axios.post(`${API_URL}/upload?folder=vehicles`, uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      const resData = response.data.data || response.data;
      if (resData && resData.url) {
        return resData.url;
      }
      throw new Error('No URL returned from server');
    } catch (err: any) {
      throw err;
    }
  };

  const handleSubmit = async () => {
    let finalImageUrl = formData.imageUrl;
    
    // Nếu ảnh là file nội bộ (chưa upload), thì thực hiện upload trước
    if (finalImageUrl && finalImageUrl.startsWith('file://')) {
      setIsUploading(true);
      try {
        finalImageUrl = await uploadImage(finalImageUrl);
        setFormData(prev => ({ ...prev, imageUrl: finalImageUrl }));
      } catch (err: any) {
        const errorMessage = formatError(err, 'Failed to upload vehicle image');
        Toast.show({
          type: 'error',
          text1: 'Upload Failed',
          text2: errorMessage
        });
        setIsUploading(false);
        return; // Dừng lại nếu upload lỗi
      }
      setIsUploading(false);
    }

    onSubmit({
      ...formData,
      maxCapacityKg: parseInt(formData.maxCapacityKg),
      driverId: formData.driverId || null,
      deviceId: formData.deviceId.trim() || null,
      imageUrl: finalImageUrl || null,
    });
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        
        <VehicleImagePicker 
          imageUrl={formData.imageUrl} 
          onImageUploaded={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))} 
          onImageRemoved={() => setFormData(prev => ({ ...prev, imageUrl: '' }))} 
        />

        <VehicleBasicInfo formData={formData} setFormData={setFormData} />

        <VehicleTypeSelector type={formData.type} setType={(type) => setFormData(prev => ({ ...prev, type }))} />

        <VehicleStatusSelector status={formData.status} setStatus={(status) => setFormData(prev => ({ ...prev, status }))} />

        <DriverAssigner drivers={drivers} selectedDriverId={formData.driverId} setDriverId={(id) => setFormData(prev => ({ ...prev, driverId: id }))} />

        <TouchableOpacity 
          className="bg-indigo-500 h-14 rounded-2xl justify-center items-center mt-3"
          style={{
            shadowColor: '#6366f1',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4
          }}
          onPress={handleSubmit}
          disabled={loading || isUploading}
        >
          {loading || isUploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-bold">
              {initialData ? 'Update Vehicle' : 'Create Vehicle'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};


