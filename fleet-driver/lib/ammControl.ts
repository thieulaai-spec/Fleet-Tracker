import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { authFetch } from './authFetch';
import { socketService } from './socket';

const AMM_ENABLED_KEY = '@fleet_amm_enabled';
const AMM_DEVICE_KEY = '@fleet_amm_device_id';
const AMM_POLL_INTERVAL_MS = 15000;
const AMM_SEND_INTERVAL_MS = 10000;
const AMM_MAX_ACCURACY_M = 100;

let pollTimer: ReturnType<typeof setInterval> | null = null;
let lastSentAt = 0;
let lastEnabled = false;

type AmmStatePayload = {
  enabled?: boolean;
  deviceId?: string | null;
};

async function setLocalAmmState(payload: AmmStatePayload) {
  const enabled = !!payload.enabled;
  await AsyncStorage.setItem(AMM_ENABLED_KEY, enabled ? '1' : '0');

  if (payload.deviceId) {
    await AsyncStorage.setItem(AMM_DEVICE_KEY, payload.deviceId);
  }

  const wasEnabled = lastEnabled;
  lastEnabled = enabled;

  if (enabled && !wasEnabled) {
    pushCurrentAmmLocation().catch((error) => {
      console.log('[AMM] Immediate phone GPS rescue skipped:', error);
    });
  }
}

async function isLocalAmmEnabled() {
  return (await AsyncStorage.getItem(AMM_ENABLED_KEY)) === '1';
}

async function pushCurrentAmmLocation() {
  try {
    const permission = await Location.getForegroundPermissionsAsync();
    if (permission.status !== 'granted') return;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    await sendAmmPhoneLocation(location, true);
  } catch (error) {
    console.log('[AMM] Current phone location unavailable:', error);
  }
}

async function syncAmmState() {
  try {
    const response = await authFetch('/tracking/amm/state');
    if (!response.ok) return;

    const result = await response.json();
    const payload = result?.data ?? result;
    await setLocalAmmState({
      enabled: !!payload.enabled,
      deviceId: payload.deviceId || null,
    });
  } catch (error) {
    console.log('[AMM] State sync skipped:', error);
  }
}

const handleSocketState = (payload: AmmStatePayload) => {
  setLocalAmmState(payload).catch((error) => {
    console.log('[AMM] Socket state skipped:', error);
  });
};

export function startAmmControlSync() {
  if (!pollTimer) {
    syncAmmState();
    pollTimer = setInterval(syncAmmState, AMM_POLL_INTERVAL_MS);
  }

  socketService.on('phone-fallback:state', handleSocketState);
}

export function stopAmmControlSync() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  socketService.off('phone-fallback:state', handleSocketState);
  lastEnabled = false;
}

export async function sendAmmPhoneLocation(
  location: Location.LocationObject,
  force = false,
) {
  if (!(await isLocalAmmEnabled())) return;

  const now = Date.now();
  if (!force && now - lastSentAt < AMM_SEND_INTERVAL_MS) return;

  const accuracyM = location.coords.accuracy ?? 999999;
  if (accuracyM > AMM_MAX_ACCURACY_M) return;

  lastSentAt = now;

  try {
    const response = await authFetch('/tracking/phone-location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracyM,
        speed: Math.max(0, location.coords.speed ?? 0),
        heading: location.coords.heading ?? 0,
        timestampMs: location.timestamp,
      }),
    });

    if (response.ok) {
      const result = await response.json().catch(() => null);
      const payload = result?.data ?? result;
      if (payload?.reason === 'amm_off') {
        await setLocalAmmState({ enabled: false });
      }
    }
  } catch (error) {
    console.log('[AMM] Phone GPS rescue send skipped:', error);
  }
}
