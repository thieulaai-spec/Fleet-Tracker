# Phase 03: Backend — Core CRUD APIs

**Status:** ⬜ Pending
**Dependencies:** Phase 02 (Database & Auth)
**Ước tính:** 4-5 ngày

---

## Objective

Implement đầy đủ CRUD APIs cho Vehicles, Drivers, Orders với validation, pagination, filtering, sorting, và file upload.

## Implementation Steps

### 1. Vehicles Module
- [ ] `VehiclesModule` — module setup
- [ ] `VehiclesController`:
  - `GET /vehicles` — List all (filter by status, type; pagination; search by plate)
  - `GET /vehicles/:id` — Get by ID (include driver info)
  - `POST /vehicles` — Create (admin only)
  - `PATCH /vehicles/:id` — Update (admin only)
  - `DELETE /vehicles/:id` — Soft delete (admin only, block nếu đang delivering)
  - `GET /vehicles/available` — Xe rảnh + đủ tải trọng
  - `POST /vehicles/:id/image` — Upload ảnh xe
- [ ] `VehiclesService` — business logic
- [ ] DTOs:
  - `CreateVehicleDto` — plate_number, type, max_capacity_kg
  - `UpdateVehicleDto` — partial update
  - `VehicleQueryDto` — filter, pagination, sort
  - `VehicleResponseDto` — response shape
- [ ] Validation rules:
  - plate_number: unique, format check
  - max_capacity_kg: > 0
  - Không xóa xe đang `delivering`
  - Không gán driver đang `on_trip`

### 2. Drivers Module
- [ ] `DriversModule` — module setup
- [ ] `DriversController`:
  - `GET /drivers` — List all (filter by status; pagination; search by name/phone)
  - `GET /drivers/:id` — Get by ID (include KPI, vehicle info)
  - `POST /drivers` — Create (admin only, tự tạo user account)
  - `PATCH /drivers/:id` — Update (admin only)
  - `DELETE /drivers/:id` — Soft delete (admin only, block nếu đang on_trip)
  - `GET /drivers/:id/kpi` — KPI chi tiết
  - `GET /drivers/:id/trips` — Lịch sử chuyến
  - `GET /drivers/:id/violations` — Lịch sử vi phạm
- [ ] `DriversService` — business logic
- [ ] DTOs:
  - `CreateDriverDto` — full_name, phone, email, password, license_class, license_expiry
  - `UpdateDriverDto` — partial update (không đổi email)
  - `DriverQueryDto` — filter, pagination
  - `DriverResponseDto` — response (hide password)
  - `DriverKpiResponseDto` — KPI data
- [ ] Validation rules:
  - phone: format VN (10 số)
  - email: unique
  - license_expiry: cảnh báo nếu < 30 ngày
  - Không xóa driver đang `on_trip`

### 3. Orders Module
- [ ] `OrdersModule` — module setup
- [ ] `OrdersController`:
  - `GET /orders` — List all (filter by status; pagination; date range)
  - `GET /orders/:id` — Get by ID (include trip info)
  - `POST /orders` — Create (admin only)
  - `PATCH /orders/:id` — Update (admin only, chỉ khi pending)
  - `PATCH /orders/:id/status` — Update status
  - `DELETE /orders/:id` — Cancel (chỉ khi pending)
  - `GET /orders/pending` — Đơn chưa gán
- [ ] `OrdersService` — business logic
- [ ] DTOs:
  - `CreateOrderDto` — pickup_address, pickup_lat, pickup_lng, delivery_address, delivery_lat, delivery_lng, weight_kg, description
  - `UpdateOrderDto` — partial (chỉ khi pending)
  - `UpdateOrderStatusDto` — status transition validation
  - `OrderQueryDto` — filter, pagination
- [ ] Validation rules:
  - weight_kg: > 0
  - pickup ≠ delivery location
  - Status transitions: pending → assigned → picked_up → delivering → delivered/failed
  - Không sửa/xóa đơn đã assigned trở đi

### 4. File Upload (Ảnh xe, Ảnh xác nhận)
- [ ] Implement file upload service (Supabase Storage)
- [ ] Endpoint: `POST /upload` — generic upload
- [ ] Max file size: 5MB
- [ ] Accepted types: jpg, png, webp
- [ ] Return public URL

### 5. Common Utilities
- [ ] Pagination helper (offset-based)
  ```typescript
  // Input: page, limit
  // Output: { data, total, page, limit, totalPages }
  ```
- [ ] Search/Filter pipe
- [ ] Response interceptor (consistent response format)
- [ ] Exception filter (consistent error format)

## Files to Create/Modify

```
fleet-api/src/
├── vehicles/
│   ├── vehicles.module.ts
│   ├── vehicles.controller.ts
│   ├── vehicles.service.ts
│   └── dto/
│       ├── create-vehicle.dto.ts
│       ├── update-vehicle.dto.ts
│       ├── vehicle-query.dto.ts
│       └── vehicle-response.dto.ts
├── drivers/
│   ├── drivers.module.ts
│   ├── drivers.controller.ts
│   ├── drivers.service.ts
│   └── dto/
│       ├── create-driver.dto.ts
│       ├── update-driver.dto.ts
│       ├── driver-query.dto.ts
│       └── driver-response.dto.ts
├── orders/
│   ├── orders.module.ts
│   ├── orders.controller.ts
│   ├── orders.service.ts
│   └── dto/
│       ├── create-order.dto.ts
│       ├── update-order.dto.ts
│       ├── update-order-status.dto.ts
│       ├── order-query.dto.ts
│       └── order-response.dto.ts
├── upload/
│   ├── upload.module.ts
│   ├── upload.controller.ts
│   └── upload.service.ts
└── common/
    ├── dto/
    │   └── pagination.dto.ts
    ├── interceptors/
    │   └── response.interceptor.ts
    └── filters/
        └── http-exception.filter.ts
```

## Test Criteria
- [ ] CRUD Vehicles: create, read, update, delete — tất cả hoạt động
- [ ] CRUD Drivers: create (tự tạo user), read (include KPI), update, delete
- [ ] CRUD Orders: create (với lat/lng), filter by status, status transitions
- [ ] File upload: upload ảnh → nhận URL → hiển thị được
- [ ] Pagination: page=1&limit=10 → đúng số lượng
- [ ] Filter: status=available → chỉ trả available
- [ ] Validation: thiếu field → 400 Bad Request
- [ ] Auth: admin routes cần JWT + admin role

---

**Next Phase:** [Phase 04 — Backend Dispatch & Assignment](./phase-04-backend-dispatch.md)
