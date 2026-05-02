# Phase 05: Backend — Real-time GPS & Alerts

**Status:** ⬜ Pending
**Dependencies:** Phase 04 (Dispatch)
**Ước tính:** 5-7 ngày

---

## Objective

Implement WebSocket gateway để nhận GPS data real-time từ Driver App, lưu vào PostGIS, broadcast vị trí xe cho Admin Dashboard, và hệ thống cảnh báo (vượt tốc, sai tuyến, dừng bất thường).

## Implementation Steps

### 1. WebSocket Gateway (NestJS)
- [ ] `TrackingModule` — module setup
- [ ] `TrackingGateway` (WebSocket):
  - `@SubscribeMessage('gps:update')` — Nhận GPS từ Driver
    ```typescript
    // Payload từ Driver App:
    {
      vehicleId: string;
      tripId: string;
      latitude: number;
      longitude: number;
      speed: number;      // km/h
      heading: number;    // 0-360 degrees
      timestamp: string;  // ISO 8601
    }
    ```
  - Emit `'vehicle:location'` → Broadcast cho tất cả Admin clients
  - Emit `'alert:new'` → Khi phát hiện vi phạm
  - Emit `'trip:status'` → Khi trip status thay đổi
- [ ] WebSocket authentication:
  - Validate JWT token khi connect
  - Chỉ driver có active trip mới được emit GPS
  - Admin được subscribe tất cả events
- [ ] Room management:
  - Room `admin` — tất cả admin clients
  - Room `trip:{tripId}` — theo dõi trip cụ thể
  - Room `driver:{driverId}` — channel riêng cho driver

### 2. GPS Data Processing
- [ ] `TrackingService`:
  - `processGpsUpdate(data)`:
    1. Validate data (lat/lng range, speed > 0)
    2. Save to `gps_locations` table (PostGIS point)
    3. Update `vehicles.last_known_location`
    4. Run violation checks (async)
    5. Broadcast updated location to admin room
- [ ] Batch insert optimization:
  - Buffer GPS points, insert batch every 5 seconds
  - Reduce DB writes (10 xe × 5s interval = 2 writes/s thay vì 2/s per xe)

### 3. Alert System — Violation Detection
- [ ] `AlertsModule` + `AlertsService`
- [ ] **Speed Violation:**
  - Check: `speed > MAX_SPEED` (configurable, default 80 km/h)
  - Tolerance: bỏ qua nếu < 3 giây (GPS spike)
  - Action: Tạo alert + emit `alert:new`
- [ ] **Route Deviation:**
  - Check: `ST_Distance(current_location, planned_route) > THRESHOLD` (default 500m)
  - Cần planned_route từ trip (LineString)
  - Action: Tạo alert + emit `alert:new`
  - Logic:
    ```sql
    SELECT ST_Distance(
      ST_MakePoint(:lng, :lat)::geography,
      planned_route
    ) as distance_from_route
    FROM trips WHERE id = :tripId
    ```
- [ ] **Abnormal Stop:**
  - Check: vehicle speed = 0 liên tục > 10 phút (configurable)
  - Track idle time per vehicle (in-memory counter)
  - Reset counter khi speed > 0
  - Action: Tạo alert + emit `alert:new`
- [ ] **Incident Report (Manual):**
  - Driver bấm nút báo sự cố → `POST /trips/:id/incident`
  - Tạo alert với type = 'incident', severity = 'critical'
  - Emit `alert:new` ngay lập tức

### 4. Alert Management
- [ ] `AlertsController`:
  - `GET /alerts` — List alerts (filter: type, severity, is_resolved, date range)
  - `GET /alerts/active` — Alerts chưa resolve
  - `PATCH /alerts/:id/resolve` — Mark as resolved (admin)
  - `GET /alerts/stats` — Thống kê alerts (count by type, by day)
- [ ] Alert notification:
  - WebSocket emit cho admin dashboard
  - Có thể mở rộng: email/SMS notification (future)

### 5. Geofencing Utilities
- [ ] PostGIS helper functions:
  ```sql
  -- Tính khoảng cách giữa 2 điểm (meters)
  ST_Distance(point1::geography, point2::geography)

  -- Check điểm có trong bán kính không
  ST_DWithin(point1::geography, point2::geography, radius_meters)

  -- Tạo buffer quanh route (corridor)
  ST_Buffer(route::geography, width_meters)

  -- Check điểm có trong corridor không
  ST_Within(point, ST_Buffer(route, 500))
  ```
- [ ] Route corridor: Tạo buffer 500m quanh planned_route

### 6. Location History
- [ ] `GET /tracking/history/:vehicleId` — Lịch sử GPS
  - Query params: from, to (timestamps)
  - Return: array of GPS points (for route replay)
- [ ] `GET /tracking/live` — Vị trí hiện tại tất cả xe active
  - Return: array of { vehicleId, location, speed, lastUpdate }

## Files to Create/Modify

```
fleet-api/src/
├── tracking/
│   ├── tracking.module.ts
│   ├── tracking.gateway.ts      # WebSocket gateway
│   ├── tracking.service.ts      # GPS processing
│   ├── tracking.controller.ts   # REST endpoints
│   └── dto/
│       ├── gps-update.dto.ts
│       └── location-history.dto.ts
├── alerts/
│   ├── alerts.module.ts
│   ├── alerts.controller.ts
│   ├── alerts.service.ts
│   ├── violation-detector.service.ts  # Speed, route, idle checks
│   └── dto/
│       ├── alert-query.dto.ts
│       └── alert-response.dto.ts
```

## Test Criteria
- [ ] WebSocket connection với JWT → thành công
- [ ] GPS update → saved to DB → broadcast to admin
- [ ] Speed > 80 km/h → alert created + emitted
- [ ] Location > 500m from route → route deviation alert
- [ ] Speed = 0 for > 10 min → abnormal stop alert
- [ ] Incident report → critical alert + emitted
- [ ] Location history → correct time range filter
- [ ] Live locations → all active vehicles

---

**Next Phase:** [Phase 06 — Backend Reports & Optimization](./phase-06-backend-reports.md)
