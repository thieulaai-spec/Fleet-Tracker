import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '../../store/useAuthStore';
import { useTripStore } from '../../store/useTripStore';
import { authFetch } from '../../lib/authFetch';

export const useProfileFlow = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { tripHistory, activeTrip } = useTripStore();
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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
      } catch (error) {
        console.error('Failed to fetch status:', error);
      }
    };
    fetchStatus();
  }, []);

  const toggleStatus = useCallback(async () => {
    if (activeTrip) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể đổi trạng thái khi đang trong chuyến đi',
      });
      return;
    }

    const newStatus = !isOnline ? 'available' : 'off_duty';
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

      if (!response.ok) {
        throw new Error('Cập nhật trạng thái thất bại');
      }

      setIsOnline(!isOnline);
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: `Bạn đang ${!isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}`,
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error.message || 'Cập nhật trạng thái thất bại',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [isOnline, activeTrip]);

  const handleChangePassword = useCallback(async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Vui lòng nhập đầy đủ mật khẩu',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Mật khẩu mới không khớp',
      });
      return;
    }

    if (newPassword.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Mật khẩu mới phải ít nhất 6 ký tự',
      });
      return;
    }

    setIsChanging(true);
    try {
      const response = await authFetch('/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      const data = await response.json();
      const result = data?.data ?? data;

      if (!response.ok) {
        throw new Error(result?.message || 'Đổi mật khẩu thất bại');
      }

      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Mật khẩu đã được đổi',
      });

      setShowPasswordModal(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error.message || 'Đổi mật khẩu thất bại',
      });
    } finally {
      setIsChanging(false);
    }
  }, [oldPassword, newPassword, confirmPassword]);

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

  const completedTrips = tripHistory.filter(t => t.status === 'completed');
  const totalDistance = tripHistory.reduce((acc, trip) => acc + (trip.totalDistanceKm || 0), 0);
  
  const calculateAvgSpeed = () => {
    if (completedTrips.length === 0) return 0;
    
    let totalHours = 0;
    let distanceWithTime = 0;
    
    completedTrips.forEach(trip => {
      if (trip.startedAt && trip.completedAt) {
        const start = new Date(trip.startedAt).getTime();
        const end = new Date(trip.completedAt).getTime();
        const durationHours = (end - start) / (1000 * 60 * 60);
        
        if (durationHours > 0) {
          totalHours += durationHours;
          distanceWithTime += (trip.totalDistanceKm || 0);
        }
      }
    });
    
    if (totalHours === 0) return 0;
    return (distanceWithTime / totalHours).toFixed(1);
  };

  const avgSpeed = calculateAvgSpeed();

  return {
    user,
    tripHistory,
    activeTrip,
    isOnline,
    isUpdatingStatus,
    isChanging,
    showPasswordModal,
    passwords: {
      old: oldPassword,
      new: newPassword,
      confirm: confirmPassword,
      setOld: setOldPassword,
      setNew: setNewPassword,
      setConfirm: setConfirmPassword,
    },
    stats: {
      completedCount: completedTrips.length,
      totalDistance: totalDistance.toFixed(1),
      avgSpeed: `${avgSpeed}`,
    },
    setShowPasswordModal,
    toggleStatus,
    handleChangePassword,
    handleLogout,
  };
};
