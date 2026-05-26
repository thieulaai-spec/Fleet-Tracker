import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal
} from 'react-native';
import { User, Mail, Phone, ShieldCheck, Calendar, Lock } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Driver, DriverStatus } from '../../../store/useFleetStore';

interface DriverFormProps {
  initialData?: Driver;
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
}

export const DriverForm: React.FC<DriverFormProps> = ({ initialData, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    fullName: initialData?.user.fullName || '',
    email: initialData?.user.email || '',
    password: '',
    phone: initialData?.user.phone || '',
    licenseClass: initialData?.licenseClass || '',
    licenseExpiry: initialData?.licenseExpiry || '',
    status: initialData?.status || DriverStatus.OFF_DUTY,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  const getExpiryDate = () => {
    if (formData.licenseExpiry) {
      const d = new Date(formData.licenseExpiry);
      if (!isNaN(d.getTime())) {
        return d;
      }
    }
    return new Date();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;
      setFormData({ ...formData, licenseExpiry: formattedDate });
    }
  };

  const handleSubmit = () => {
    if (initialData) {
      const { password, email, ...updateData } = formData;
      onSubmit(updateData);
    } else {
      onSubmit(formData);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View className="mb-6">
          <Text className="text-[14px] font-extrabold text-slate-400 uppercase tracking-[1px] mb-3">
            Personal Information
          </Text>
          
          <View className="flex-row items-center bg-slate-800 rounded-2xl border border-white/[0.08] px-4 mb-3 h-14">
            <User size={20} color="#64748b" style={{ marginRight: 12 }} />
            <TextInput
              className="flex-1 text-slate-50 text-base"
              placeholder="Full Name"
              placeholderTextColor="#64748b"
              value={formData.fullName}
              onChangeText={(text) => setFormData({ ...formData, fullName: text })}
            />
          </View>

          <View className={`flex-row items-center bg-slate-800 rounded-2xl border border-white/[0.08] px-4 mb-3 h-14 ${initialData ? 'opacity-60' : ''}`}>
            <Mail size={20} color="#64748b" style={{ marginRight: 12 }} />
            <TextInput
              className="flex-1 text-slate-50 text-base"
              placeholder="Email Address"
              placeholderTextColor="#64748b"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              editable={!initialData}
            />
          </View>

          {!initialData && (
            <View className="flex-row items-center bg-slate-800 rounded-2xl border border-white/[0.08] px-4 mb-3 h-14">
              <Lock size={20} color="#64748b" style={{ marginRight: 12 }} />
              <TextInput
                className="flex-1 text-slate-50 text-base"
                placeholder="Password (min 6 characters)"
                placeholderTextColor="#64748b"
                secureTextEntry={true}
                autoCapitalize="none"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
              />
            </View>
          )}

          <View className="flex-row items-center bg-slate-800 rounded-2xl border border-white/[0.08] px-4 mb-3 h-14">
            <Phone size={20} color="#64748b" style={{ marginRight: 12 }} />
            <TextInput
              className="flex-1 text-slate-50 text-base"
              placeholder="Phone Number"
              placeholderTextColor="#64748b"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
            />
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-[14px] font-extrabold text-slate-400 uppercase tracking-[1px] mb-3">
            Driver License
          </Text>
          
          <View className="flex-row items-center bg-slate-800 rounded-2xl border border-white/[0.08] px-4 mb-3 h-14">
            <ShieldCheck size={20} color="#64748b" style={{ marginRight: 12 }} />
            <TextInput
              className="flex-1 text-slate-50 text-base"
              placeholder="License Class (e.g. C, FC)"
              placeholderTextColor="#64748b"
              value={formData.licenseClass}
              onChangeText={(text) => setFormData({ ...formData, licenseClass: text })}
            />
          </View>

          <TouchableOpacity 
            className="flex-row items-center bg-slate-800 rounded-2xl border border-white/[0.08] px-4 mb-3 h-14" 
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Calendar size={20} color="#64748b" style={{ marginRight: 12 }} />
            <Text className={`flex-1 text-base ${formData.licenseExpiry ? 'text-slate-50' : 'text-slate-500'}`}>
              {formData.licenseExpiry 
                ? formData.licenseExpiry 
                : 'Expiry Date (YYYY-MM-DD)'}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <Text className="text-[14px] font-extrabold text-slate-400 uppercase tracking-[1px] mb-3">
            Status
          </Text>
          <View className="flex-row gap-2 flex-wrap">
            {Object.values(DriverStatus).map((status) => (
              <TouchableOpacity
                key={status}
                className={`px-4 py-2.5 rounded-xl bg-slate-800 border border-white/[0.08] ${
                  formData.status === status ? 'bg-indigo-500 border-indigo-500' : ''
                }`}
                onPress={() => setFormData({ ...formData, status })}
              >
                <Text className={`font-bold text-[13px] capitalize ${
                  formData.status === status ? 'text-white' : 'text-slate-400'
                }`}>
                  {status.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          className="bg-indigo-500 h-14 rounded-2xl justify-center items-center mt-3 shadow-lg shadow-indigo-500/30 elevation-4"
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-bold">
              {initialData ? 'Update Driver' : 'Create Driver'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={getExpiryDate()}
          mode="date"
          display="calendar"
          onChange={handleDateChange}
        />
      )}

      {showDatePicker && Platform.OS === 'ios' && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View className="flex-1 justify-end bg-slate-950/75">
            <View className="bg-slate-800 rounded-t-3xl border border-white/[0.08] pb-8">
              <View className="flex-row justify-between items-center p-4 border-b border-white/[0.08]">
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text className="text-base text-slate-500 font-semibold">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-base font-bold text-slate-50">Select Expiry Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text className="text-base text-indigo-500 font-bold">Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={getExpiryDate()}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                textColor="#f8fafc"
                themeVariant="dark"
              />
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
};
