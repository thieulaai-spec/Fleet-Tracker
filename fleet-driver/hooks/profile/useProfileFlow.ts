import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '../../store/useAuthStore';
import { useTripStore } from '../../store/useTripStore';
import { authFetch } from '../../lib/authFetch';
import { formatError } from '../../utils/error';

export const useProfileFlow = () => {
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const { tripHistory, activeTrip, fetchTrips } = useTripStore();
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [kpi, setKpi] = useState<any>(null);

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
            role: userData.role,
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
    fetchKpi();
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

      const data = await response.json().catch(() => null);
      const result = data?.data ?? data;

      if (!response.ok) {
        throw new Error(result?.message || result?.error?.message || 'Đổi mật khẩu thất bại');
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
        text2: formatError(error, 'Đổi mật khẩu thất bại'),
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

  const completedTrips = Array.isArray(tripHistory) ? tripHistory.filter(t => t && t.status === 'completed') : [];
  const totalDistance = Array.isArray(tripHistory) 
    ? tripHistory.reduce((acc, trip) => acc + (Number(trip.totalDistanceKm) || 0), 0) 
    : 0;
  
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
          distanceWithTime += (Number(trip.totalDistanceKm) || 0);
        }
      }
    });
    
    if (totalHours === 0) return 0;
    return (distanceWithTime / totalHours).toFixed(1);
  };

  const avgSpeed = calculateAvgSpeed();

  return {
    user,
    tripHistory: tripHistory || [],
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
      totalDistance: (totalDistance || 0).toFixed(1),
      avgSpeed: `${avgSpeed}`,
    },
    kpi,
    setShowPasswordModal,
    toggleStatus,
    handleChangePassword,
    handleLogout,
  };
};
