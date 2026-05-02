# Phase 02: Database Design & Authentication

**Status:** ⬜ Pending
**Dependencies:** Phase 01 (Setup)
**Ước tính:** 3-4 ngày

---

## Objective

Thiết kế database schema đầy đủ với PostGIS, tạo migration files, implement JWT authentication với role-based access (Admin/Driver).

## Implementation Steps

### 1. Database Schema & Migrations
- [ ] Enable PostGIS extension trên Supabase
- [ ] Tạo migration: `users` table
  ```sql
  - id (UUID, PK)
  - email (VARCHAR, UNIQUE)
  - password_hash (VARCHAR)
  - role (ENUM: 'admin', 'driver')
  - is_active (BOOLEAN, default true)
  - created_at, updated_at
  ```
- [ ] Tạo migration: `drivers` table
  ```sql
  - id (UUID, PK)
  - user_id (UUID, FK → users)
  - full_name (VARCHAR)
  - phone (VARCHAR)
  - license_class (VARCHAR) -- hạng bằng lái
  - license_expiry (DATE) -- hạn sử dụng
  - status (ENUM: 'available', 'on_trip', 'off_duty')
  - avatar_url (VARCHAR, nullable)
  - created_at, updated_at
  ```
- [ ] Tạo migration: `vehicles` table
  ```sql
  - id (UUID, PK)
  - plate_number (VARCHAR, UNIQUE)
  - type (ENUM: 'small', 'medium', 'large')
  - max_capacity_kg (DECIMAL)
  - current_load_kg (DECIMAL, default 0)
  - driver_id (UUID, FK → drivers, nullable)
  - status (ENUM: 'available', 'delivering', 'maintenance')
  - image_url (VARCHAR, nullable)
  - last_known_location (GEOGRAPHY(Point, 4326), nullable)
  - created_at, updated_at
  ```
- [ ] Tạo migration: `orders` table
  ```sql
  - id (UUID, PK)
  - pickup_address (VARCHAR)
  - pickup_location (GEOGRAPHY(Point, 4326))
  - delivery_address (VARCHAR)
  - delivery_location (GEOGRAPHY(Point, 4326))
  - weight_kg (DECIMAL)
  - description (TEXT, nullable)
  - status (ENUM: 'pending', 'assigned', 'picked_up', 'delivering', 'delivered', 'failed')
  - created_at, updated_at
  ```
- [ ] Tạo migration: `trips` table
  ```sql
  - id (UUID, PK)
  - vehicle_id (UUID, FK → vehicles)
  - driver_id (UUID, FK → drivers)
  - planned_route (GEOGRAPHY(LineString, 4326), nullable)
  - actual_route (GEOGRAPHY(LineString, 4326), nullable)
  - status (ENUM: 'pending', 'accepted', 'in_progress', 'completed', 'cancelled')
  - started_at (TIMESTAMP, nullable)
  - completed_at (TIMESTAMP, nullable)
  - total_distance_km (DECIMAL, nullable)
  - estimated_fuel_cost (DECIMAL, nullable)
  - created_at, updated_at
  ```
- [ ] Tạo migration: `trip_orders` table (junction)
  ```sql
  - trip_id (UUID, FK → trips)
  - order_id (UUID, FK → orders)
  - sequence (INTEGER) -- thứ tự giao
  - PRIMARY KEY (trip_id, order_id)
  ```
- [ ] Tạo migration: `gps_locations` table
  ```sql
  - id (BIGSERIAL, PK) -- dùng BIGSERIAL vì data nhiều
  - vehicle_id (UUID, FK → vehicles)
  - trip_id (UUID, FK → trips, nullable)
  - location (GEOGRAPHY(Point, 4326))
  - speed_kmh (DECIMAL)
  - heading (DECIMAL) -- hướng di chuyển (0-360)
  - recorded_at (TIMESTAMP)
  - INDEX: (vehicle_id, recorded_at DESC)
  ```
- [ ] Tạo migration: `alerts` table
  ```sql
  - id (UUID, PK)
  - trip_id (UUID, FK → trips)
  - vehicle_id (UUID, FK → vehicles)
  - driver_id (UUID, FK → drivers)
  - type (ENUM: 'speed_violation', 'route_deviation', 'abnormal_stop', 'incident')
  - severity (ENUM: 'low', 'medium', 'high', 'critical')
  - message (TEXT)
  - location (GEOGRAPHY(Point, 4326))
  - is_resolved (BOOLEAN, default false)
  - resolved_at (TIMESTAMP, nullable)
  - created_at
  ```
- [ ] Tạo migration: `driver_kpi` table (aggregate)
  ```sql
  - id (UUID, PK)
  - driver_id (UUID, FK → drivers, UNIQUE)
  - total_trips (INTEGER, default 0)
  - completed_trips (INTEGER, default 0)
  - completion_rate (DECIMAL, default 0) -- %
  - total_violations (INTEGER, default 0)
  - speed_violations (INTEGER, default 0)
  - route_violations (INTEGER, default 0)
  - kpi_score (DECIMAL, default 100) -- 0-100
  - updated_at
  ```

### 2. Seed Data
- [ ] Tạo seed script: 1 Admin user
- [ ] Tạo seed script: 5 Drivers + 5 Driver users
- [ ] Tạo seed script: 5 Vehicles
- [ ] Tạo seed script: 10 sample Orders (với tọa độ HCM/HN)

### 3. Authentication Module (NestJS)
- [ ] Implement `AuthModule`:
  - `POST /auth/register` — Tạo user (admin only)
  - `POST /auth/login` — Email + password → JWT access + refresh token
  - `POST /auth/refresh` — Refresh token → new access token
  - `GET /auth/me` — User info từ JWT
- [ ] Implement `JwtAuthGuard` — protect routes
- [ ] Implement `RolesGuard` — role-based access (`@Roles('admin')`)
- [ ] Implement `@CurrentUser()` decorator — extract user từ JWT
- [ ] Hash passwords với bcrypt
- [ ] JWT config: access token 1h, refresh token 7d

### 4. TypeORM Entities
- [ ] Tạo TypeORM entities cho tất cả tables
- [ ] Setup PostGIS column types trong entities
- [ ] Configure TypeORM connection trong NestJS

## Files to Create/Modify

```
fleet-api/src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── dto/
│   │   ├── login.dto.ts
│   │   ├── register.dto.ts
│   │   └── token-response.dto.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── roles.decorator.ts
│   └── strategies/
│       └── jwt.strategy.ts
├── entities/
│   ├── user.entity.ts
│   ├── driver.entity.ts
│   ├── vehicle.entity.ts
│   ├── order.entity.ts
│   ├── trip.entity.ts
│   ├── trip-order.entity.ts
│   ├── gps-location.entity.ts
│   ├── alert.entity.ts
│   └── driver-kpi.entity.ts
└── migrations/
    └── ... (auto-generated)
```

## Test Criteria
- [ ] Migration chạy thành công, tạo đủ tables
- [ ] PostGIS functions hoạt động: `ST_Distance`, `ST_DWithin`, `ST_MakePoint`
- [ ] Login → nhận JWT token
- [ ] Access protected route với valid token → 200
- [ ] Access protected route không có token → 401
- [ ] Driver access admin route → 403
- [ ] Refresh token hoạt động

---

**Next Phase:** [Phase 03 — Backend Core CRUD APIs](./phase-03-backend-core.md)
