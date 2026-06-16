import * as Location from 'expo-location';
import { authFetch } from './authFetch';

let lastAidSentAt = 0;
const MIN_AID_INTERVAL_MS = 30000;
const MAX_ACCURACY_M = 1000;
const MAX_LOCATION_AGE_MS = 30000;

export async function sendGpsAidHint(location: Location.LocationObject) {
  const now = Date.now();
  const ageMs = Math.max(0, now - location.timestamp);
  const accuracyM = location.coords.accuracy ?? 999999;

  if (now - lastAidSentAt < MIN_AID_INTERVAL_MS) return;
  if (ageMs > MAX_LOCATION_AGE_MS) return;
  if (accuracyM > MAX_ACCURACY_M) return;

  lastAidSentAt = now;

  try {
    await authFetch('/tracking/gps-aid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracyM,
        unix: Math.floor(location.timestamp / 1000),
        ageMs,
        speed: Math.max(0, location.coords.speed ?? 0),
        heading: location.coords.heading ?? 0,
        altitudeM: location.coords.altitude ?? 0,
      }),
    });
  } catch (error) {
    console.log('[GPS-AID] Phone hint send skipped:', error);
  }
}
