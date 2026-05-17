import React from 'react';
import { Tabs } from 'expo-router';
import { Truck, Map, User, LayoutDashboard, MapPin, Package, Users } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';

export default function TabLayout() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return null;
  }

  const isAdmin = user.role?.toUpperCase() === 'ADMIN';

  return (
    <Tabs
      key={user.id}
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#94a3b8',
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
          elevation: 0,
          backgroundColor: 'transparent',
          borderRadius: 32,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.12)',
          paddingBottom: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.4,
          shadowRadius: 24,
        },
        tabBarBackground: () => (
          <BlurView 
            intensity={Platform.OS === 'ios' ? 80 : 40} 
            tint="dark" 
            style={[StyleSheet.absoluteFill, { borderRadius: 32, overflow: 'hidden', backgroundColor: 'rgba(15, 23, 42, 0.6)' }]} 
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

