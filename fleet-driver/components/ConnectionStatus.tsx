import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { useTripStore } from '../store/useTripStore';

export const ConnectionStatus = () => {
  const isSocketConnected = useTripStore((state) => state.isSocketConnected);

  if (isSocketConnected) return null;

  return (
    <View style={styles.container}>
      <WifiOff size={14} color="#f87171" />
      <Text style={styles.text}>OFFLINE</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  text: {
    color: '#f87171',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
