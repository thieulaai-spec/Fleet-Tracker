import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/ui/Themed';

export default function ModalScreen() {
  return (
    <View className='flex-1 justify-center items-center'>
      <Text className='text-4xl font-bold'>Modal</Text>
      <View className='my-5 h-[1px] w-4/5 bg-gray-200 dark:bg-gray-800' />
      <EditScreenInfo path="app/modal.tsx" />

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}
