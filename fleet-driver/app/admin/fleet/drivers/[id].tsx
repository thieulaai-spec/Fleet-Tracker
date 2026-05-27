import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  User as UserIcon,
} from "lucide-react-native";
import axios from "axios";
import { useAuthStore } from "../../../../store/useAuthStore";
import {
  useFleetStore,
  Driver,
  DriverStatus,
} from "../../../../store/useFleetStore";
import { DriverForm } from "../../../../components/admin/fleet/DriverForm";

// Import our modular sub-components
import { DriverContact } from "../../../../components/admin/fleet/DriverContact";
import { DriverLicense } from "../../../../components/admin/fleet/DriverLicense";
import { DriverKpi } from "../../../../components/admin/fleet/DriverKpi";
import { DriverKpiChart } from "../../../../components/admin/fleet/DriverKpiChart";
import { DriverJourneyTimeline } from "../../../../components/admin/fleet/DriverJourneyTimeline";

const STATUS_CONFIG = {
  [DriverStatus.AVAILABLE]: { label: "Available", color: "#10b981" },
  [DriverStatus.ON_TRIP]: { label: "On Trip", color: "#6366f1" },
  [DriverStatus.OFF_DUTY]: { label: "Off Duty", color: "#94a3b8" },
};

export default function DriverDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { drivers, loading, updateDriver, deleteDriver, createDriver } =
    useFleetStore();

  const [driver, setDriver] = useState<Driver | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(id === "create");
  const [kpi, setKpi] = useState<any>(null);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'journey'>('info');
  const [verifications, setVerifications] = useState<any[]>([]);
  const [verificationsLoading, setVerificationsLoading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

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
          const response = await axios.get(`${API_URL}/drivers/${id}/kpi`, {
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
    fetchKpi();
    fetchVerifications();
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

  const status = driver
    ? STATUS_CONFIG[driver.status] || STATUS_CONFIG[DriverStatus.OFF_DUTY]
    : null;

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center px-4 py-3 gap-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/5 justify-center items-center"
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="flex-1 text-xl font-extrabold text-white">
          {id === "create" ? "New Driver" : "Driver Detail"}
        </Text>
        {id !== "create" && (
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setIsEditing(!isEditing)}
              className="w-10 h-10 rounded-full bg-white/5 justify-center items-center"
            >
              <Edit3 size={20} color={isEditing ? "#10b981" : "#6366f1"} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              className="w-10 h-10 rounded-full bg-white/5 justify-center items-center"
            >
              <Trash2 size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isEditing ? (
        <DriverForm
          initialData={driver}
          onSubmit={handleSubmit}
          loading={loading}
        />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="items-center py-8 bg-slate-800 rounded-b-[32px] border-b border-x border-white/5">
            <View className="w-24 h-24 rounded-[32px] bg-indigo-500/10 justify-center items-center mb-4">
              <UserIcon size={48} color="#6366f1" />
            </View>
            <Text className="text-2xl font-bold text-slate-50 mb-2">{driver?.user.fullName}</Text>
            {status && (
              <View
                className="flex-row items-center px-3 py-1.5 rounded-xl gap-2"
                style={{ backgroundColor: `${status.color}20` }}
              >
                <View
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                <Text
                  className="text-xs font-extrabold uppercase"
                  style={{ color: status.color }}
                >
                  {status.label}
                </Text>
              </View>
            )}
          </View>

          {/* Segmented Tab Selector */}
          <View className="flex-row border-b border-white/5 mx-5 mt-6 mb-2">
            <TouchableOpacity
              onPress={() => setActiveTab('info')}
              className="flex-1 pb-3 items-center"
              style={{ borderBottomWidth: activeTab === 'info' ? 2 : 0, borderBottomColor: '#6366f1' }}
            >
              <Text className={`text-sm font-extrabold uppercase tracking-wider ${activeTab === 'info' ? 'text-indigo-400' : 'text-slate-400'}`}>Thông tin</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('journey')}
              className="flex-1 pb-3 items-center"
              style={{ borderBottomWidth: activeTab === 'journey' ? 2 : 0, borderBottomColor: '#6366f1' }}
            >
              <Text className={`text-sm font-extrabold uppercase tracking-wider ${activeTab === 'journey' ? 'text-indigo-400' : 'text-slate-400'}`}>Hành trình minh chứng</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'info' && driver && (
            <View className="p-5 gap-5">
              <DriverContact driver={driver} />
              <DriverLicense driver={driver} />
              <DriverKpi kpi={kpi} kpiLoading={kpiLoading} />
              <DriverKpiChart kpi={kpi} kpiLoading={kpiLoading} />
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
    </SafeAreaView>
  );
}
