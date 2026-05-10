import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Animated, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const NetworkBanner = () => {
  const [isOffline, setIsOffline] = useState(false);
  const translateY = new Animated.Value(-100);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = state.isConnected === false;
      setIsOffline(offline);
      
      Animated.spring(translateY, {
        toValue: offline ? 0 : -100,
        useNativeDriver: true,
        bounciness: 0,
      }).start();
    });

    return () => unsubscribe();
  }, []);

  return (
    <Animated.View style={[
      styles.container, 
      { transform: [{ translateY }] },
      { paddingTop: Platform.OS === 'ios' ? insets.top : 10 }
    ]}>
      <View style={styles.content}>
        <WifiOff size={18} color="#fff" />
        <Text style={styles.text}>No internet connection. Data will be queued.</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ef4444',
    zIndex: 9999,
    paddingBottom: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
