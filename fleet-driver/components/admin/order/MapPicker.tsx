import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  ScrollView, 
  Keyboard 
} from 'react-native';
import { MapComponent, MarkerComponent, PROVIDER_GOOGLE } from '../../map/MapComponents';
import { MapPin, Check, X, Target, Search } from 'lucide-react-native';
import * as Location from 'expo-location';
import { BlurView } from 'expo-blur';
import axios from 'axios';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

interface MapPickerProps {
  initialLocation?: { latitude: number; longitude: number };
  initialAddress?: string;
  onSelect: (location: { latitude: number; longitude: number }, address: string) => void;
  onCancel: () => void;
  title: string;
}

export const MapPicker: React.FC<MapPickerProps> = ({ 
  initialLocation, 
  initialAddress,
  onSelect, 
  onCancel,
  title 
}) => {
  const [region, setRegion] = useState({
    latitude: initialLocation?.latitude || 10.762622,
    longitude: initialLocation?.longitude || 106.660172,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [selectedLocation, setSelectedLocation] = useState(
    initialLocation || { latitude: 10.762622, longitude: 106.660172 }
  );

  const [selectedAddress, setSelectedAddress] = useState(initialAddress || '');
  const [searchText, setSearchText] = useState(initialAddress || '');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const mapRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let location = await Location.getCurrentPositionAsync({});
      if (!initialLocation) {
        const newLoc = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setSelectedLocation(newLoc);
        setRegion({
          ...region,
          ...newLoc,
        });
        mapRef.current?.animateToRegion({
          ...region,
          ...newLoc,
        }, 500);
        await reverseGeocode(newLoc.latitude, newLoc.longitude);
      } else {
        if (!initialAddress) {
          await reverseGeocode(initialLocation.latitude, initialLocation.longitude);
        }
      }
    })();
  }, []);

  const fetchSearchSuggestions = async (text: string) => {
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }
    setSearchLoading(true);
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json`,
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
      console.error('Mapbox search error inside MapPicker:', error);
    } finally {
      setSearchLoading(false);
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

  const debouncedSearch = React.useCallback(debounce(fetchSearchSuggestions, 400), []);

  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
    if (text.length >= 3) {
      setShowSuggestions(true);
      debouncedSearch(text);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleSuggestionSelect = (item: any) => {
    const coords = item.center; // [longitude, latitude]
    const address = item.place_name;

    const newLoc = {
      latitude: coords[1],
      longitude: coords[0],
    };

    setSelectedLocation(newLoc);
    setSelectedAddress(address);
    setSearchText(address);
    setSuggestions([]);
    setShowSuggestions(false);
    Keyboard.dismiss();

    setRegion({
      ...region,
      ...newLoc,
    });

    mapRef.current?.animateToRegion({
      ...region,
      ...newLoc,
    }, 500);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`,
        {
          params: {
            access_token: MAPBOX_TOKEN,
            limit: 1,
          },
        }
      );
      const placeName = response.data.features?.[0]?.place_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setSelectedAddress(placeName);
      setSearchText(placeName);
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    }
  };

  const handleCenter = async () => {
    let location = await Location.getCurrentPositionAsync({});
    const newLoc = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
    setSelectedLocation(newLoc);
    mapRef.current?.animateToRegion({
      ...region,
      ...newLoc,
    }, 500);
    await reverseGeocode(newLoc.latitude, newLoc.longitude);
  };

  return (
    <View className="absolute inset-0 bg-[#0f172a]">
      <MapComponent
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        onRegionChangeComplete={async (r) => {
          setRegion(r);
          const newLoc = {
            latitude: r.latitude,
            longitude: r.longitude,
          };
          setSelectedLocation(newLoc);
          await reverseGeocode(r.latitude, r.longitude);
        }}
      >
        <MarkerComponent
          coordinate={selectedLocation}
          pinColor="#6366f1"
        />
      </MapComponent>

      {/* Floating Center Icon (Like Uber/Grab) */}
      <View className="absolute top-1/2 left-1/2 -ml-[20px] -mt-[40px] items-center justify-center z-10" pointerEvents="none">
        <MapPin size={40} color="#6366f1" strokeWidth={2.5} />
      </View>

      <View className="flex-1 justify-between" pointerEvents="box-none">
        <BlurView intensity={80} tint="dark" className="p-5 pt-[60px] border-b border-white/10 z-50 overflow-visible">
          <View className="items-center mb-3">
            <Text className="text-base font-black text-slate-50 text-center uppercase tracking-widest">{title}</Text>
            <Text className="text-xs text-slate-400 text-center mt-0.5">Search location or move map to set point</Text>
          </View>
          
          <View className="flex-row items-center bg-[#0f172a] rounded-xl h-12 px-3 border border-white/10">
            <Search size={18} color="#94a3b8" className="mr-2" />
            <TextInput
              className="flex-1 text-slate-50 text-sm h-full"
              placeholder="Search address..."
              placeholderTextColor="#64748b"
              value={searchText}
              onChangeText={handleSearchTextChange}
              onFocus={() => searchText.length >= 3 && setShowSuggestions(true)}
            />
            {searchLoading ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : searchText.length > 0 ? (
              <TouchableOpacity onPress={() => { setSearchText(''); setSuggestions([]); }}>
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            ) : null}
          </View>

          {showSuggestions && suggestions.length > 0 && (
            <View className="absolute top-[148px] left-5 right-5 bg-slate-800 rounded-xl border border-white/15 max-h-[200px] shadow-2xl z-50">
              <ScrollView keyboardShouldPersistTaps="handled" className="rounded-xl">
                {suggestions.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    className="flex-row p-3 border-b border-white/5 items-center"
                    onPress={() => handleSuggestionSelect(item)}
                  >
                    <MapPin size={16} color="#6366f1" className="mr-2.5" />
                    <View className="flex-1">
                      <Text className="text-slate-50 text-sm font-semibold" numberOfLines={1}>
                        {item.text}
                      </Text>
                      <Text className="text-slate-400 text-[11px] mt-0.5" numberOfLines={1}>
                        {item.place_name.replace(`${item.text}, `, '')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </BlurView>

        <View className="p-5 pb-10 gap-3 z-10" pointerEvents="box-none">
          {selectedAddress ? (
            <View className="flex-row items-center bg-slate-800 rounded-2xl p-3.5 gap-2.5 border border-white/10 shadow-lg mb-1">
              <MapPin size={16} color="#6366f1" />
              <Text className="flex-1 text-slate-50 text-xs font-semibold leading-relaxed" numberOfLines={2}>
                {selectedAddress}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity 
            className="self-end bg-slate-800 w-12 h-12 rounded-full justify-center items-center border border-white/10 shadow-lg mb-1" 
            onPress={handleCenter}
          >
            <Target size={24} color="#6366f1" />
          </TouchableOpacity>

          <View className="flex-row gap-2.5">
            <TouchableOpacity className="flex-1 h-[52px] rounded-2xl bg-slate-700 flex-row items-center justify-center gap-1.5" onPress={onCancel}>
              <X size={20} color="#f8fafc" />
              <Text className="text-white text-[15px] font-bold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="flex-[2] h-[52px] rounded-2xl bg-[#6366f1] flex-row items-center justify-center gap-1.5" 
              onPress={() => onSelect(selectedLocation, selectedAddress)}
            >
              <Check size={20} color="#fff" />
              <Text className="text-white text-[15px] font-bold">Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

