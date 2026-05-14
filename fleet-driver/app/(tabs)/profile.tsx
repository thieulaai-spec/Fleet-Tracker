import React, { useState } from 'react';
import { 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Alert, 
  TextInput, 
  Modal, 
  ActivityIndicator, 
  View, 
  Text,
  SafeAreaView,
  StatusBar,
  Platform,
  StyleSheet,
  Switch
} from 'react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { useTripStore } from '@/store/useTripStore';
import { 
  User, 
  Mail, 
  Shield, 
  Truck, 
  LogOut, 
  ChevronRight, 
  Settings, 
  Info,
  Phone,
  CreditCard,
  Trophy,
  Activity,
  Map as MapIcon,
  Lock,
  X,
  Check,
  Award,
  Bell,
  Navigation,
  Power
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { authFetch } from '@/lib/authFetch';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { tripHistory, activeTrip } = useTripStore();
  const router = useRouter();
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Fetch current status on mount
  React.useEffect(() => {
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

  const toggleStatus = async () => {
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
  };

  const handleChangePassword = async () => {
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
  };

  const handleLogout = () => {
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
  };

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

  const stats = [
    { label: 'Completed', value: completedTrips.length, icon: Trophy, color: '#fbbf24' },
    { label: 'Total Km', value: totalDistance.toFixed(1), icon: MapIcon, color: '#10b981' },
    { label: 'Avg Speed', value: `${avgSpeed}`, icon: Activity, color: '#6366f1', unit: 'km/h' },
  ];

  return (
    <View className="flex-1 bg-slate-950">
      <StatusBar barStyle="light-content" />
      
      {/* Background Glows */}
      <View style={styles.glow} />
      <View style={[styles.glow, { top: 400, left: -150, backgroundColor: 'rgba(79, 70, 229, 0.05)' }]} />

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Profile Hero */}
        <View className="pt-16 pb-12 overflow-hidden">
          <View className="items-center px-6">
            <View className="w-28 h-28 relative mb-6">
              <LinearGradient
                colors={['#6366f1', '#a855f7']}
                className="absolute inset-0 rounded-full opacity-20"
                style={{ transform: [{ scale: 1.2 }] }}
              />
              <View className="w-full h-full rounded-full p-1 bg-slate-900 border border-white/10 overflow-hidden shadow-2xl">
                <View className="flex-1 rounded-full bg-slate-800 justify-center items-center">
                  <User size={56} color="#6366f1" />
                </View>
              </View>
              <View className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-emerald-500 border-4 border-slate-950 items-center justify-center">
                <Check size={14} color="white" strokeWidth={3} />
              </View>
            </View>

            <Text className="text-3xl font-black text-white text-center tracking-tight mb-2">
              {user?.fullName || 'Driver Name'}
            </Text>
            
            <BlurView intensity={20} className="rounded-full overflow-hidden border border-white/10">
              <LinearGradient
                colors={['rgba(99, 102, 241, 0.1)', 'rgba(168, 85, 247, 0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="flex-row items-center px-4 py-1.5 gap-2"
              >
                <Award size={14} color="#6366f1" />
                <Text className="text-indigo-400 text-[10px] font-black uppercase tracking-[2px]">
                  {user?.role?.toUpperCase() || 'PREMIUM DRIVER'}
                </Text>
              </LinearGradient>
            </BlurView>
          </View>
        </View>

        {/* Stats Row */}
        <View className="flex-row justify-between px-5 -mt-4 mb-8">
          {stats.map((stat, index) => (
            <BlurView 
              key={index} 
              intensity={Platform.OS === 'ios' ? 40 : 100}
              tint="dark"
              className="w-[31%] rounded-xl overflow-hidden border border-white/5"
              style={{ backgroundColor: Platform.OS === 'android' ? 'rgba(15, 23, 42, 0.8)' : 'transparent' }}
            >
              <View className="p-4 items-center">
                <View 
                  className="w-10 h-10 rounded-2xl justify-center items-center mb-3"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <stat.icon size={20} color={stat.color} />
                </View>
                <View className="flex-row items-baseline">
                  <Text className="text-white text-lg font-black">{stat.value}</Text>
                  {stat.unit && <Text className="text-slate-500 text-[8px] ml-0.5 font-bold">{stat.unit}</Text>}
                </View>
                <Text className="text-slate-500 text-[9px] uppercase font-black tracking-widest mt-1">{stat.label}</Text>
              </View>
            </BlurView>
          ))}
        </View>

        {/* Account Information */}
        <View className="px-5 mt-4">
          <View className="flex-row items-center mb-4 ml-1">
            <View className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2" />
            <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[2px]">Fleet Credentials</Text>
          </View>
          
          <BlurView 
            intensity={20} 
            tint="dark"
            className="rounded-[32px] overflow-hidden border border-white/5 bg-slate-900/40"
          >
            <View className="p-2">
              <View className="flex-row items-center gap-4 p-4">
                <View className="w-12 h-12 rounded-2xl bg-indigo-500/10 items-center justify-center border border-indigo-500/10">
                  <Mail size={22} color="#6366f1" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Primary Email</Text>
                  <Text className="text-white text-base font-bold tracking-tight">{user?.email || 'N/A'}</Text>
                </View>
              </View>
              
              <View className="h-px bg-white/5 mx-4" />
              
              <View className="flex-row items-center gap-4 p-4">
                <View className="w-12 h-12 rounded-2xl bg-emerald-500/10 items-center justify-center border border-emerald-500/10">
                  <Phone size={22} color="#10b981" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Mobile Number</Text>
                  <Text className="text-white text-base font-bold tracking-tight">+84 912 345 678</Text>
                </View>
              </View>

              <View className="h-px bg-white/5 mx-4" />

              <View className="flex-row items-center gap-4 p-4">
                <View className="w-12 h-12 rounded-2xl bg-amber-500/10 items-center justify-center border border-amber-500/10">
                  <CreditCard size={22} color="#fbbf24" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Operator License</Text>
                  <Text className="text-white text-base font-bold tracking-tight">Class C • 24-558291</Text>
                </View>
              </View>

              <View className="h-px bg-white/5 mx-4" />

              <View className="flex-row items-center gap-4 p-4">
                <View className="w-12 h-12 rounded-2xl bg-indigo-500/10 items-center justify-center border border-indigo-500/10">
                  <Truck size={22} color="#6366f1" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Active Assignment</Text>
                  <Text className="text-white text-base font-bold tracking-tight">
                    {activeTrip ? `Vehicle ${activeTrip.vehicleId.substring(0, 8).toUpperCase()}` : 'No active vehicle'}
                  </Text>
                </View>
              </View>
            </View>
          </BlurView>
        </View>

        {/* History Section */}
        <View className="px-5 mt-10">
          <View className="flex-row items-center justify-between mb-4 ml-1">
            <View className="flex-row items-center">
              <View className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-2" />
              <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[2px]">Mission History</Text>
            </View>
            <TouchableOpacity>
              <Text className="text-indigo-400 text-[10px] font-black uppercase">View All</Text>
            </TouchableOpacity>
          </View>
          
          <View className="bg-slate-900/40 rounded-[32px] overflow-hidden border border-white/5">
            {tripHistory.length > 0 ? (
              tripHistory.slice(0, 3).map((trip, idx) => (
                <TouchableOpacity 
                  key={trip.id} 
                  className={`flex-row items-center justify-between p-5 ${idx !== 0 ? 'border-t border-white/5' : ''}`}
                >
                  <View className="flex-row items-center gap-4">
                    <View className="w-10 h-10 rounded-full bg-slate-800 items-center justify-center">
                      <Navigation size={18} color={trip.status === 'completed' ? '#10b981' : '#6366f1'} />
                    </View>
                    <View>
                      <Text className="text-white text-sm font-bold mb-0.5 tracking-tight">
                        TRIP #{trip.id.substring(0, 8).toUpperCase()}
                      </Text>
                      <Text className="text-slate-500 text-[10px] font-medium uppercase tracking-wider">
                        {new Date(trip.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                    </View>
                  </View>
                  <View 
                    className={`px-3 py-1 rounded-full border ${trip.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-500/10 border-slate-500/20'}`}
                  >
                    <Text className={`text-[8px] font-black uppercase tracking-widest ${trip.status === 'completed' ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {trip.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="p-10 items-center">
                <Text className="text-slate-600 font-bold text-sm">No activity recorded yet</Text>
              </View>
            )}
          </View>
        </View>

        {/* Settings Section */}
        <View className="px-5 mt-10">
          <View className="flex-row items-center mb-4 ml-1">
            <View className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-2" />
            <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[2px]">System Preferences</Text>
          </View>
          
          <View className="bg-slate-900/40 rounded-[32px] overflow-hidden border border-white/5">
            <View className="flex-row items-center justify-between p-5">
              <View className="flex-row items-center gap-4">
                <View className={`w-10 h-10 rounded-2xl ${isOnline ? 'bg-emerald-500/10' : 'bg-slate-800'} items-center justify-center border border-white/5`}>
                  <Power size={20} color={isOnline ? '#10b981' : '#94a3b8'} />
                </View>
                <View>
                  <Text className="text-slate-100 text-base font-bold tracking-tight">
                    Duty Status
                  </Text>
                  <Text className={`text-[10px] font-bold uppercase tracking-wider ${isOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {isOnline ? 'Online & Available' : 'Offline / Off Duty'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isOnline}
                onValueChange={toggleStatus}
                disabled={isUpdatingStatus || !!activeTrip}
                trackColor={{ false: '#1e293b', true: '#10b981' }}
                thumbColor={Platform.OS === 'ios' ? '#ffffff' : isOnline ? '#ffffff' : '#94a3b8'}
              />
            </View>

            <View className="h-px bg-white/5 mx-5" />

            <TouchableOpacity className="flex-row items-center justify-between p-5">
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-2xl bg-slate-800 items-center justify-center border border-white/5">
                  <Settings size={20} color="#94a3b8" />
                </View>
                <Text className="text-slate-100 text-base font-bold tracking-tight">App Configuration</Text>
              </View>
              <ChevronRight size={18} color="#475569" />
            </TouchableOpacity>
            
            <View className="h-px bg-white/5 mx-5" />
            
            <TouchableOpacity 
              className="flex-row items-center justify-between p-5"
              onPress={() => setShowPasswordModal(true)}
            >
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-2xl bg-slate-800 items-center justify-center border border-white/5">
                  <Lock size={20} color="#94a3b8" />
                </View>
                <Text className="text-slate-100 text-base font-bold tracking-tight">Security & Access</Text>
              </View>
              <ChevronRight size={18} color="#475569" />
            </TouchableOpacity>
            
            <View className="h-px bg-white/5 mx-5" />
            
            <TouchableOpacity className="flex-row items-center justify-between p-5">
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-2xl bg-slate-800 items-center justify-center border border-white/5">
                  <Info size={20} color="#94a3b8" />
                </View>
                <Text className="text-slate-100 text-base font-bold tracking-tight">Support Center</Text>
              </View>
              <ChevronRight size={18} color="#475569" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          className="mx-5 mt-12 overflow-hidden rounded-xl"
          onPress={handleLogout}
        >
          <LinearGradient
            colors={['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.05)']}
            className="flex-row items-center justify-center p-5 gap-3 border border-red-500/20"
          >
            <LogOut size={20} color="#ef4444" />
            <Text className="text-red-500 text-base font-black uppercase tracking-widest">Terminate Session</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <Text className="text-center text-slate-600 text-[10px] font-black uppercase tracking-[2px] mt-8">
          System v1.0.2 • Build 20240510
        </Text>
      </ScrollView>

      {/* Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => !isChanging && setShowPasswordModal(false)}
      >
        <View className="flex-1 justify-end bg-black/80">
          <BlurView intensity={100} tint="dark" className="bg-slate-900 rounded-t-[40px] p-8 border-t border-white/10">
            <View className="flex-row justify-between items-center mb-10">
              <View>
                <Text className="text-2xl font-black text-white tracking-tight">Security</Text>
                <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">Update Access Key</Text>
              </View>
              <TouchableOpacity 
                onPress={() => !isChanging && setShowPasswordModal(false)}
                disabled={isChanging}
                className="bg-white/5 p-2.5 rounded-full border border-white/5"
              >
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View className="gap-6">
              <View>
                <Text className="text-slate-500 text-[10px] font-black mb-2 uppercase tracking-[2px] ml-1">Current Password</Text>
                <View className="flex-row items-center bg-slate-950 rounded-2xl px-5 border border-white/10 focus:border-indigo-500">
                  <Lock size={18} color="#475569" />
                  <TextInput
                    className="flex-1 text-white text-base py-4 ml-4"
                    placeholder="Verification required"
                    placeholderTextColor="#334155"
                    secureTextEntry={true}
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    editable={!isChanging}
                  />
                </View>
              </View>

              <View>
                <Text className="text-slate-500 text-[10px] font-black mb-2 uppercase tracking-[2px] ml-1">New Access Key</Text>
                <View className="flex-row items-center bg-slate-950 rounded-2xl px-5 border border-white/10 focus:border-indigo-500">
                  <Lock size={18} color="#475569" />
                  <TextInput
                    className="flex-1 text-white text-base py-4 ml-4"
                    placeholder="Min 6 characters"
                    placeholderTextColor="#334155"
                    secureTextEntry={true}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    editable={!isChanging}
                  />
                </View>
              </View>

              <View>
                <Text className="text-slate-500 text-[10px] font-black mb-2 uppercase tracking-[2px] ml-1">Confirm Identity</Text>
                <View className="flex-row items-center bg-slate-950 rounded-2xl px-5 border border-white/10 focus:border-indigo-500">
                  <Lock size={18} color="#475569" />
                  <TextInput
                    className="flex-1 text-white text-base py-4 ml-4"
                    placeholder="Repeat new access key"
                    placeholderTextColor="#334155"
                    secureTextEntry={true}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    editable={!isChanging}
                  />
                </View>
              </View>
            </View>

            <View className="flex-row gap-4 mt-12 pb-6">
              <TouchableOpacity
                className="flex-1 h-16 rounded-3xl bg-white/5 justify-center items-center border border-white/5"
                onPress={() => setShowPasswordModal(false)}
                disabled={isChanging}
              >
                <Text className="text-slate-400 text-base font-black uppercase tracking-widest">Abort</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-[2] h-16 rounded-3xl overflow-hidden ${isChanging ? 'opacity-70' : ''}`}
                onPress={handleChangePassword}
                disabled={isChanging}
              >
                <LinearGradient
                  colors={['#6366f1', '#4f46e5']}
                  className="flex-1 justify-center items-center"
                >
                  {isChanging ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View className="flex-row items-center gap-2">
                      <Check size={20} color="#fff" strokeWidth={3} />
                      <Text className="text-white text-base font-black uppercase tracking-widest">Apply Key</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: -150,
    right: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    filter: Platform.OS === 'ios' ? 'blur(100px)' : 'none',
  }
});
