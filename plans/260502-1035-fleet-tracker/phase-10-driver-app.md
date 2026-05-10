# Phase 10: Driver Mobile App (React Native / Expo)

**Status:** ✅ Completed
**Dependencies:** Phase 02 (Auth), Phase 03 (Core APIs), Phase 05 (GPS Real-time)
**Ước tính:** 7-10 ngày

---

## Objective

Xây dựng Driver Mobile App với Expo: đăng nhập, nhận chuyến, xem tuyến đường trên map, cập nhật trạng thái giao hàng, chụp ảnh xác nhận, nút báo sự cố, và gửi GPS background.

## Implementation Steps

### 1. Auth & Navigation
- [x] Login screen (email + password)
- [x] JWT storage (expo-secure-store)
- [x] Auto-login check on app launch
- [x] Tab navigation: Trips | Map | Profile
- [x] Protected routes (redirect to login if no token)

### 2. Trip List (Trips tab)
- [x] 3 sections: Pending (accept/reject), Active (current trip), Completed (history)
- [x] Trip card: trip ID, pickup → delivery, orders count, created time
- [x] Pull-to-refresh
- [x] Accept button → confirm modal → call API
- [x] Reject button → confirm modal → call API

### 3. Active Trip Screen
- [x] Full-screen map (react-native-maps)
- [x] Planned route overlay (polyline)
- [x] Current position marker (auto-center)
- [x] Order waypoints markers (numbered: 1, 2, 3...)
- [x] Bottom sheet:
  - [x] Current order info (pickup/delivery address, weight)
  - [x] Status buttons:
    - [x] "Bắt đầu chuyến" → start trip
    - [x] "Đã lấy hàng" → picked_up
    - [x] "Đang giao" → delivering
    - [x] "Hoàn thành" → open camera → complete
- [x] Navigation integration (open in Google Maps/Apple Maps)

### 4. Delivery Confirmation
- [x] Camera screen (expo-camera):
  - Chụp ảnh bằng chứng giao hàng
  - Preview → confirm → upload to Supabase Storage
  - Attach photo URL to order completion
- [x] Signature capture (Implemented with react-native-signature-canvas)

### 5. SOS / Incident Report
- [x] Floating SOS button (always visible during active trip)
- [x] 1-tap: send incident alert with current location
- [x] Optional: add description text
- [x] Haptic feedback on press
- [x] Confirmation: "Đã gửi báo cáo sự cố!"

### 6. GPS Background Tracking
- [x] `expo-location` background location tracking:
  - Request location permissions (foreground + background)
  - Start tracking when trip starts
  - Send GPS every 5-10 seconds via WebSocket
  - Stop tracking when trip completes
- [x] Foreground service notification: "FleetTracker đang theo dõi vị trí"
- [x] Handle GPS errors: retry, fallback to last known position (implemented in map.tsx)
- [x] Battery optimization: reduce frequency when idle (dynamic timeInterval based on status)

### 7. Profile Screen
- [x] Driver info (name, phone, license)
- [x] KPI summary (score, trips, completion rate)
- [x] Trip history list
- [x] Logout button

### 8. WebSocket Integration
- [x] Connect on login, disconnect on logout
- [x] Emit `gps:update` every 5-10s during active trip
- [x] Listen `trip:assigned` → new trip notification
- [x] Listen `trip:cancelled` → trip cancelled by admin
- [x] Reconnection logic (auto-reconnect on disconnect)

### 9. Offline Handling
- [x] Queue GPS data locally when offline
- [x] Sync queued data when connection restored
- [x] Show offline indicator in header
- [x] Cache active trip data locally (using zustand/persist)

## Screen List

| # | Screen | Navigation |
|---|--------|-----------|
| 1 | Login | Stack |
| 2 | Trip List | Tab: Trips |
| 3 | Trip Detail | Stack (from Trip List) |
| 4 | Active Trip (Map) | Tab: Map |
| 5 | Camera (delivery photo) | Modal |
| 6 | Signature Capture | Stack (from Camera) |
| 7 | Incident Report | Modal |
| 8 | Profile | Tab: Profile |

## Test Criteria
- [x] Login → see trip list
- [x] Accept trip → trip moves to Active
- [x] Start trip → GPS tracking begins
- [x] Update order status → backend updated
- [x] Camera → upload photo → attached to order
- [x] Signature → capture and upload → finalize order
- [x] SOS button → admin receives alert instantly
- [x] GPS sends location every 5-10s (check in admin map)
- [x] Offline: GPS queued, synced when back online
- [x] Background tracking works when app minimized

---

**🎉 Phase 10 Completed!**
- Run `/test` for comprehensive testing
- Run `/review` for code review
- Run `/deploy` for production deployment
