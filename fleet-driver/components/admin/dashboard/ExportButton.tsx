import React, { useState } from 'react';
import { TouchableOpacity, ActivityIndicator, Text, View } from 'react-native';
import { FileText, Share2 } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '../../../store/useAuthStore';
import Toast from 'react-native-toast-message';

interface ExportButtonProps {
  reportName: string;
  params?: Record<string, string>;
  color?: string;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export function ExportButton({ reportName, params = {}, color = '#6366f1' }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const { token } = useAuthStore();

  const handleExport = async (type: 'PDF' | 'EXCEL') => {
    setLoading(true);
    try {
      const queryString = new URLSearchParams({
        report_name: reportName,
        type,
        ...params,
      }).toString();

      const fileUri = `${(FileSystem as any).documentDirectory}${reportName}.${type === 'PDF' ? 'pdf' : 'xlsx'}`;
      
      const downloadResumable = (FileSystem as any).createDownloadResumable(
        `${API_URL}/reports/export?${queryString}`,
        fileUri,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await downloadResumable.downloadAsync();
      
      if (result && result.uri) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(result.uri);
        } else {
          Toast.show({
            type: 'info',
            text1: 'Download Complete',
            text2: `File saved to ${result.uri}`,
          });
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      Toast.show({
        type: 'error',
        text1: 'Export Failed',
        text2: 'Could not generate report file',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-row gap-3">
      <TouchableOpacity 
        onPress={() => handleExport('PDF')}
        disabled={loading}
        className="flex-row items-center bg-slate-900 border border-white/10 px-4 py-2 rounded-xl"
      >
        {loading ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <>
            <FileText size={16} color={color} />
            <Text className="text-slate-50 text-xs font-bold ml-2">PDF</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => handleExport('EXCEL')}
        disabled={loading}
        className="flex-row items-center bg-slate-900 border border-white/10 px-4 py-2 rounded-xl"
      >
        {loading ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <>
            <Share2 size={16} color={color} />
            <Text className="text-slate-50 text-xs font-bold ml-2">Excel</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}
