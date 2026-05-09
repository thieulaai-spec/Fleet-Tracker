# Phase 08: Admin Dashboard — Maps & Real-time Monitoring

**Status:** ⬜ Pending
**Dependencies:** Phase 05 (Backend Real-time), Phase 07 (Admin Core UI)
**Ước tính:** 5-6 ngày

# Phase 08: Admin Dashboard — Maps & Real-time Monitoring

**Status:** ✅ Completed
**Dependencies:** Phase 05 (Backend Real-time), Phase 07 (Admin Core UI)
**Ước tính:** 5-6 ngày

---

## Objective

Tích hợp Mapbox GL JS vào Admin Dashboard: live tracking map (tất cả xe), theo dõi xe cụ thể, geofence visualization, alerts panel real-time, route replay.

## Implementation Steps

### 1. Live Fleet Map (/tracking)
- [x] Full-screen Mapbox GL JS map
- [x] Vehicle markers: icon theo type (small/medium/large), color theo status
- [x] Real-time position update via WebSocket (`vehicle:location`)
- [x] Marker animation (smooth move between GPS points)
- [x] Click marker → popup: plate, driver, speed, trip info
- [x] Vehicle list sidebar: filter, click to center map on vehicle

### 2. Vehicle Detail Tracking
- [x] Click vehicle → zoom in + show trail (last 30 minutes)
- [x] Speed indicator (color-coded: green < 60, yellow < 80, red > 80)
- [x] Trip route overlay (planned route as dashed line)
- [x] Geofence corridor visualization (500m buffer around route)

### 3. Alerts Panel (Real-time)
- [x] Floating alerts panel (bottom-right or sidebar)
- [x] New alerts appear with animation + sound
- [x] Alert types with icons: 🚨 Speed, 🗺️ Route deviation, ⏸️ Idle, ⚠️ Incident
- [x] Click alert → center map on alert location
- [x] Mark as resolved (dismiss)
- [x] Alert history with filters

### 4. Route Replay (/tracking/replay)
- [x] Select vehicle + date range
- [x] Playback controls: play, pause, speed (1x, 2x, 5x)
- [x] Vehicle marker moves along historical route
- [x] Timeline slider
- [x] Show speed at each point (color-coded trail)

### 5. Dispatch Map Enhancement
- [x] On dispatch page: mini map showing pending order locations + available vehicles
- [x] Click order → show pickup/delivery markers
- [x] Click "suggest" → draw lines from suggested vehicles to order pickup

## Test Criteria
- [x] Map loads with all active vehicles
- [x] Vehicles move in real-time (WebSocket)
- [x] Alerts appear instantly on map
- [x] Route replay plays smoothly
- [x] Map performance OK with 10 vehicles

---

**Next Phase:** [Phase 09 — Admin Reports & Analytics](./phase-09-admin-reports.md)
