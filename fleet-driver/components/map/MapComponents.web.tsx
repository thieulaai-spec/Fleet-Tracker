import React from 'react';
import { View, Text } from 'react-native';

export const MapComponent = React.forwardRef(({ children, style }: any, ref: any) => (
  <View style={[style, { backgroundColor: '#0f172a', overflow: 'hidden', position: 'relative' }]}>
    {/* Grid & Radar Circles */}
    <View 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.15,
      }}
      pointerEvents="none"
    >
      {/* Dynamic grid rings */}
      <View style={{ width: 150, height: 150, borderRadius: 75, borderWidth: 1, borderColor: '#6366f1', position: 'absolute' }} />
      <View style={{ width: 350, height: 350, borderRadius: 175, borderWidth: 1, borderColor: '#6366f1', position: 'absolute' }} />
      <View style={{ width: 600, height: 600, borderRadius: 300, borderWidth: 1, borderColor: '#6366f1', position: 'absolute' }} />
      <View style={{ width: 900, height: 900, borderRadius: 450, borderWidth: 1, borderColor: '#6366f1', position: 'absolute' }} />
      
      {/* Grid cross lines */}
      <View style={{ width: '100%', height: 1, backgroundColor: '#6366f1', position: 'absolute' }} />
      <View style={{ width: 1, height: '100%', backgroundColor: '#6366f1', position: 'absolute' }} />
    </View>

    {/* Live Radar Header */}
    <View 
      style={{ 
        position: 'absolute', 
        top: 24, 
        left: 24, 
        zIndex: 5,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
      }}
      pointerEvents="none"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 8, opacity: 0.8 }} />
        <Text style={{ color: '#f8fafc', fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>LIVE RADAR (WEB)</Text>
      </View>
      <Text style={{ color: '#94a3b8', fontSize: 10, marginTop: 4 }}>Simulated real-time HCMC tracking</Text>
    </View>

    {children}
  </View>
));

export const MarkerComponent = ({ coordinate, rotation, children }: any) => {
  if (!coordinate) return <View>{children}</View>;

  // Map HCMC coordinate (lat ~10.7-10.85, lng ~106.55-106.75) to percentage left/top
  const minLat = 10.70;
  const maxLat = 10.85;
  const minLng = 106.55;
  const maxLng = 106.75;

  const left = ((coordinate.longitude - minLng) / (maxLng - minLng)) * 100;
  const top = ((maxLat - coordinate.latitude) / (maxLat - minLat)) * 100;

  // Constrain coordinates to keep markers within visual boundary
  const constrainedLeft = Math.min(Math.max(left, 5), 95);
  const constrainedTop = Math.min(Math.max(top, 5), 95);

  return (
    <View
      style={{
        position: 'absolute',
        left: `${constrainedLeft}%`,
        top: `${constrainedTop}%`,
        transform: [
          { translateX: -18 },
          { translateY: -18 },
          { rotate: `${rotation || 0}deg` }
        ],
        zIndex: 10,
      }}
    >
      {children}
    </View>
  );
};

export const PolylineComponent = () => null;
export const PROVIDER_GOOGLE = 'google';
