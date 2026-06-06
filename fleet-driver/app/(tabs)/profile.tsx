import React from 'react';
import { 
  TouchableOpacity, 
  ScrollView, 
  View, 
  Text, 
  StatusBar
} from 'react-native';
import { LogOut } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useProfileFlow } from '../../hooks/profile/useProfileFlow';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { ProfileStats } from '../../components/profile/ProfileStats';
import { AccountInfo } from '../../components/profile/AccountInfo';
import { SettingsSection } from '../../components/profile/SettingsSection';
import { PasswordModal } from '../../components/profile/PasswordModal';
import { DriverKpiModal } from '../../components/profile/DriverKpiModal';

export default function ProfileScreen() {
  const {
    user,
    tripHistory,
    activeTrip,
    isOnline,
    isUpdatingStatus,
    isChanging,
    isUploadingAvatar,
    showPasswordModal,
    passwords,
    stats,
    kpi,
    setShowPasswordModal,
    toggleStatus,
    handleChangePassword,
    handleLogout,
    handleUpdateAvatar,
  } = useProfileFlow();

  const [activeKpiDetail, setActiveKpiDetail] = React.useState<'trips' | 'completion' | 'violations' | 'score' | null>(null);

  return (
    <View className="flex-1 bg-slate-950">
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      
      {/* Background Glows */}
      <View className="absolute -top-[150px] -right-[150px] w-[400px] h-[400px] rounded-full bg-indigo-500/[0.08]" pointerEvents="none" />
      <View className="absolute top-[400px] -left-[150px] w-[400px] h-[400px] rounded-full bg-indigo-600/[0.05]" pointerEvents="none" />

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <ProfileHeader 
          user={user} 
          onUpdateAvatar={handleUpdateAvatar}
          isUploading={isUploadingAvatar}
        />

        {user?.role !== 'admin' && (
          <ProfileStats kpi={kpi} onCardPress={(type) => setActiveKpiDetail(type)} />
        )}

        <AccountInfo user={user} activeTrip={activeTrip} />

        <SettingsSection 
          isOnline={isOnline}
          isUpdatingStatus={isUpdatingStatus}
          activeTrip={activeTrip}
          onToggleStatus={toggleStatus}
          onOpenSecurity={() => setShowPasswordModal(true)}
          showDutyStatus={user?.role !== 'admin'}
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

      <DriverKpiModal
        isOpen={activeKpiDetail !== null}
        onClose={() => setActiveKpiDetail(null)}
        activeKpiDetail={activeKpiDetail}
        tripHistory={tripHistory}
        kpi={kpi}
      />
    </View>
  );
}
