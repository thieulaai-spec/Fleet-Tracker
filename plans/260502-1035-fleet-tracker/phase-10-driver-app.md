# Phase 10: Driver Mobile App (React Native / Expo)

**Status:** ⬜ Pending
**Dependencies:** Phase 02 (Auth), Phase 03 (Core APIs), Phase 05 (GPS Real-time)
**Ước tính:** 7-10 ngày

---

## Objective

Xây dựng Driver Mobile App với Expo: đăng nhập, nhận chuyến, xem tuyến đường trên map, cập nhật trạng thái giao hàng, chụp ảnh xác nhận, nút báo sự cố, và gửi GPS background.

## Implementation Steps

### 1. Auth & Navigation
- [ ] Login screen (email + password)
- [ ] JWT storage (expo-secure-store)
- [ ] Auto-login check on app launch
- [ ] Tab navigation: Trips | Map | Profile
- [ ] Protected routes (redirect to login if no token)

### 2. Trip List (Trips tab)
- [ ] 3 sections: Pending (accept/reject), Active (current trip), Completed (history)
- [ ] Trip card: trip ID, pickup → delivery, orders count, created time
- [ ] Pull-to-refresh
- [ ] Accept button → confirm modal → call API
- [ ] Reject button → confirm modal → call API

### 3. Active Trip Screen
- [ ] Full-screen map (react-native-maps)
- [ ] Planned route overlay (polyline)
- [ ] Current position marker (auto-center)
- [ ] Order waypoints markers (numbered: 1, 2, 3...)
- [ ] Bottom sheet:
  - Current order info (pickup/delivery address, weight)
  - Status buttons:
    - "Bắt đầu chuyến" → start trip
    - "Đã lấy hàng" → picked_up
    - "Đang giao" → delivering
    - "Hoàn thành" → open camera → complete
- [ ] Navigation integration (open in Google Maps/Apple Maps)

### 4. Delivery Confirmation
- [ ] Camera screen (expo-camera):
  - Chụp ảnh bằng chứng giao hàng
  - Preview → confirm → upload to Supabase Storage
  - Attach photo URL to order completion
- [ ] Signature capture (optional, nice-to-have)

### 5. SOS / Incident Report
- [ ] Floating SOS button (always visible during active trip)
- [ ] 1-tap: send incident alert with current location
- [ ] Optional: add description text
- [ ] Haptic feedback on press
- [ ] Confirmation: "Đã gửi báo cáo sự cố!"

### 6. GPS Background Tracking
- [ ] `expo-location` background location tracking:
  - Request location permissions (foreground + background)
  - Start tracking when trip starts
  - Send GPS every 5-10 seconds via WebSocket
  - Stop tracking when trip completes
- [ ] Foreground service notification: "FleetTracker đang theo dõi vị trí"
- [ ] Handle GPS errors: retry, fallback to last known position
- [ ] Battery optimization: reduce frequency when idle

### 7. Profile Screen
- [ ] Driver info (name, phone, license)
- [ ] KPI summary (score, trips, completion rate)
- [ ] Trip history list
- [ ] Logout button

### 8. WebSocket Integration
- [ ] Connect on login, disconnect on logout
- [ ] Emit `gps:update` every 5-10s during active trip
- [ ] Listen `trip:new` → new trip notification
- [ ] Listen `trip:cancelled` → trip cancelled by admin
- [ ] Reconnection logic (auto-reconnect on disconnect)

### 9. Offline Handling
- [ ] Queue GPS data locally when offline
- [ ] Sync queued data when connection restored
- [ ] Show offline indicator in header
- [ ] Cache active trip data locally

## Screen List

| # | Screen | Navigation |
|---|--------|-----------|
| 1 | Login | Stack |
| 2 | Trip List | Tab: Trips |
| 3 | Trip Detail | Stack (from Trip List) |
| 4 | Active Trip (Map) | Tab: Map |
| 5 | Camera (delivery photo) | Modal |
| 6 | Incident Report | Modal |
| 7 | Profile | Tab: Profile |

## Test Criteria
- [ ] Login → see trip list
- [ ] Accept trip → trip moves to Active
- [ ] Start trip → GPS tracking begins
- [ ] Update order status → backend updated
- [ ] Camera → upload photo → attached to order
- [ ] SOS button → admin receives alert instantly
- [ ] GPS sends location every 5-10s (check in admin map)
- [ ] Offline: GPS queued, synced when back online
- [ ] Background tracking works when app minimized

---

**🎉 This is the final phase! After completion:**
- Run `/test` for comprehensive testing
- Run `/review` for code review
- Run `/deploy` for production deployment
