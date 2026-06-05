import React, { useState, useEffect } from 'react';
import { Text, View, Animated, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff, AlertCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

export const NetworkBanner = () => {
  const [isOffline, setIsOffline] = useState(false);
  const translateY = React.useRef(new Animated.Value(-120)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = state.isConnected === false;
      setIsOffline(offline);
      
      Animated.spring(translateY, {
        toValue: offline ? 0 : -120,
        useNativeDriver: true,
        bounciness: 4,
        speed: 10,
      }).start();
    });

    return () => unsubscribe();
  }, [translateY]);

  return (
    <Animated.View 
      className="absolute top-0 left-0 right-0 z-[9999] overflow-hidden"
      style={[
        { transform: [{ translateY }] },
      ]}
    >
      <BlurView intensity={80} tint="light" className="border-b border-red-500/30 shadow-2xl shadow-black/50">
        <View 
          className="flex-row items-center justify-center gap-3 px-6 pb-4"
          style={{ paddingTop: Platform.OS === 'ios' ? insets.top + 8 : 16 }}
        >
          <View className="w-8 h-8 rounded-full bg-red-500/20 items-center justify-center border border-red-500/40">
            <WifiOff size={16} color="#ef4444" strokeWidth={2.5} />
          </View>
          <View className="flex-1">
            <Text className="text-red-50 font-bold text-[13px] leading-tight">Connection Lost</Text>
            <Text className="text-red-200/60 text-[11px]">Sync will resume once connection is restored</Text>
          </View>
          <AlertCircle size={18} color="#ef4444" opacity={0.6} />
        </View>
      </BlurView>
    </Animated.View>
  );
};

