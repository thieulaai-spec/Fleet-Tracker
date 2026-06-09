import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '../../store/useAuthStore';
import { useTripStore } from '../../store/useTripStore';
import { authFetch } from '../../lib/authFetch';
import { formatError } from '../../utils/error';
import { useAvatarUpload } from './useAvatarUpload';
import { usePasswordChange } from './usePasswordChange';
import { useProfileStats } from './useProfileStats';

export const useProfileFlow = () => {
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const { tripHistory, activeTrip, fetchTrips } = useTripStore();
  
  const [isOnline, setIsOnline] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [kpi, setKpi] = useState<any>(null);
  const [alertsList, setAlertsList] = useState<any[]>([]);

  // Integrate sub-hooks
  const { isUploadingAvatar, handleUpdateAvatar } = useAvatarUpload(updateUser);
  const {
    showPasswordModal,
    setShowPasswordModal,
    oldPassword,
    setOldPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isChanging,
    handleChangePassword,
  } = usePasswordChange();
  
  const stats = useProfileStats(tripHistory || []);

  // Fetch current status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await authFetch('/auth/me');
        const data = await response.json();
        const userData = data?.data ?? data;
        if (userData?.driver?.status) {
          setIsOnline(userData.driver.status === 'available');
        }
        if (userData?.fullName) {
          updateUser({ 
            fullName: userData.fullName,
            email: userData.email,
            phone: userData.phone,
            role: userData.role,
            avatarUrl: userData.avatarUrl,
            driver: userData.driver,
          });
        }
      } catch (error) {
        console.error('Failed to fetch status:', error);
      }
    };
    fetchStatus();
    fetchTrips().catch((err) => console.error('Failed to fetch trips:', err));
  }, []);

  // Fetch KPI whenever user driver ID or online status changes
  useEffect(() => {
    const fetchKpi = async () => {
      if (!user?.driver?.id) return;
      try {
        const response = await authFetch(`/reports/driver-kpi/${user.driver.id}`);
        if (response.ok) {
          const data = await response.json();
          setKpi(data?.data ?? data);
        }
      } catch (error) {
        console.error('Failed to fetch KPI:', error);
      }
    };
    const fetchAlerts = async () => {
      if (!user?.driver?.id) return;
      try {
        const response = await authFetch(`/alerts?driverId=${user.driver.id}`);
        if (response.ok) {
          const data = await response.json();
          setAlertsList(data?.data ?? data ?? []);
        }
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      }
    };
    fetchKpi();
    fetchAlerts();
  }, [user?.driver?.id, isOnline]);

  const toggleStatus = useCallback(async () => {
    console.log('[useProfileFlow] toggleStatus called', { isOnline, isUpdatingStatus, hasActiveTrip: !!activeTrip });

    if (activeTrip) {
      console.log('[useProfileFlow] Blocked: Active trip exists');
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể đổi trạng thái khi đang trong chuyến đi',
      });
      return;
    }

    const newStatus = !isOnline ? 'available' : 'off_duty';
    console.log('[useProfileFlow] Updating status to:', newStatus);
    setIsUpdatingStatus(true);

    try {
      const response = await authFetch('/drivers/status/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      console.log('[useProfileFlow] API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error?.message || 'Cập nhật trạng thái thất bại');
      }

      setIsOnline(!isOnline);
      console.log('[useProfileFlow] Status updated successfully');
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: `Bạn đang ${!isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}`,
      });
    } catch (error: any) {
      console.error('[useProfileFlow] Update failed:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: formatError(error, 'Cập nhật trạng thái thất bại'),
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [isOnline, activeTrip, isUpdatingStatus]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/login');
          } 
        },
      ]
    );
  }, [logout, router]);

  return {
    user,
    tripHistory: tripHistory || [],
    activeTrip,
    isOnline,
    isUpdatingStatus,
    isChanging,
    isUploadingAvatar,
    showPasswordModal,
    passwords: {
      old: oldPassword,
      new: newPassword,
      confirm: confirmPassword,
      setOld: setOldPassword,
      setNew: setNewPassword,
      setConfirm: setConfirmPassword,
    },
    stats,
    kpi,
    alerts: alertsList,
    setShowPasswordModal,
    toggleStatus,
    handleChangePassword,
    handleLogout,
    handleUpdateAvatar,
  };
};
