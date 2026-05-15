import React, { useState } from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator, Modal, Platform, TextInput, StyleSheet } from 'react-native';
import { AlertTriangle, Phone, X, ShieldAlert, Navigation } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { authFetch } from '../../lib/authFetch';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface SosButtonProps {
  tripId?: string;
}

export const SosButton: React.FC<SosButtonProps> = ({ tripId }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [description, setDescription] = useState('');

  const triggerSos = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    
    setIsSending(true);
    try {
      if (!tripId) {
        throw new Error('No active trip to report incident for');
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const response = await authFetch(`/trips/${tripId}/incident`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: description || 'SOS Alert Triggered',
          severity: 'critical',
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to report incident');
      }

      Toast.show({
        type: 'success',
        text1: 'Emergency Alert Sent',
        text2: 'Dispatch has been notified of your location and status.',
        visibilityTime: 6000,
      });
      
      setIsModalVisible(false);
      setDescription('');
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to send SOS',
        text2: err.message || 'Please try again or call emergency services directly.'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenModal = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    setIsModalVisible(true);
  };

  return (
    <>
      <TouchableOpacity 
        onPress={handleOpenModal}
        activeOpacity={0.85}
        className="flex-1 w-full shadow-2xl shadow-red-500/50"
      >
        <LinearGradient
          colors={['#ef4444', '#b91c1c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="h-16 rounded-xl flex-row items-center justify-center gap-2"
        >
          <View className="bg-white/20 p-1.5 rounded-full">
            <AlertTriangle size={18} color="#fff" strokeWidth={2.5} />
          </View>
          <Text className="text-white font-black text-[13px] uppercase tracking-wider" numberOfLines={1}>Emergency SOS</Text>
        </LinearGradient>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => !isSending && setIsModalVisible(false)}
      >
        <View className="flex-1">
          <View className="absolute inset-0 bg-black/60" />
          <BlurView intensity={80} tint="dark" className="flex-1 justify-center p-6">
            <View className="bg-[#0f172a] rounded-[40px] p-8 border border-white/10 shadow-2xl overflow-hidden">
              <View className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl" />
              
              <View className="flex-row items-center justify-between mb-8">
                <View className="flex-row items-center gap-4">
                  <View className="w-12 h-12 rounded-2xl bg-red-500/20 items-center justify-center border border-red-500/30">
                    <ShieldAlert size={28} color="#ef4444" strokeWidth={2.5} />
                  </View>
                  <View>
                    <Text className="text-white text-2xl font-black">SOS Alert</Text>
                    <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest">Emergency Services</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => setIsModalVisible(false)}
                  disabled={isSending}
                  className="bg-slate-800/50 w-10 h-10 rounded-full items-center justify-center border border-white/5"
                >
                  <X size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <Text className="text-slate-400 text-base leading-relaxed mb-8">
                By sending this alert, the dispatch center will receive your <Text className="text-white font-bold">exact GPS location</Text> and immediate assistance will be coordinated.
              </Text>

              <View className="mb-8">
                <View className="flex-row justify-between items-center mb-3 px-1">
                  <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[2px]">Incident Details</Text>
                  <Text className="text-slate-600 text-[10px]">Optional</Text>
                </View>
                <TextInput
                  className="bg-slate-950/50 rounded-2xl p-5 text-slate-50 text-base border border-white/5 min-h-[120px]"
                  placeholder="Accident, breakdown, medical emergency..."
                  placeholderTextColor="#334155"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  editable={!isSending}
                  style={{ textAlignVertical: 'top' }}
                />
              </View>

              <View className="flex-row gap-4 mb-6">
                <TouchableOpacity 
                  className="flex-1 h-16 rounded-2xl justify-center items-center bg-slate-800/50 border border-white/5" 
                  onPress={() => setIsModalVisible(false)}
                  disabled={isSending}
                >
                  <Text className="text-slate-400 font-black uppercase tracking-widest text-xs">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={triggerSos}
                  disabled={isSending}
                  className="flex-[2]"
                >
                  <LinearGradient
                    colors={['#ef4444', '#b91c1c']}
                    className={`h-16 rounded-2xl justify-center items-center flex-row gap-3 ${isSending ? 'opacity-70' : ''}`}
                  >
                    {isSending ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Navigation size={20} color="#fff" strokeWidth={2.5} />
                        <Text className="text-white font-black uppercase tracking-widest text-sm">Send Alert</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                activeOpacity={0.7}
                className="bg-emerald-500/10 h-16 rounded-2xl flex-row justify-center items-center gap-3 border border-emerald-500/20"
                onPress={() => Linking.openURL('tel:911')}
              >
                <Phone size={20} color="#10b981" strokeWidth={2.5} />
                <Text className="text-emerald-500 font-black uppercase tracking-widest text-xs">Emergency Call 911</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>
    </>
  );
};

