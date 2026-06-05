import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Truck, Map, User, LayoutDashboard, MapPin, Package, Users, History } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';

export default function TabLayout() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Redirect href="/login" />;
  }

  const isAdmin = user.role?.toUpperCase() === 'ADMIN';

  return (
    <Tabs
      key={user.id}
      screenOptions={{
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
          fontWeight: '900',
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
        tabBarIconStyle: {
          marginTop: 8,
        },
        tabBarItemStyle: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 24,
          left: 16,
          right: 16,
          height: 72,
          elevation: 8,
          backgroundColor: 'transparent',
          borderRadius: 32,
          borderTopWidth: 0,
          borderWidth: 1.5,
          borderColor: 'rgba(16, 185, 129, 0.3)',
          paddingBottom: 0,
          shadowColor: '#047857',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
        },
        tabBarBackground: () => (
          <BlurView 
            intensity={Platform.OS === 'ios' ? 85 : 50} 
            tint="light" 
            style={[StyleSheet.absoluteFill, { borderRadius: 32, overflow: 'hidden', backgroundColor: 'rgba(240, 253, 244, 0.95)' }]} 
          />
        ),
        headerShown: false,
      }}>
      {/* Driver Tabs */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trips',
          href: !isAdmin ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Truck size={focused ? 26 : 22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Active Map',
          href: !isAdmin ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Map size={focused ? 26 : 22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          href: !isAdmin ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <History size={focused ? 26 : 22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />

      {/* Admin Tabs */}
      <Tabs.Screen
        name="admin-dashboard"
        options={{
          title: 'Dash',
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <LayoutDashboard size={focused ? 26 : 22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin-tracking"
        options={{
          title: 'Tracking',
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <MapPin size={focused ? 26 : 22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin-orders"
        options={{
          title: 'Orders',
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Package size={focused ? 26 : 22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin-fleet"
        options={{
          title: 'Fleet',
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Users size={focused ? 26 : 22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />

      {/* Shared Tabs */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <User size={focused ? 26 : 22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}

