import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { Stack, useRouter } from 'expo-router';
import { OrderForm } from '../../../components/admin/order/OrderForm';
import { useOrderStore } from '../../../store/useOrderStore';
import Toast from 'react-native-toast-message';

export default function CreateOrderScreen() {
  const router = useRouter();
  const { createOrder, loading } = useOrderStore();

  const handleSubmit = async (data: any) => {
    try {
      await createOrder(data);
      Toast.show({
        type: 'success',
        text1: 'Order Created',
        text2: 'Order has been successfully added to the system.',
      });
      router.back();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Creation Failed',
        text2: error.message || 'Something went wrong',
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center justify-between px-4 h-[60px] border-b border-white/5">
        <TouchableOpacity 
          className="w-10 h-10 rounded-xl bg-slate-800 justify-center items-center"
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text className="text-xl font-extrabold text-slate-50 tracking-[0.5px]">New Order</Text>
        <View className="w-10" />
      </View>

      <OrderForm onSubmit={handleSubmit} loading={loading} />
    </SafeAreaView>
  );
}
