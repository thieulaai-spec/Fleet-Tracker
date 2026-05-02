# Phase 08: Admin Dashboard — Maps & Real-time Monitoring

**Status:** ⬜ Pending
**Dependencies:** Phase 05 (Backend Real-time), Phase 07 (Admin Core UI)
**Ước tính:** 5-6 ngày

---

## Objective

Tích hợp Mapbox GL JS vào Admin Dashboard: live tracking map (tất cả xe), theo dõi xe cụ thể, geofence visualization, alerts panel real-time, route replay.

## Implementation Steps

### 1. Live Fleet Map (/tracking)
- [ ] Full-screen Mapbox GL JS map
- [ ] Vehicle markers: icon theo type (small/medium/large), color theo status
- [ ] Real-time position update via WebSocket (`vehicle:location`)
- [ ] Marker animation (smooth move between GPS points)
- [ ] Click marker → popup: plate, driver, speed, trip info
- [ ] Vehicle list sidebar: filter, click to center map on vehicle

### 2. Vehicle Detail Tracking
- [ ] Click vehicle → zoom in + show trail (last 30 minutes)
- [ ] Speed indicator (color-coded: green < 60, yellow < 80, red > 80)
- [ ] Trip route overlay (planned route as dashed line)
- [ ] Geofence corridor visualization (500m buffer around route)

### 3. Alerts Panel (Real-time)
- [ ] Floating alerts panel (bottom-right or sidebar)
- [ ] New alerts appear with animation + sound
- [ ] Alert types with icons: 🚨 Speed, 🗺️ Route deviation, ⏸️ Idle, ⚠️ Incident
- [ ] Click alert → center map on alert location
- [ ] Mark as resolved (dismiss)
- [ ] Alert history with filters

### 4. Route Replay (/tracking/replay)
- [ ] Select vehicle + date range
- [ ] Playback controls: play, pause, speed (1x, 2x, 5x)
- [ ] Vehicle marker moves along historical route
- [ ] Timeline slider
- [ ] Show speed at each point (color-coded trail)

### 5. Dispatch Map Enhancement
- [ ] On dispatch page: mini map showing pending order locations + available vehicles
- [ ] Click order → show pickup/delivery markers
- [ ] Click "suggest" → draw lines from suggested vehicles to order pickup

## Test Criteria
- [ ] Map loads with all active vehicles
- [ ] Vehicles move in real-time (WebSocket)
- [ ] Alerts appear instantly on map
- [ ] Route replay plays smoothly
- [ ] Map performance OK with 10 vehicles

---

**Next Phase:** [Phase 09 — Admin Reports & Analytics](./phase-09-admin-reports.md)
