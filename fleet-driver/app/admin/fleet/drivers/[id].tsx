import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  User as UserIcon,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
} from "lucide-react-native";
import {
  useFleetStore,
  Driver,
  DriverStatus,
} from "../../../../store/useFleetStore";
import { DriverForm } from "../../../../components/admin/DriverForm";

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

  useEffect(() => {
    if (id && id !== "create") {
      const found = drivers.find((d) => d.id === id);
      setDriver(found);
    }
  }, [id, drivers]);

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

          <View className="p-5 gap-5">
            <View className="bg-slate-800 rounded-[24px] p-5 border border-white/10">
              <Text className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-5">Contact Details</Text>

              <View className="flex-row items-center gap-4 mb-5">
                <Mail size={20} color="#64748b" />
                <View>
                  <Text className="text-xs text-slate-500 font-semibold">Email</Text>
                  <Text className="text-base text-slate-50 font-bold">{driver?.user.email}</Text>
                </View>
              </View>

              <View className="flex-row items-center gap-4">
                <Phone size={20} color="#64748b" />
                <View>
                  <Text className="text-xs text-slate-500 font-semibold">Phone</Text>
                  <Text className="text-base text-slate-50 font-bold">
                    {driver?.user.phone || "Not provided"}
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-slate-800 rounded-[24px] p-5 border border-white/10">
              <Text className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-5">License Information</Text>

              <View className="flex-row items-center gap-4 mb-5">
                <ShieldCheck size={20} color="#64748b" />
                <View>
                  <Text className="text-xs text-slate-500 font-semibold">Class</Text>
                  <Text className="text-base text-slate-50 font-bold">
                    {driver?.licenseClass || "N/A"}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-4">
                <Calendar size={20} color="#64748b" />
                <View>
                  <Text className="text-xs text-slate-500 font-semibold">Expiry Date</Text>
                  <Text className="text-base text-slate-50 font-bold">
                    {driver?.licenseExpiry
                      ? new Date(driver.licenseExpiry).toLocaleDateString()
                      : "N/A"}
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-slate-800 rounded-[24px] p-5 border border-white/10">
              <Text className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-5">Activity</Text>
              <View className="flex-row gap-3">
                <View className="flex-1 bg-white/[0.03] p-4 rounded-2xl items-center">
                  <Text className="text-xl font-extrabold text-indigo-500">24</Text>
                  <Text className="text-[11px] text-slate-500 font-bold mt-1">Trips</Text>
                </View>
                <View className="flex-1 bg-white/[0.03] p-4 rounded-2xl items-center">
                  <Text className="text-xl font-extrabold text-indigo-500">4.8</Text>
                  <Text className="text-[11px] text-slate-500 font-bold mt-1">Rating</Text>
                </View>
                <View className="flex-1 bg-white/[0.03] p-4 rounded-2xl items-center">
                  <Text className="text-xl font-extrabold text-indigo-500">120h</Text>
                  <Text className="text-[11px] text-slate-500 font-bold mt-1">On Duty</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
