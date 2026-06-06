import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { X, Search } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ActivityLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'all' | 'order' | 'trip' | 'alert';
  setActiveTab: (tab: 'all' | 'order' | 'trip' | 'alert') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredActivities: any[];
  renderActivityItem: (activity: any, idx: number, array: any[]) => React.ReactNode;
}

export const ActivityLogsModal: React.FC<ActivityLogsModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  filteredActivities,
  renderActivityItem,
}) => {
  if (!isOpen) return null;

  return (
    <View className="absolute inset-0 bg-slate-950 z-50 p-5">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold text-slate-50">Operational Logs</Text>
          <TouchableOpacity 
            onPress={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 justify-center items-center"
          >
            <X size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Filtering Tabs */}
        <View className="flex-row justify-between mb-4 gap-1">
          {(['all', 'order', 'trip', 'alert'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-1 rounded-xl items-center border ${
                activeTab === tab 
                  ? 'bg-indigo-600 border-indigo-500' 
                  : 'bg-slate-800 border-slate-700'
              }`}
            >
              <Text className={`text-[10px] font-bold uppercase tracking-wider ${
                activeTab === tab ? 'text-slate-50' : 'text-slate-400'
              }`}>
                {tab === 'all' ? 'All' : `${tab}s`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search Box */}
        <View className="flex-row items-center bg-slate-800 px-4 py-3 rounded-2xl border border-slate-700 mb-6">
          <Search size={16} color="#94a3b8" />
          <TextInput
            placeholder="Search history logs..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-slate-200 text-sm ml-2 outline-none"
          />
        </View>

        {/* Scrollable Timeline */}
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {filteredActivities.length === 0 ? (
            <View className="bg-slate-900/40 py-12 rounded-3xl items-center border border-dashed border-slate-800">
              <Text className="text-slate-400 text-sm font-medium">No matching logs found.</Text>
            </View>
          ) : (
            filteredActivities.map((activity, idx, arr) => renderActivityItem(activity, idx, arr))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
