import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal
} from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Order, OrderStatus } from '../../../store/useOrderStore';
import { MapPicker } from './MapPicker';
import { LocationSection } from './order-form/LocationSection';
import { CargoDetailsSection } from './order-form/CargoDetailsSection';
import { RecipientSection } from './order-form/RecipientSection';
import { DeadlineSection } from './order-form/DeadlineSection';
import { CategoryModal } from './order-form/CategoryModal';

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
        <LocationSection
          type="pickup"
          address={formData.pickupAddress}
          locationCoordinates={formData.pickupLocation}
          errors={errors}
          onSetPickingLocation={setPickingLocation}
        />

        {/* Delivery Section */}
        <LocationSection
          type="delivery"
          address={formData.deliveryAddress}
          locationCoordinates={formData.deliveryLocation}
          errors={errors}
          onSetPickingLocation={setPickingLocation}
        />

        {/* Cargo Details */}
        <CargoDetailsSection
          weightKg={formData.weightKg}
          onWeightKgChange={(text) => setFormData({ ...formData, weightKg: text })}
          description={formData.description}
          onDescriptionChange={(text) => setFormData({ ...formData, description: text })}
          category={formData.category}
          onOpenCategoryModal={() => setShowCategoryModal(true)}
          priority={formData.priority}
          onPriorityChange={(value) => setFormData({ ...formData, priority: value })}
          errors={errors}
        />

        {/* Recipient Details */}
        <RecipientSection
          recipientName={formData.recipientName}
          onRecipientNameChange={(text) => setFormData({ ...formData, recipientName: text })}
          recipientPhone={formData.recipientPhone}
          onRecipientPhoneChange={(text) => setFormData({ ...formData, recipientPhone: text })}
          errors={errors}
        />

        {/* Delivery Constraint (Deadline) */}
        <DeadlineSection
          deliveryDeadline={formData.deliveryDeadline}
          errors={errors}
          onOpenDatePicker={() => {
            setDatePickerMode('date');
            setShowDatePicker(true);
          }}
        />

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

      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        selectedCategory={formData.category}
        onSelectCategory={(value) => setFormData({ ...formData, category: value as any })}
      />
    </KeyboardAvoidingView>
  );
};
