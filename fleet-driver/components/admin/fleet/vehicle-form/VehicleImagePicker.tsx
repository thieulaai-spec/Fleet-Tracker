import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Camera, X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

interface Props {
  imageUrl: string;
  onImageUploaded: (url: string) => void;
  onImageRemoved: () => void;
}

export const VehicleImagePicker = ({ imageUrl, onImageUploaded, onImageRemoved }: Props) => {
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission Denied',
          text2: 'Sorry, we need camera roll permissions to upload photos.'
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Tối ưu hóa: Thay đổi kích thước và nén ảnh trước khi upload
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 1024 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        onImageUploaded(manipulatedImage.uri);
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not launch image library.'
      });
    }
  };

  return (
    <View className="mb-6">
      <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">Vehicle Photo</Text>
      
      {imageUrl ? (
        <View className="relative bg-slate-800 rounded-2xl border border-white/5 overflow-hidden h-44">
          <Image 
            source={{ uri: imageUrl }} 
            className="w-full h-full"
            resizeMode="cover"
          />
          
          <View className="absolute inset-0 bg-black/30 flex justify-between p-3">
            <View className="flex-row justify-end">
              <TouchableOpacity 
                className="bg-black/60 w-8 h-8 rounded-full justify-center items-center"
                onPress={onImageRemoved}
              >
                <X size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              className="flex-row items-center gap-1.5 self-center bg-black/60 px-4 py-2 rounded-full"
              onPress={pickImage}
            >
              <Camera size={14} color="#fff" />
              <Text className="text-white text-xs font-bold">Change Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity 
          className="bg-slate-800 rounded-2xl border border-white/5 border-dashed h-44 justify-center items-center"
          onPress={pickImage}
        >
          <View className="items-center">
            <View className="bg-slate-700/50 w-12 h-12 rounded-full justify-center items-center mb-3">
              <Camera size={22} color="#6366f1" />
            </View>
            <Text className="text-slate-200 text-sm font-bold">Select Vehicle Image</Text>
            <Text className="text-slate-500 text-xs mt-1">PNG, JPG or WEBP</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};
