import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { 
  MapPin, 
  Scale, 
  FileText, 
  ChevronRight, 
  AlertCircle,
  Map as MapIcon
} from 'lucide-react-native';
import { Order, OrderStatus } from '../../../store/useOrderStore';
import { MapPicker } from './MapPicker';

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
  });

  const [pickingLocation, setPickingLocation] = useState<'pickup' | 'delivery' | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.pickupAddress) newErrors.pickupAddress = 'Required';
    if (!formData.deliveryAddress) newErrors.deliveryAddress = 'Required';
    if (!formData.weightKg || isNaN(Number(formData.weightKg))) newErrors.weightKg = 'Invalid weight';
    if (!formData.pickupLocation) newErrors.pickupLocation = 'Pick location on map';
    if (!formData.deliveryLocation) newErrors.deliveryLocation = 'Pick location on map';
    
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
        <View className="bg-slate-800 rounded-3xl p-5 border border-white/[0.08] gap-4">
          <View className="flex-row items-center gap-2.5 mb-1">
            <MapPin size={20} color="#f59e0b" />
            <Text className="text-lg font-bold text-slate-50">Pickup Details</Text>
          </View>
          
          <View className="gap-2">
            <Text className="text-sm font-semibold text-slate-400 ml-1">Address</Text>
            {formData.pickupAddress ? (
              <View className={`bg-[#0f172a] rounded-2xl p-4 border border-white/5 gap-1.5 ${(errors.pickupAddress || errors.pickupLocation) ? 'border-red-500' : ''}`}>
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
              <View className={`bg-[#0f172a] rounded-2xl p-4 border gap-1.5 border-dashed border-white/15 ${(errors.pickupAddress || errors.pickupLocation) ? 'border-red-500' : ''}`}>
                <Text className="text-sm text-slate-500 italic">
                  No pickup location selected. Please select a location on the map.
                </Text>
              </View>
            )}
            {!!errors.pickupAddress && <Text className="text-red-500 text-xs font-semibold ml-1">{errors.pickupAddress}</Text>}
          </View>

          <TouchableOpacity 
            className={`flex-row items-center bg-[#0f172a] rounded-2xl h-[52px] px-4 gap-3 border border-white/5 ${errors.pickupLocation ? 'border-red-500' : ''}`}
            onPress={() => setPickingLocation('pickup')}
          >
            <MapIcon size={20} color={formData.pickupLocation ? '#10b981' : '#64748b'} />
            <Text className={`flex-1 text-slate-500 text-[15px] font-semibold ${formData.pickupLocation ? 'text-emerald-500' : ''}`}>
              {formData.pickupLocation ? 'Pickup Location Set' : 'Set Pickup on Map'}
            </Text>
            <ChevronRight size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Delivery Section */}
        <View className="bg-slate-800 rounded-3xl p-5 border border-white/[0.08] gap-4">
          <View className="flex-row items-center gap-2.5 mb-1">
            <MapPin size={20} color="#10b981" />
            <Text className="text-lg font-bold text-slate-50">Delivery Details</Text>
          </View>
          
          <View className="gap-2">
            <Text className="text-sm font-semibold text-slate-400 ml-1">Address</Text>
            {formData.deliveryAddress ? (
              <View className={`bg-[#0f172a] rounded-2xl p-4 border border-white/5 gap-1.5 ${(errors.deliveryAddress || errors.deliveryLocation) ? 'border-red-500' : ''}`}>
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
              <View className={`bg-[#0f172a] rounded-2xl p-4 border gap-1.5 border-dashed border-white/15 ${(errors.deliveryAddress || errors.deliveryLocation) ? 'border-red-500' : ''}`}>
                <Text className="text-sm text-slate-500 italic">
                  No delivery location selected. Please select a location on the map.
                </Text>
              </View>
            )}
            {!!errors.deliveryAddress && <Text className="text-red-500 text-xs font-semibold ml-1">{errors.deliveryAddress}</Text>}
          </View>

          <TouchableOpacity 
            className={`flex-row items-center bg-[#0f172a] rounded-2xl h-[52px] px-4 gap-3 border border-white/5 ${errors.deliveryLocation ? 'border-red-500' : ''}`}
            onPress={() => setPickingLocation('delivery')}
          >
            <MapIcon size={20} color={formData.deliveryLocation ? '#10b981' : '#64748b'} />
            <Text className={`flex-1 text-slate-500 text-[15px] font-semibold ${formData.deliveryLocation ? 'text-emerald-500' : ''}`}>
              {formData.deliveryLocation ? 'Delivery Location Set' : 'Set Delivery on Map'}
            </Text>
            <ChevronRight size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Cargo Details */}
        <View className="bg-slate-800 rounded-3xl p-5 border border-white/[0.08] gap-4">
          <View className="flex-row items-center gap-2.5 mb-1">
            <Scale size={20} color="#6366f1" />
            <Text className="text-lg font-bold text-slate-50">Cargo Info</Text>
          </View>
          
          <View className="gap-2">
            <Text className="text-sm font-semibold text-slate-400 ml-1">Weight (kg)</Text>
            <TextInput
              className={`bg-[#0f172a] rounded-2xl h-[52px] px-4 text-slate-50 text-base border border-white/5 ${errors.weightKg ? 'border-red-500' : ''}`}
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
              className="bg-[#0f172a] rounded-2xl h-[100px] pt-4 px-4 text-slate-50 text-base border border-white/5"
              placeholder="Cargo type, handling instructions..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={4}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              style={{ textAlignVertical: 'top' }}
            />
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
    </KeyboardAvoidingView>
  );
};
