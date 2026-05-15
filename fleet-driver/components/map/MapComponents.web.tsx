import React from 'react';
import { View, Text } from 'react-native';
import { Navigation } from 'lucide-react-native';

export const MapComponent = React.forwardRef(({ children, style }: any, ref: any) => (
  <View style={[style, { backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' }]}>
    <Navigation size={48} color="#6366f1" />
    <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 16 }}>Bản đồ không hỗ trợ trên Web</Text>
    <Text style={{ color: '#64748b', fontSize: 12 }}>GPS vẫn đang được gửi giả lập...</Text>
    {children}
  </View>
));

export const MarkerComponent = ({ children }: any) => <View>{children}</View>;
export const PolylineComponent = () => null;
export const PROVIDER_GOOGLE = 'google';
