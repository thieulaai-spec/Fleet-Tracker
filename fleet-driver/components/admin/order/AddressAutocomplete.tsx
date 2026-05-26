import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Search, MapPin, X } from 'lucide-react-native';
import axios from 'axios';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

interface AddressAutocompleteProps {
  value: string;
  placeholder: string;
  onSelect: (address: string, coordinates: [number, number]) => void;
  error?: string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  placeholder,
  onSelect,
  error,
}) => {
  const [input, setInput] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setInput(value);
  }, [value]);

  const fetchSuggestions = async (text: string) => {
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          text
        )}.json`,
        {
          params: {
            access_token: MAPBOX_TOKEN,
            autocomplete: true,
            limit: 5,
          },
        }
      );
      setSuggestions(response.data.features || []);
    } catch (error) {
      console.error('Mapbox search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Simple debounce logic
  const debounce = (func: Function, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const debouncedFetch = useCallback(debounce(fetchSuggestions, 500), []);

  const handleChangeText = (text: string) => {
    setInput(text);
    if (text.length >= 3) {
      setShowSuggestions(true);
      debouncedFetch(text);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleSelect = (item: any) => {
    const address = item.place_name;
    const coords = item.center; // [lng, lat]
    setInput(address);
    setSuggestions([]);
    setShowSuggestions(false);
    onSelect(address, coords);
  };

  const clearInput = () => {
    setInput('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <View className="z-10 w-full">
      <View className={`flex-row items-center bg-slate-900 rounded-2xl h-[52px] px-3 border border-white/5 ${error ? 'border-red-500' : ''}`}>
        <Search size={18} color="#64748b" style={{ marginRight: 10 }} />
        <TextInput
          className="flex-1 color-slate-50 text-base h-full"
          value={input}
          placeholder={placeholder}
          placeholderTextColor="#64748b"
          onChangeText={handleChangeText}
          onFocus={() => input.length >= 3 && setShowSuggestions(true)}
        />
        {loading ? (
          <ActivityIndicator size="small" color="#6366f1" className="p-1" />
        ) : input.length > 0 ? (
          <TouchableOpacity onPress={clearInput} className="p-1">
            <X size={18} color="#64748b" />
          </TouchableOpacity>
        ) : null}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View 
          className="absolute top-14 left-0 right-0 bg-slate-800 rounded-2xl border border-white/10 max-h-[250px] z-50"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          <ScrollView
            className="rounded-2xl"
            keyboardShouldPersistTaps="handled"
          >
            {suggestions.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="flex-row p-3.5 border-b border-white/5 items-center"
                onPress={() => handleSelect(item)}
              >
                <MapPin size={16} color="#6366f1" style={{ marginRight: 12 }} />
                <View className="flex-1">
                  <Text className="color-slate-50 text-[15px] font-semibold" numberOfLines={1}>
                    {item.text}
                  </Text>
                  <Text className="color-slate-500 text-xs mt-0.5" numberOfLines={1}>
                    {item.place_name.replace(`${item.text}, `, '')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      {!!error && <Text className="color-red-500 text-xs font-semibold mt-1 ml-1">{error}</Text>}
    </View>
  );
};

