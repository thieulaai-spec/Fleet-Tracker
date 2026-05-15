import React from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { X, Lock, Check } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface PasswordModalProps {
  visible: boolean;
  isChanging: boolean;
  passwords: {
    old: string;
    new: string;
    confirm: string;
    setOld: (v: string) => void;
    setNew: (v: string) => void;
    setConfirm: (v: string) => void;
  };
  onClose: () => void;
  onSubmit: () => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  visible,
  isChanging,
  passwords,
  onClose,
  onSubmit
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => !isChanging && onClose()}
    >
      <View className="flex-1 justify-end bg-black/80">
        <BlurView intensity={100} tint="dark" className="bg-slate-900 rounded-t-[40px] p-8 border-t border-white/10">
          <View className="flex-row justify-between items-center mb-10">
            <View>
              <Text className="text-2xl font-black text-white tracking-tight">Security</Text>
              <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">Update Access Key</Text>
            </View>
            <TouchableOpacity 
              onPress={() => !isChanging && onClose()}
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
                  value={passwords.old}
                  onChangeText={passwords.setOld}
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
                  value={passwords.new}
                  onChangeText={passwords.setNew}
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
                  value={passwords.confirm}
                  onChangeText={passwords.setConfirm}
                  editable={!isChanging}
                />
              </View>
            </View>
          </View>

          <View className="flex-row gap-4 mt-12 pb-6">
            <TouchableOpacity
              className="flex-1 h-16 rounded-3xl bg-white/5 justify-center items-center border border-white/5"
              onPress={onClose}
              disabled={isChanging}
            >
              <Text className="text-slate-400 text-base font-black uppercase tracking-widest">Abort</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-[2] h-16 rounded-3xl overflow-hidden ${isChanging ? 'opacity-70' : ''}`}
              onPress={onSubmit}
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
  );
};
