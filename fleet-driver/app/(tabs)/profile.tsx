import React from 'react';
import { 
  TouchableOpacity, 
  ScrollView, 
  View, 
  Text, 
  StatusBar, 
  Platform, 
  StyleSheet 
} from 'react-native';
import { LogOut } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useProfileFlow } from '../../hooks/profile/useProfileFlow';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { ProfileStats } from '../../components/profile/ProfileStats';
import { AccountInfo } from '../../components/profile/AccountInfo';
import { MissionHistory } from '../../components/profile/MissionHistory';
import { SettingsSection } from '../../components/profile/SettingsSection';
import { PasswordModal } from '../../components/profile/PasswordModal';

export default function ProfileScreen() {
  const {
    user,
    tripHistory,
    activeTrip,
    isOnline,
    isUpdatingStatus,
    isChanging,
    showPasswordModal,
    passwords,
    stats,
    setShowPasswordModal,
    toggleStatus,
    handleChangePassword,
    handleLogout,
  } = useProfileFlow();

  return (
    <View className="flex-1 bg-slate-950">
      <StatusBar barStyle="light-content" />
      
      {/* Background Glows */}
      <View style={styles.glow} pointerEvents="none" />
      <View style={[styles.glow, { top: 400, left: -150, backgroundColor: 'rgba(79, 70, 229, 0.05)' }]} pointerEvents="none" />

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <ProfileHeader user={user} />

        <ProfileStats 
          completedCount={stats.completedCount}
          totalDistance={stats.totalDistance}
          avgSpeed={stats.avgSpeed}
        />

        <AccountInfo user={user} activeTrip={activeTrip} />

        <MissionHistory tripHistory={tripHistory} />

        <SettingsSection 
          isOnline={isOnline}
          isUpdatingStatus={isUpdatingStatus}
          activeTrip={activeTrip}
          onToggleStatus={toggleStatus}
          onOpenSecurity={() => setShowPasswordModal(true)}
        />

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

      <PasswordModal 
        visible={showPasswordModal}
        isChanging={isChanging}
        passwords={passwords}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handleChangePassword}
      />
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
    // filter: Platform.OS === 'ios' ? 'blur(100px)' : 'none', // Standard RN doesn't support filter
  }
});
