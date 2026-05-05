# Phase 04: Backend — Dispatch & Assignment

**Status:** ✅ Completed
**Dependencies:** Phase 03 (Core CRUD)
**Ước tính:** 3-4 ngày

---

## Objective

Implement logic điều phối xe: auto-matching (gợi ý xe phù hợp), gán đơn vào trip, quản lý trip lifecycle, và tài xế accept/reject chuyến.

## Implementation Steps

### 1. Dispatch Module — Auto-matching
- [x] `DispatchModule` — module setup
- [x] `DispatchService.suggestVehicles(orderId)`:
  - Input: order (pickup_location, weight_kg)
  - Logic:
    1. [x] Lọc xe có `status = 'available'`
    2. [x] Lọc xe có `max_capacity_kg - current_load_kg >= order.weight_kg`
    3. [x] Lọc xe có driver `status = 'available'`
    4. [x] Lọc driver có `license_expiry > today`
    5. [x] Sort by khoảng cách từ `last_known_location` đến `pickup_location` (PostGIS `ST_Distance`)
  - Output: Top 5 xe phù hợp nhất (sorted by distance)
- [x] `DispatchController`:
  - `GET /dispatch/suggest/:orderId` — trả xe phù hợp nhất
  - `POST /dispatch/assign` — Body: { orderId, vehicleId } → gán đơn
  - `POST /dispatch/bulk-assign` — Gán nhiều đơn cùng lúc
  - `POST /dispatch/cluster` — Gợi ý gom đơn

### 2. Trip Module — Trip Lifecycle
- [x] `TripsModule` — module setup
- [x] `TripsService`:
  - [x] `createTrip` (tích hợp trong assignOrder)
  - [x] `updateStatus` (accept, reject, start, complete)
- [x] `TripsController`:
  - [x] `GET /trips` — List
  - [x] `GET /trips/:id` — Detail
  - [x] `PATCH /trips/:id/status` — Cập nhật trạng thái
- [x] Trip status machine:
  ```
  PENDING → ACCEPTED → IN_PROGRESS → COMPLETED
      │         │            │
      └→ CANCELLED ←────────┘
  ```

### 3. Assignment Logic
- [x] Khi gán đơn vào xe:
  1. [x] Validate: xe available, đủ tải trọng
  2. [x] Tạo Trip (status: pending)
  3. [x] Liên kết orders vào trip (trip_orders)
  4. [x] Update vehicle: `current_load_kg += order.weight_kg`
  5. [x] Update orders: `status = 'assigned'`
  6. [ ] ⚡ Emit WebSocket event (Phase 05)
- [x] Khi driver accept:
  1. [x] Trip status → `accepted`
  2. [x] Driver status → `on_trip`
  3. [x] Vehicle status → `delivering`
- [x] Khi complete trip:
  1. [x] Trip status → `completed`
  2. [x] All orders → `delivered`
  3. [x] Driver status → `available`
  4. [x] Vehicle: status → `available`, current_load_kg = 0

### 4. Order Clustering (Gom đơn)
- [x] `DispatchService.clusterOrders()`:
  - Input: list of pending orders
  - Logic: Group orders có `pickup_location` trong bán kính 3km
  - Algorithm: Simple distance-based clustering
  - Output: Groups of order IDs
- [x] `POST /dispatch/cluster` — Gợi ý gom đơn

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
- [x] Suggest: trả về xe sorted by distance, filtered by capacity/availability
- [x] Assign: tạo trip + update statuses chính xác
- [x] Accept: driver/vehicle status updated
- [x] Reject: orders trả về pending, vehicle load reduced
- [x] Complete: KPI updated, all statuses reset
- [x] Cluster: orders gần nhau được group đúng
- [x] Validation: không gán xe đang delivering, không gán driver on_trip
- [x] PostGIS: `ST_Distance` tính khoảng cách chính xác

---

**Next Phase:** [Phase 05 — Backend Real-time GPS & Alerts](./phase-05-backend-realtime.md)
