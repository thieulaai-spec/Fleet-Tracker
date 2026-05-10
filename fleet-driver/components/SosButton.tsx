import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Text, View, Alert, ActivityIndicator, Modal, Platform, TextInput } from 'react-native';
import { AlertTriangle, Phone, X, ShieldAlert } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { socketService } from '../lib/socket';
import Toast from 'react-native-toast-message';

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
      // Mock API call to alert dispatch
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      
      await socketService.sendSosAlert(tripId, description, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

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
        style={styles.sosTrigger} 
        onPress={handleOpenModal}
      >
        <AlertTriangle size={24} color="#fff" />
        <Text style={styles.sosTriggerText}>SOS</Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ShieldAlert size={32} color="#ef4444" />
              <Text style={styles.modalTitle}>Emergency SOS</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              This will notify the dispatch center and share your current GPS location.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>What happened? (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Accident, breakdown, medical emergency..."
                placeholderTextColor="#64748b"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={() => setIsModalVisible(false)}
                disabled={isSending}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.confirmButton]} 
                onPress={triggerSos}
                disabled={isSending}
              >
                {isSending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <AlertTriangle size={20} color="#fff" />
                    <Text style={styles.confirmButtonText}>Send SOS</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.directCallButton}
              onPress={() => Linking.openURL('tel:911')}
            >
              <Phone size={20} color="#fff" />
              <Text style={styles.directCallText}>Direct Call 911</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  sosTrigger: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sosTriggerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: -40, // Offset for centering with icon
  },
  modalDescription: {
    color: '#94a3b8',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 15,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
  },
  cancelButtonText: {
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#ef4444',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  directCallButton: {
    backgroundColor: '#334155',
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  directCallText: {
    color: '#fff',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 25,
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 12,
    padding: 12,
    color: '#f8fafc',
    fontSize: 16,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    minHeight: 80,
  }
});
