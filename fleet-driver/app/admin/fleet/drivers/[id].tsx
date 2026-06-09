import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { useAuthStore } from "../../../../store/useAuthStore";
import {
  useFleetStore,
  Driver,
} from "../../../../store/useFleetStore";
import { DriverForm } from "../../../../components/admin/fleet/DriverForm";

// Import our modular sub-components
import { DriverContact } from "../../../../components/admin/fleet/DriverContact";
import { DriverLicense } from "../../../../components/admin/fleet/DriverLicense";
import { DriverKpi } from "../../../../components/admin/fleet/DriverKpi";
import { DriverJourneyTimeline } from "../../../../components/admin/fleet/DriverJourneyTimeline";
import { DriverKpiModal } from "../../../../components/profile/DriverKpiModal";

import { DriverHeader } from "../../../../components/admin/fleet/DriverHeader";
import { DriverProfileCard } from "../../../../components/admin/fleet/DriverProfileCard";
import { FingerprintStatusCard } from "../../../../components/admin/fleet/FingerprintStatusCard";
import { DriverDetailTabs } from "../../../../components/admin/fleet/DriverDetailTabs";

export default function DriverDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { drivers, loading, updateDriver, deleteDriver, createDriver, clearFingerprint } =
    useFleetStore();

  const [driver, setDriver] = useState<Driver | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(id === "create");
  const [kpi, setKpi] = useState<any>(null);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'journey'>('info');
  const [verifications, setVerifications] = useState<any[]>([]);
  const [verificationsLoading, setVerificationsLoading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [tripHistory, setTripHistory] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [activeKpiDetail, setActiveKpiDetail] = useState<'trips' | 'completion' | 'violations' | 'score' | null>(null);

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    if (id && id !== "create") {
      const found = drivers.find((d) => d.id === id);
      setDriver(found);
    }
  }, [id, drivers]);

  useEffect(() => {
    const fetchKpi = async () => {
      if (id && id !== "create") {
        setKpiLoading(true);
        try {
          const { token } = useAuthStore.getState();
          const response = await axios.get(`${API_URL}/reports/driver-kpi/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setKpi(response.data.data || response.data);
        } catch (error) {
          console.error("Failed to fetch driver KPI:", error);
        } finally {
          setKpiLoading(false);
        }
      }
    };
    const fetchVerifications = async () => {
      if (id && id !== "create") {
        setVerificationsLoading(true);
        try {
          const { token } = useAuthStore.getState();
          const response = await axios.get(`${API_URL}/drivers/${id}/verifications`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setVerifications(response.data.data || response.data || []);
        } catch (error) {
          console.error("Failed to fetch driver verifications:", error);
        } finally {
          setVerificationsLoading(false);
        }
      }
    };
    const fetchTripHistory = async () => {
      if (id && id !== "create") {
        try {
          const { token } = useAuthStore.getState();
          const response = await axios.get(`${API_URL}/trips?driverId=${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setTripHistory(response.data.data || response.data || []);
        } catch (error) {
          console.error("Failed to fetch driver trip history:", error);
        }
      }
    };
    const fetchAlerts = async () => {
      if (id && id !== "create") {
        try {
          const { token } = useAuthStore.getState();
          const response = await axios.get(`${API_URL}/alerts?driverId=${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setAlerts(response.data.data || response.data || []);
        } catch (error) {
          console.error("Failed to fetch driver alerts:", error);
        }
      }
    };
    fetchKpi();
    fetchVerifications();
    fetchTripHistory();
    fetchAlerts();
  }, [id]);

  const handleDelete = () => {
    Alert.alert(
      "Delete Driver",
      "Are you sure you want to remove this driver from the fleet?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDriver(id as string);
              router.back();
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ],
    );
  };

  const handleSubmit = async (data: any) => {
    try {
      if (id === "create") {
        await createDriver(data);
        Alert.alert("Success", "Driver created successfully");
      } else {
        await updateDriver(id as string, data);
        Alert.alert("Success", "Driver updated successfully");
        setIsEditing(false);
      }
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleClearFingerprintPrompt = () => {
    if (!driver) return;
    Alert.alert(
      "Xóa vân tay",
      `Bạn có chắc chắn muốn xóa đăng ký vân tay (#${driver.fingerprintId}) của tài xế ${driver.user.fullName}?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await clearFingerprint(driver.id);
              Alert.alert("Thành công", "Đã xóa đăng ký vân tay của tài xế.");
            } catch (error: any) {
              Alert.alert("Lỗi", error.message);
            }
          }
        }
      ]
    );
  };

  if (loading && !driver && id !== "create") {
    return (
      <SafeAreaView className="flex-1 bg-slate-950">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 justify-center items-center gap-4">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="text-slate-400 text-base">Loading driver info...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!driver && id !== "create") {
    return (
      <SafeAreaView className="flex-1 bg-slate-950">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 justify-center items-center gap-4">
          <Text className="text-red-500 text-lg font-bold">Driver not found</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="px-4 py-2 rounded-xl bg-white/5 justify-center items-center"
          >
            <Text style={{ color: "#6366f1" }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <DriverHeader
        onBack={() => router.back()}
        isCreate={id === "create"}
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing(!isEditing)}
        onDelete={handleDelete}
      />

      {isEditing ? (
        <DriverForm
          initialData={driver}
          onSubmit={handleSubmit}
          loading={loading}
        />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <DriverProfileCard driver={driver} />

          {/* Segmented Tab Selector */}
          <DriverDetailTabs
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab)}
          />

          {activeTab === 'info' && driver && (
            <View className="p-5 gap-5">
              <FingerprintStatusCard
                driver={driver}
                onClearFingerprint={handleClearFingerprintPrompt}
              />

              <DriverContact driver={driver} />
              <DriverLicense driver={driver} />
              <DriverKpi 
                kpi={kpi} 
                kpiLoading={kpiLoading} 
                onCardPress={(type) => setActiveKpiDetail(type)} 
              />
            </View>
          )}

          {activeTab === 'journey' && (
            <View className="p-5 gap-5">
              <DriverJourneyTimeline
                verifications={verifications}
                verificationsLoading={verificationsLoading}
                onImagePress={setLightboxImage}
              />
            </View>
          )}
        </ScrollView>
      )}

      {/* Fullscreen Lightbox Modal */}
      {lightboxImage && (
        <View className="absolute inset-0 bg-black/95 z-50 justify-center items-center p-5">
          <TouchableOpacity 
            onPress={() => setLightboxImage(null)}
            className="absolute top-12 right-6 w-10 h-10 rounded-full bg-white/10 justify-center items-center"
          >
            <Text className="text-white text-lg font-bold">✕</Text>
          </TouchableOpacity>
          <Image 
            source={{ uri: lightboxImage }} 
            className="w-full h-[70%]"
            resizeMode="contain"
          />
        </View>
      )}

      <DriverKpiModal
        isOpen={activeKpiDetail !== null}
        onClose={() => setActiveKpiDetail(null)}
        activeKpiDetail={activeKpiDetail}
        tripHistory={tripHistory}
        kpi={kpi}
        alerts={alerts}
      />
    </SafeAreaView>
  );
}
