# Phase 04: Backend — Dispatch & Assignment

**Status:** ⬜ Pending
**Dependencies:** Phase 03 (Core CRUD)
**Ước tính:** 3-4 ngày

---

## Objective

Implement logic điều phối xe: auto-matching (gợi ý xe phù hợp), gán đơn vào trip, quản lý trip lifecycle, và tài xế accept/reject chuyến.

## Implementation Steps

### 1. Dispatch Module — Auto-matching
- [ ] `DispatchModule` — module setup
- [ ] `DispatchService.suggestVehicles(orderId)`:
  - Input: order (pickup_location, weight_kg)
  - Logic:
    1. Lọc xe có `status = 'available'`
    2. Lọc xe có `max_capacity_kg - current_load_kg >= order.weight_kg`
    3. Lọc xe có driver `status = 'available'`
    4. Lọc driver có `license_expiry > today`
    5. Sort by khoảng cách từ `last_known_location` đến `pickup_location` (PostGIS `ST_Distance`)
  - Output: Top 5 xe phù hợp nhất (sorted by distance)
- [ ] `DispatchController`:
  - `POST /dispatch/suggest` — Body: { orderId } → trả top 5 xe
  - `POST /dispatch/assign` — Body: { orderId, vehicleId } → gán đơn
  - `POST /dispatch/bulk-assign` — Gán nhiều đơn cùng lúc

### 2. Trip Module — Trip Lifecycle
- [ ] `TripsModule` — module setup
- [ ] `TripsService`:
  - `createTrip(vehicleId, driverId, orderIds[])` — Tạo trip + liên kết orders
  - `acceptTrip(tripId, driverId)` — Tài xế accept
  - `rejectTrip(tripId, driverId)` — Tài xế reject → trip cancelled
  - `startTrip(tripId)` — Bắt đầu chuyến
  - `completeTrip(tripId)` — Hoàn thành
  - `cancelTrip(tripId, reason)` — Hủy (admin)
- [ ] `TripsController`:
  - `GET /trips` — List (filter: status, driver_id, vehicle_id, date range)
  - `GET /trips/:id` — Detail (include orders, route)
  - `GET /trips/active` — Chuyến đang chạy (for driver app)
  - `GET /trips/my` — Chuyến của tài xế hiện tại
  - `POST /trips/:id/accept` — Driver accept
  - `POST /trips/:id/reject` — Driver reject
  - `POST /trips/:id/start` — Start trip
  - `POST /trips/:id/complete` — Complete trip
  - `POST /trips/:id/incident` — Báo sự cố
- [ ] Trip status machine:
  ```
  PENDING → ACCEPTED → IN_PROGRESS → COMPLETED
      │         │            │
      └→ CANCELLED ←────────┘
  ```

### 3. Assignment Logic
- [ ] Khi gán đơn vào xe:
  1. Validate: xe available, đủ tải trọng
  2. Tạo Trip (status: pending)
  3. Liên kết orders vào trip (trip_orders)
  4. Update vehicle: `current_load_kg += order.weight_kg`
  5. Update orders: `status = 'assigned'`
  6. ⚡ Emit WebSocket event → Driver nhận thông báo
- [ ] Khi driver accept:
  1. Trip status → `accepted`
  2. Driver status → `on_trip`
  3. Vehicle status → `delivering`
- [ ] Khi driver reject:
  1. Trip status → `cancelled`
  2. Orders → `status = 'pending'` (trả về pool)
  3. Vehicle: `current_load_kg -= total_weight`
- [ ] Khi complete trip:
  1. Trip status → `completed`
  2. All orders → `delivered`
  3. Driver status → `available`
  4. Vehicle: status → `available`, current_load_kg = 0
  5. Update driver_kpi: total_trips++, completed_trips++

### 4. Order Clustering (Gom đơn)
- [ ] `DispatchService.clusterOrders()`:
  - Input: list of pending orders
  - Logic: Group orders có `pickup_location` trong bán kính 3km
  - Algorithm: Simple distance-based clustering (K-means hoặc DBSCAN đơn giản)
  - Output: Groups of order IDs
- [ ] `POST /dispatch/cluster` — Gợi ý gom đơn

## Files to Create/Modify

```
fleet-api/src/
├── dispatch/
│   ├── dispatch.module.ts
│   ├── dispatch.controller.ts
│   ├── dispatch.service.ts
│   └── dto/
│       ├── suggest-vehicle.dto.ts
│       ├── assign-order.dto.ts
│       └── cluster-result.dto.ts
├── trips/
│   ├── trips.module.ts
│   ├── trips.controller.ts
│   ├── trips.service.ts
│   └── dto/
│       ├── create-trip.dto.ts
│       ├── update-trip-status.dto.ts
│       ├── trip-query.dto.ts
│       └── trip-response.dto.ts
```

## Test Criteria
- [ ] Suggest: trả về xe sorted by distance, filtered by capacity/availability
- [ ] Assign: tạo trip + update statuses chính xác
- [ ] Accept: driver/vehicle status updated
- [ ] Reject: orders trả về pending, vehicle load reduced
- [ ] Complete: KPI updated, all statuses reset
- [ ] Cluster: orders gần nhau được group đúng
- [ ] Validation: không gán xe đang delivering, không gán driver on_trip
- [ ] PostGIS: `ST_Distance` tính khoảng cách chính xác

---

**Next Phase:** [Phase 05 — Backend Real-time GPS & Alerts](./phase-05-backend-realtime.md)
