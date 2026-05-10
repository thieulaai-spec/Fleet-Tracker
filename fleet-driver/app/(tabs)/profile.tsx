import React from 'react';
import { StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useAuthStore } from '@/store/useAuthStore';
import { useTripStore } from '@/store/useTripStore';
import { 
  User, 
  Mail, 
  Shield, 
  Truck, 
  LogOut, 
  ChevronRight, 
  Settings, 
  Info,
  Phone,
  CreditCard,
  Trophy,
  Activity,
  Clock,
  Map
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { tripHistory, activeTrip } = useTripStore();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/login');
          } 
        },
      ]
    );
  };

  const completedTrips = tripHistory.filter(t => t.status === 'completed');
  const performanceValue = tripHistory.length > 0 
    ? Math.round((completedTrips.length / tripHistory.length) * 100) 
    : 100;
  
  const totalDistance = tripHistory.reduce((acc, trip) => acc + (trip.totalDistanceKm || 0), 0);
  
  // Calculate real avg speed based on completed trips duration and distance
  const calculateAvgSpeed = () => {
    if (completedTrips.length === 0) return 0;
    
    let totalHours = 0;
    let distanceWithTime = 0;
    
    completedTrips.forEach(trip => {
      if (trip.startedAt && trip.completedAt) {
        const start = new Date(trip.startedAt).getTime();
        const end = new Date(trip.completedAt).getTime();
        const durationHours = (end - start) / (1000 * 60 * 60);
        
        if (durationHours > 0) {
          totalHours += durationHours;
          distanceWithTime += (trip.totalDistanceKm || 0);
        }
      }
    });
    
    if (totalHours === 0) return 0;
    return (distanceWithTime / totalHours).toFixed(1);
  };

  const avgSpeed = calculateAvgSpeed();

  const stats = [
    { label: 'Completed', value: completedTrips.length, icon: Trophy, color: '#fbbf24' },
    { label: 'Total Km', value: totalDistance.toFixed(1), icon: Map, color: '#10b981' },
    { label: 'Avg Speed', value: `${avgSpeed} km/h`, icon: Activity, color: '#6366f1' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImagePlaceholder}>
            <User size={40} color="#6366f1" />
          </View>
        </View>
        <Text style={styles.userName}>{user?.fullName || 'Driver Name'}</Text>
        <View style={styles.roleBadge}>
          <Shield size={14} color="#6366f1" />
          <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'DRIVER'}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statBox}>
            <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}15` }]}>
              <stat.icon size={20} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Mail size={20} color="#94a3b8" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Phone size={20} color="#94a3b8" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>+84 912 345 678</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <CreditCard size={20} color="#94a3b8" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>License Class</Text>
              <Text style={styles.infoValue}>Class C • 24-558291</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Truck size={20} color="#94a3b8" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Active Vehicle</Text>
              <Text style={styles.infoValue}>
                {activeTrip ? `Vehicle ID: ${activeTrip.vehicleId.substring(0, 8).toUpperCase()}` : 'No active vehicle'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Trip History</Text>
        <View style={styles.historyCard}>
          {tripHistory.length > 0 ? (
            tripHistory.slice(0, 5).map((trip, idx) => (
              <View key={trip.id} style={[styles.historyItem, idx !== 0 && styles.borderTop]}>
                <View>
                  <Text style={styles.historyId}>TRIP #{trip.id.substring(0, 8).toUpperCase()}</Text>
                  <Text style={styles.historyDate}>{new Date(trip.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: trip.status === 'completed' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: trip.status === 'completed' ? '#4ade80' : '#f87171' }
                  ]}>
                    {trip.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No trip history yet.</Text>
          )}
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings & Support</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Settings size={20} color="#94a3b8" />
              <Text style={styles.menuItemText}>App Settings</Text>
            </View>
            <ChevronRight size={20} color="#475569" />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, styles.borderTop]}>
            <View style={styles.menuItemLeft}>
              <Info size={20} color="#94a3b8" />
              <Text style={styles.menuItemText}>Help & Support</Text>
            </View>
            <ChevronRight size={20} color="#475569" />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color="#ef4444" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
      
      <Text style={styles.versionText}>Version 1.0.2 (Build 20240510)</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 3,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    marginBottom: 15,
  },
  profileImagePlaceholder: {
    flex: 1,
    borderRadius: 47,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  roleText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: -25,
  },
  statBox: {
    backgroundColor: '#1e293b',
    width: '30%',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 1,
  },
  infoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 15,
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    color: '#64748b',
    fontSize: 12,
  },
  infoValue: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 12,
    marginLeft: 35,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuCard: {
    backgroundColor: '#1e293b',
    borderRadius: 15,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  menuItemText: {
    color: '#f8fafc',
    fontSize: 16,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginHorizontal: 20,
    marginTop: 40,
    padding: 15,
    borderRadius: 15,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    color: '#475569',
    fontSize: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  historyCard: {
    backgroundColor: '#1e293b',
    borderRadius: 15,
    overflow: 'hidden',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  historyId: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  historyDate: {
    color: '#64748b',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#64748b',
    padding: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
