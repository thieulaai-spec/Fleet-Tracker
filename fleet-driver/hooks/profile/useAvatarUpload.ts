import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { authFetch } from '../../lib/authFetch';
import { formatError } from '../../utils/error';

export const useAvatarUpload = (updateUser: (data: any) => void) => {
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleUpdateAvatar = useCallback(async () => {
    console.log('[useProfileFlow] handleUpdateAvatar triggered!');
    console.log('[useProfileFlow] Requesting media library permissions...');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log('[useProfileFlow] Permission status:', status);
    if (status !== 'granted') {
      Toast.show({
        type: 'error',
        text1: 'Quyền truy cập bị từ chối',
        text2: 'Chúng tôi cần quyền truy cập thư viện ảnh để cập nhật ảnh đại diện của bạn',
      });
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const selectedUri = result.assets[0].uri;
      setIsUploadingAvatar(true);

      const formData = new FormData();
      const filename = selectedUri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1] : 'jpg';
      const type = `image/${ext === 'png' ? 'png' : 'jpeg'}`;

      formData.append('file', {
        uri: selectedUri,
        name: filename,
        type,
      } as any);

      console.log('[useProfileFlow] Uploading avatar to API...');
      const uploadResponse = await authFetch('/upload?folder=avatars', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error?.message || 'Không thể tải ảnh lên máy chủ');
      }

      const uploadResult = await uploadResponse.json();
      const uploadedUrl = uploadResult?.data?.url ?? uploadResult?.url;

      if (!uploadedUrl) {
        throw new Error('Không nhận được URL ảnh đại diện từ máy chủ');
      }

      console.log('[useProfileFlow] Avatar uploaded successfully:', uploadedUrl);

      const updateResponse = await authFetch('/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatarUrl: uploadedUrl,
        }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error?.message || 'Không thể cập nhật ảnh đại diện vào hồ sơ');
      }

      updateUser({ avatarUrl: uploadedUrl });

      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Ảnh đại diện của bạn đã được cập nhật',
      });

    } catch (error: any) {
      console.error('[useProfileFlow] Update avatar failed:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: formatError(error, 'Cập nhật ảnh đại diện thất bại'),
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [updateUser]);

  return { isUploadingAvatar, handleUpdateAvatar };
};
