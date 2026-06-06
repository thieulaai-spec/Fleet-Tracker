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
import { 
  MapPin, 
  Scale, 
  FileText, 
  ChevronRight, 
  AlertCircle,
  Map as MapIcon,
  Calendar,
  User,
  Phone,
  Clock
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Order, OrderStatus } from '../../../store/useOrderStore';
import { MapPicker } from './MapPicker';

const categories = [
  { label: 'Nguyên liệu', value: 'raw_material', desc: 'Sắt, thép, hóa chất, vật liệu thô...' },
  { label: 'Thành phẩm', value: 'finished_goods', desc: 'Quần áo, thực phẩm, hàng tiêu dùng...' },
  { label: 'Linh kiện', value: 'component', desc: 'Chip điện tử, phụ tùng ô tô, xe máy...' },
  { label: 'Thiết bị', value: 'equipment', desc: 'Máy móc, dụng cụ chuyên dụng, đồ gia dụng...' },
  { label: 'Khác', value: 'other', desc: 'Các mặt hàng khác...' },
];

const priorities = [
  { label: 'Thấp', value: 'low', activeBg: 'bg-emerald-500' },
  { label: 'Trung bình', value: 'medium', activeBg: 'bg-amber-500' },
  { label: 'Cao', value: 'high', activeBg: 'bg-rose-500' },
];

interface OrderFormProps {
  initialData?: Partial<Order>;
  onSubmit: (data: Partial<Order>) => Promise<void>;
  loading?: boolean;
}

export const OrderForm: React.FC<OrderFormProps> = ({ initialData, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    pickupAddress: initialData?.pickupAddress || '',
    deliveryAddress: initialData?.deliveryAddress || '',
    weightKg: initialData?.weightKg?.toString() || '',
    description: initialData?.description || '',
    pickupLocation: initialData?.pickupLocation?.coordinates || null,
    deliveryLocation: initialData?.deliveryLocation?.coordinates || null,
    recipientName: initialData?.recipientName || '',
    recipientPhone: initialData?.recipientPhone || '',
    category: initialData?.category || 'other',
    priority: initialData?.priority || 'medium',
    deliveryDeadline: initialData?.deliveryDeadline 
      ? new Date(initialData.deliveryDeadline) 
      : new Date(Date.now() + 2 * 3600000), // default: +2 hours
  });

  const [pickingLocation, setPickingLocation] = useState<'pickup' | 'delivery' | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'dismissed') {
        setShowDatePicker(false);
        return;
      }
    }
    
    if (selectedDate) {
      if (datePickerMode === 'date') {
        const current = new Date(formData.deliveryDeadline);
        current.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        setFormData({ ...formData, deliveryDeadline: current });
        
        if (Platform.OS === 'android') {
          setShowDatePicker(false);
          setDatePickerMode('time');
          setTimeout(() => {
            setShowDatePicker(true);
          }, 300);
        } else {
          setDatePickerMode('time');
        }
      } else {
        const current = new Date(formData.deliveryDeadline);
        current.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
        setFormData({ ...formData, deliveryDeadline: current });
        setShowDatePicker(false);
        setDatePickerMode('date');
      }
    } else {
      setShowDatePicker(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.pickupAddress) newErrors.pickupAddress = 'Required';
    if (!formData.deliveryAddress) newErrors.deliveryAddress = 'Required';
    if (!formData.weightKg || isNaN(Number(formData.weightKg))) newErrors.weightKg = 'Invalid weight';
    if (!formData.pickupLocation) newErrors.pickupLocation = 'Pick location on map';
    if (!formData.deliveryLocation) newErrors.deliveryLocation = 'Pick location on map';
    if (!formData.recipientName.trim()) newErrors.recipientName = 'Required';
    if (!formData.recipientPhone.trim()) {
      newErrors.recipientPhone = 'Required';
    } else if (!/^(0|84|\+84)\d{9}$/.test(formData.recipientPhone.trim())) {
      newErrors.recipientPhone = 'Starts with 0/84, followed by 9 digits';
    }
    if (!formData.deliveryDeadline) newErrors.deliveryDeadline = 'Required';
    else if (new Date(formData.deliveryDeadline).getTime() <= Date.now()) {
      newErrors.deliveryDeadline = 'Deadline must be in the future';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    await onSubmit({
      ...formData,
      weightKg: Number(formData.weightKg),
      pickupLocation: {
        type: 'Point',
        coordinates: formData.pickupLocation,
      },
      deliveryLocation: {
        type: 'Point',
        coordinates: formData.deliveryLocation,
      },
      recipientName: formData.recipientName,
      recipientPhone: formData.recipientPhone,
      category: formData.category,
      priority: formData.priority,
      deliveryDeadline: formData.deliveryDeadline.toISOString(),
      status: initialData?.status || OrderStatus.PENDING,
    } as any);
  };

  const handleLocationSelect = (coords: { latitude: number; longitude: number }, address: string) => {
    if (pickingLocation === 'pickup') {
      setFormData({ 
        ...formData, 
        pickupLocation: [coords.longitude, coords.latitude],
        pickupAddress: address 
      });
    } else if (pickingLocation === 'delivery') {
      setFormData({ 
        ...formData, 
        deliveryLocation: [coords.longitude, coords.latitude],
        deliveryAddress: address 
      });
    }
    setPickingLocation(null);
  };

  if (pickingLocation) {
    return (
      <MapPicker
        title={`Set ${pickingLocation === 'pickup' ? 'Pickup' : 'Delivery'} Point`}
        initialLocation={
          pickingLocation === 'pickup' && formData.pickupLocation 
            ? { latitude: formData.pickupLocation[1], longitude: formData.pickupLocation[0] }
            : pickingLocation === 'delivery' && formData.deliveryLocation
            ? { latitude: formData.deliveryLocation[1], longitude: formData.deliveryLocation[0] }
            : undefined
        }
        initialAddress={
          pickingLocation === 'pickup' ? formData.pickupAddress : formData.deliveryAddress
        }
        onSelect={handleLocationSelect}
        onCancel={() => setPickingLocation(null)}
      />
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }}>
        {/* Pickup Section */}
        <View className="bg-slate-900 rounded-3xl p-5 border border-slate-700/50 gap-4">
          <View className="flex-row items-center gap-2.5 mb-1">
            <MapPin size={20} color="#f59e0b" />
            <Text className="text-lg font-bold text-slate-50">Pickup Details</Text>
          </View>
          
          <View className="gap-2">
            <Text className="text-sm font-semibold text-slate-400 ml-1">Address</Text>
            {formData.pickupAddress ? (
              <View className={`bg-slate-800 rounded-2xl p-4 border border-slate-700/50 gap-1.5 ${(errors.pickupAddress || errors.pickupLocation) ? 'border-red-500' : ''}`}>
                <Text className="text-[15px] font-semibold text-slate-50 leading-5" numberOfLines={2}>
                  {formData.pickupAddress}
                </Text>
                {formData.pickupLocation && (
                  <Text className="text-xs text-slate-400 font-medium">
                    Coords: {formData.pickupLocation[1].toFixed(6)}, {formData.pickupLocation[0].toFixed(6)}
                  </Text>
                )}
              </View>
            ) : (
              <View className={`bg-slate-800 rounded-2xl p-4 border gap-1.5 border-dashed border-slate-700 ${(errors.pickupAddress || errors.pickupLocation) ? 'border-red-500' : ''}`}>
                <Text className="text-sm text-slate-500 italic">
                  No pickup location selected. Please select a location on the map.
                </Text>
              </View>
            )}
            {!!errors.pickupAddress && <Text className="text-red-500 text-xs font-semibold ml-1">{errors.pickupAddress}</Text>}
          </View>

          <TouchableOpacity 
            className={`flex-row items-center bg-slate-800 rounded-2xl h-[52px] px-4 gap-3 border border-slate-700/50 ${errors.pickupLocation ? 'border-red-500' : ''}`}
            onPress={() => setPickingLocation('pickup')}
          >
            <MapIcon size={20} color={formData.pickupLocation ? '#10b981' : '#64748b'} />
            <Text className={`flex-1 text-slate-500 text-[15px] font-semibold ${formData.pickupLocation ? 'text-indigo-500' : ''}`}>
              {formData.pickupLocation ? 'Pickup Location Set' : 'Set Pickup on Map'}
            </Text>
            <ChevronRight size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Delivery Section */}
        <View className="bg-slate-900 rounded-3xl p-5 border border-slate-700/50 gap-4">
          <View className="flex-row items-center gap-2.5 mb-1">
            <MapPin size={20} color="#10b981" />
            <Text className="text-lg font-bold text-slate-50">Delivery Details</Text>
          </View>
          
          <View className="gap-2">
            <Text className="text-sm font-semibold text-slate-400 ml-1">Address</Text>
            {formData.deliveryAddress ? (
              <View className={`bg-slate-800 rounded-2xl p-4 border border-slate-700/50 gap-1.5 ${(errors.deliveryAddress || errors.deliveryLocation) ? 'border-red-500' : ''}`}>
                <Text className="text-[15px] font-semibold text-slate-50 leading-5" numberOfLines={2}>
                  {formData.deliveryAddress}
                </Text>
                {formData.deliveryLocation && (
                  <Text className="text-xs text-slate-400 font-medium">
                    Coords: {formData.deliveryLocation[1].toFixed(6)}, {formData.deliveryLocation[0].toFixed(6)}
                  </Text>
                )}
              </View>
            ) : (
              <View className={`bg-slate-800 rounded-2xl p-4 border gap-1.5 border-dashed border-slate-700 ${(errors.deliveryAddress || errors.deliveryLocation) ? 'border-red-500' : ''}`}>
                <Text className="text-sm text-slate-500 italic">
                  No delivery location selected. Please select a location on the map.
                </Text>
              </View>
            )}
            {!!errors.deliveryAddress && <Text className="text-red-500 text-xs font-semibold ml-1">{errors.deliveryAddress}</Text>}
          </View>

          <TouchableOpacity 
            className={`flex-row items-center bg-slate-800 rounded-2xl h-[52px] px-4 gap-3 border border-slate-700/50 ${errors.deliveryLocation ? 'border-red-500' : ''}`}
            onPress={() => setPickingLocation('delivery')}
          >
            <MapIcon size={20} color={formData.deliveryLocation ? '#10b981' : '#64748b'} />
            <Text className={`flex-1 text-slate-500 text-[15px] font-semibold ${formData.deliveryLocation ? 'text-indigo-500' : ''}`}>
              {formData.deliveryLocation ? 'Delivery Location Set' : 'Set Delivery on Map'}
            </Text>
            <ChevronRight size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Cargo Details */}
        <View className="bg-slate-900 rounded-3xl p-5 border border-slate-700/50 gap-4">
          <View className="flex-row items-center gap-2.5 mb-1">
            <Scale size={20} color="#10b981" />
            <Text className="text-lg font-bold text-slate-50">Cargo Info</Text>
          </View>
          
          <View className="gap-2">
            <Text className="text-sm font-semibold text-slate-400 ml-1">Weight (kg)</Text>
            <TextInput
              className={`bg-slate-800 rounded-2xl h-[52px] px-4 text-slate-50 text-base border border-slate-700/50 ${errors.weightKg ? 'border-red-500' : ''}`}
              placeholder="e.g. 150.5"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={formData.weightKg}
              onChangeText={(text) => setFormData({ ...formData, weightKg: text })}
            />
            {!!errors.weightKg && <Text className="text-red-500 text-xs font-semibold ml-1">{errors.weightKg}</Text>}
          </View>

          <View className="gap-2">
            <View className="flex-row items-center gap-1.5">
              <FileText size={16} color="#64748b" />
              <Text className="text-sm font-semibold text-slate-400 ml-1">Description (Optional)</Text>
            </View>
            <TextInput
              className="bg-slate-800 rounded-2xl h-[100px] pt-4 px-4 text-slate-50 text-base border border-slate-700/50"
              placeholder="Cargo type, handling instructions..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={4}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              style={{ textAlignVertical: 'top' }}
            />
          </View>

          {/* Phân loại hàng hoá */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-slate-400 ml-1">Phân loại hàng hoá</Text>
            <TouchableOpacity
              onPress={() => setShowCategoryModal(true)}
              className="flex-row items-center bg-slate-800 rounded-2xl h-[52px] px-4 gap-3 border border-slate-700/50"
              activeOpacity={0.7}
            >
              <FileText size={18} color="#10b981" />
              <Text className="flex-1 text-slate-50 text-[15px] font-semibold">
                {categories.find(c => c.value === formData.category)?.label || 'Chọn phân loại'}
              </Text>
              <ChevronRight size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Mức độ ưu tiên */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-slate-400 ml-1">Mức độ ưu tiên</Text>
            <View className="flex-row gap-3">
              {priorities.map((item) => {
                const isActive = formData.priority === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    onPress={() => setFormData({ ...formData, priority: item.value as any })}
                    className={`flex-1 h-[48px] rounded-2xl justify-center items-center border ${
                      isActive ? `${item.activeBg} border-transparent` : 'bg-slate-800 border-slate-700/50'
                    }`}
                  >
                    <Text className={`font-bold text-sm ${isActive ? 'text-white' : 'text-slate-400'}`}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Recipient Details */}
        <View className="bg-slate-900 rounded-3xl p-5 border border-slate-700/50 gap-4">
          <View className="flex-row items-center gap-2.5 mb-1">
            <User size={20} color="#10b981" />
            <Text className="text-lg font-bold text-slate-50">Recipient Details</Text>
          </View>
          
          <View className="gap-2">
            <Text className="text-sm font-semibold text-slate-400 ml-1">Recipient Name</Text>
            <TextInput
              className={`bg-slate-800 rounded-2xl h-[52px] px-4 text-slate-50 text-base border border-slate-700/50 ${errors.recipientName ? 'border-red-500' : ''}`}
              placeholder="Full Name"
              placeholderTextColor="#64748b"
              value={formData.recipientName}
              onChangeText={(text) => setFormData({ ...formData, recipientName: text })}
            />
            {!!errors.recipientName && <Text className="text-red-500 text-xs font-semibold ml-1">{errors.recipientName}</Text>}
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-slate-400 ml-1">Recipient Phone</Text>
            <TextInput
              className={`bg-slate-800 rounded-2xl h-[52px] px-4 text-slate-50 text-base border border-slate-700/50 ${errors.recipientPhone ? 'border-red-500' : ''}`}
              placeholder="Phone Number"
              placeholderTextColor="#64748b"
              keyboardType="phone-pad"
              value={formData.recipientPhone}
              onChangeText={(text) => setFormData({ ...formData, recipientPhone: text })}
            />
            {!!errors.recipientPhone && <Text className="text-red-500 text-xs font-semibold ml-1">{errors.recipientPhone}</Text>}
          </View>
        </View>

        {/* Delivery Constraint (Deadline) */}
        <View className="bg-slate-900 rounded-3xl p-5 border border-slate-700/50 gap-4">
          <View className="flex-row items-center gap-2.5 mb-1">
            <Clock size={20} color="#10b981" />
            <Text className="text-lg font-bold text-slate-50">Delivery Constraint</Text>
          </View>
          
          <View className="gap-2">
            <Text className="text-sm font-semibold text-slate-400 ml-1">Delivery Deadline</Text>
            <TouchableOpacity
              onPress={() => {
                setDatePickerMode('date');
                setShowDatePicker(true);
              }}
              className={`flex-row items-center bg-slate-800 rounded-2xl h-[52px] px-4 gap-3 border border-slate-700/50 ${errors.deliveryDeadline ? 'border-red-500' : ''}`}
              activeOpacity={0.7}
            >
              <Calendar size={18} color="#64748b" style={{ marginRight: 4 }} />
              <Text className="flex-1 text-slate-50 text-base">
                {formData.deliveryDeadline.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {formData.deliveryDeadline.toLocaleDateString('vi-VN')}
              </Text>
              <ChevronRight size={18} color="#64748b" />
            </TouchableOpacity>
            {!!errors.deliveryDeadline && <Text className="text-red-500 text-xs font-semibold ml-1">{errors.deliveryDeadline}</Text>}
          </View>
        </View>

        {errors.pickupLocation || errors.deliveryLocation ? (
          <View className="flex-row items-center bg-red-500/10 p-4 rounded-2xl gap-3 border border-red-500/20">
            <AlertCircle size={20} color="#ef4444" />
            <Text className="text-red-500 text-sm font-bold">Please select locations on the map</Text>
          </View>
        ) : null}

        <TouchableOpacity 
          className={`bg-indigo-500 h-[60px] rounded-[20px] justify-center items-center shadow-lg shadow-indigo-500/30 elevation-8 ${loading ? 'opacity-60' : ''}`}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-lg font-extrabold">
              {initialData?.id ? 'Update Order' : 'Create New Order'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={formData.deliveryDeadline}
          mode={datePickerMode}
          display="default"
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
          <View className="flex-1 justify-end bg-white/60">
            <View className="bg-slate-900 rounded-t-3xl border border-slate-700 pb-8">
              <View className="flex-row justify-between items-center p-4 border-b border-slate-700">
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text className="text-base text-slate-500 font-semibold">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-base font-bold text-slate-50">Select Deadline</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text className="text-base text-indigo-500 font-bold">Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={formData.deliveryDeadline}
                mode="datetime"
                display="spinner"
                onChange={(event, date) => {
                  if (date) setFormData({ ...formData, deliveryDeadline: date });
                }}
                textColor="#020617"
                themeVariant="light"
              />
            </View>
          </View>
        </Modal>
      )}
      {showCategoryModal && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showCategoryModal}
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <TouchableOpacity 
            className="flex-1 justify-end bg-black/60"
            activeOpacity={1}
            onPress={() => setShowCategoryModal(false)}
          >
            <View className="bg-slate-900 rounded-t-3xl border border-slate-700 pb-8 pt-4 px-5 max-h-[80%]">
              <View className="w-12 h-1.5 bg-slate-700 rounded-full self-center mb-5" />
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-slate-50">Phân loại hàng hoá</Text>
                <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                  <Text className="text-base text-indigo-500 font-bold">Đóng</Text>
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={{ gap: 12 }}>
                {categories.map((item) => {
                  const isSelected = formData.category === item.value;
                  return (
                    <TouchableOpacity
                      key={item.value}
                      onPress={() => {
                        setFormData({ ...formData, category: item.value as any });
                        setShowCategoryModal(false);
                      }}
                      className={`p-4 rounded-2xl border flex-row items-center justify-between ${
                        isSelected ? 'bg-indigo-500/10 border-indigo-500' : 'bg-slate-800 border-slate-700/50'
                      }`}
                    >
                      <View className="flex-1 pr-4">
                        <Text className={`font-bold text-base ${isSelected ? 'text-indigo-400' : 'text-slate-50'}`}>
                          {item.label}
                        </Text>
                        <Text className="text-xs text-slate-400 mt-1">{item.desc}</Text>
                      </View>
                      {isSelected && (
                        <View className="w-6 h-6 rounded-full bg-indigo-500 justify-center items-center">
                          <Text className="text-white text-xs font-bold">✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
};
