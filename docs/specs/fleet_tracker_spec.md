# 📋 SPEC: FleetTracker — Hệ Thống Điều Phối & Quản Lý Đội Xe

**Version:** 1.0
**Created:** 2026-05-02
**Brief:** [BRIEF.md](../BRIEF.md)

**Implementation status:** Phase 05 (Real-time GPS & Alerts) và Phase 06 (Reports & Optimization) đã được triển khai trong backend hiện tại.

---

## 1. Executive Summary

FleetTracker là hệ thống quản lý đội xe vận tải (5-10 xe) gồm:
- **Admin Dashboard** (Web): Quản lý xe, tài xế, đơn hàng, điều phối, giám sát GPS real-time, báo cáo KPI
- **Driver App** (Mobile): Nhận chuyến, xem map, cập nhật trạng thái, báo sự cố
- **Backend API**: REST API + WebSocket cho GPS streaming

---

## 2. User Stories

### 👑 Admin / Dispatcher

| ID | User Story | Priority |
|----|-----------|----------|
| A-01 | Là Admin, tôi muốn đăng nhập để truy cập dashboard | 🔴 Must |
| A-02 | Là Admin, tôi muốn thêm/sửa/xóa xe để quản lý đội xe | 🔴 Must |
| A-03 | Là Admin, tôi muốn thêm/sửa/xóa tài xế | 🔴 Must |
| A-04 | Là Admin, tôi muốn tạo đơn hàng mới | 🔴 Must |
| A-05 | Là Admin, tôi muốn gán đơn hàng cho xe phù hợp | 🔴 Must |
| A-06 | Là Admin, tôi muốn hệ thống gợi ý xe phù hợp nhất | 🟡 Should |
| A-07 | Là Admin, tôi muốn xem toàn bộ xe trên bản đồ real-time | 🔴 Must |
| A-08 | Là Admin, tôi muốn nhận cảnh báo khi xe sai tuyến | 🟡 Should |
| A-09 | Là Admin, tôi muốn nhận cảnh báo khi xe dừng bất thường | 🟡 Should |
| A-10 | Là Admin, tôi muốn nhận cảnh báo khi xe vượt tốc | 🟡 Should |
| A-11 | Là Admin, tôi muốn xem KPI của từng tài xế | 🟡 Should |
| A-12 | Là Admin, tôi muốn xem báo cáo hiệu suất đội xe | 🟡 Should |
| A-13 | Là Admin, tôi muốn điều chỉnh tuyến khi có sự cố | 🟢 Nice |
| A-14 | Là Admin, tôi muốn xem lịch sử hành trình xe | 🟢 Nice |
| A-15 | Là Admin, tôi muốn export báo cáo PDF/Excel | 🟢 Nice |

### 🚗 Driver (Tài xế)

| ID | User Story | Priority |
|----|-----------|----------|
| D-01 | Là Tài xế, tôi muốn đăng nhập vào app | 🔴 Must |
| D-02 | Là Tài xế, tôi muốn xem danh sách chuyến được gán | 🔴 Must |
| D-03 | Là Tài xế, tôi muốn accept/reject chuyến | 🔴 Must |
| D-04 | Là Tài xế, tôi muốn xem tuyến đường trên map | 🔴 Must |
| D-05 | Là Tài xế, tôi muốn bắt đầu chuyến | 🔴 Must |
| D-06 | Là Tài xế, tôi muốn cập nhật trạng thái giao hàng | 🔴 Must |
| D-07 | Là Tài xế, tôi muốn hoàn thành chuyến (chụp ảnh) | 🔴 Must |
| D-08 | Là Tài xế, tôi muốn báo sự cố bằng 1 nút bấm | 🟡 Should |
| D-09 | Là Tài xế, tôi muốn xem vị trí hiện tại trên map | 🔴 Must |
| D-10 | Là Tài xế, app tự gửi GPS lên server liên tục | 🔴 Must |

---

## 3. Data Model (High-Level)

### Entities & Relationships

```
┌──────────┐     1:1      ┌──────────┐
│  USERS   │◄────────────►│ DRIVERS  │
│ (Auth)   │              │          │
└──────────┘              └────┬─────┘
                               │ N:1
                          ┌────▼─────┐      1:N     ┌──────────────┐
                          │ VEHICLES │◄────────────►│ GPS_LOCATIONS│
                          └────┬─────┘              └──────────────┘
                               │ 1:N
                          ┌────▼─────┐
                          │  TRIPS   │
                          │          │
                          └────┬─────┘
                               │ N:N
                          ┌────▼─────┐
                          │  ORDERS  │
                          └────┬─────┘
                               │ 1:N
                          ┌────▼─────┐
                          │  ALERTS  │
                          └──────────┘
```

### Tables Overview

| Table | Mô tả | Key Fields |
|-------|--------|-----------|
| `users` | Auth & phân quyền | id, email, password_hash, role (admin/driver) |
| `drivers` | Thông tin tài xế | id, user_id (FK), full_name, phone, license_class, license_expiry, status |
| `vehicles` | Thông tin xe | id, plate_number, type, max_capacity, driver_id (FK), status, image_url |
| `orders` | Đơn hàng | id, pickup_location (PostGIS), delivery_location (PostGIS), weight, status |
| `trips` | Chuyến đi | id, vehicle_id, driver_id, planned_route (PostGIS), status, started_at, ended_at |
| `trip_orders` | Liên kết trip-order (N:N) | trip_id, order_id |
| `gps_locations` | Lịch sử GPS | id, vehicle_id, location (PostGIS point), speed, heading, recorded_at |
| `alerts` | Cảnh báo vi phạm | id, trip_id, vehicle_id, type (speed/route/idle), details, created_at |
| `driver_violations` | Tổng hợp vi phạm | id, driver_id, trip_id, violation_type, details |

---

## 4. User Flows (Luồng hoạt động)

### Flow 1: Admin tạo đơn & gán xe

```
Admin Dashboard
     │
     ▼
[Tạo đơn hàng]
     │ nhập: điểm lấy, điểm giao, trọng lượng
     ▼
[Hệ thống gợi ý xe]
     │ tính: khoảng cách, tải trọng còn, tài xế rảnh
     ▼
[Admin chọn xe] ← hoặc override thủ công
     │
     ▼
[Tạo Trip + Gán order vào trip]
     │
     ▼
[Gửi thông báo cho Tài xế]
     │
     ▼
[Tài xế accept/reject]
     │
     ├── Accept → Trip status = ASSIGNED
     └── Reject → Quay lại gợi ý xe khác
```

### Flow 2: Tài xế chạy chuyến

```
Driver App
     │
     ▼
[Xem chuyến được gán] → Accept
     │
     ▼
[Bấm "Bắt đầu chuyến"]
     │ → Trip status = IN_PROGRESS
     │ → Bắt đầu gửi GPS mỗi 5-10s
     ▼
[Đến điểm lấy hàng]
     │ → Order status = PICKED_UP
     ▼
[Chạy đến điểm giao]
     │ → GPS streaming liên tục
     │ → Server check: sai tuyến? vượt tốc? dừng lâu?
     ▼
[Đến điểm giao]
     │ → Chụp ảnh xác nhận
     │ → Order status = DELIVERED
     ▼
[Bấm "Hoàn thành chuyến"]
     │ → Trip status = COMPLETED
     │ → Dừng GPS streaming
     │ → Cập nhật KPI tài xế
```

### Flow 3: Cảnh báo real-time

```
GPS Data (từ Driver App)
     │ WebSocket mỗi 5-10s
     ▼
[NestJS WebSocket Gateway]
     │
     ├── [Check tốc độ > giới hạn?]
     │       → CÓ: Tạo alert SPEED_VIOLATION
     │
     ├── [Check vị trí ngoài geofence tuyến?]
     │       → CÓ: Tạo alert ROUTE_DEVIATION
     │
     └── [Check dừng > 10 phút?]
             → CÓ: Tạo alert ABNORMAL_STOP
                │
                ▼
         [Push alert → Admin Dashboard]
         [Lưu violation → driver_violations]
```

---

## 5. API Contract (High-Level)

### Auth
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/auth/me` | Thông tin user hiện tại |

### Vehicles
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/vehicles` | Danh sách xe (filter, search) |
| GET | `/api/vehicles/:id` | Chi tiết xe |
| POST | `/api/vehicles` | Thêm xe |
| PATCH | `/api/vehicles/:id` | Cập nhật xe |
| DELETE | `/api/vehicles/:id` | Xóa xe |
| GET | `/api/vehicles/available` | Xe đang rảnh |

### Drivers
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/drivers` | Danh sách tài xế |
| GET | `/api/drivers/:id` | Chi tiết tài xế |
| POST | `/api/drivers` | Thêm tài xế |
| PATCH | `/api/drivers/:id` | Cập nhật tài xế |
| DELETE | `/api/drivers/:id` | Xóa tài xế |
| GET | `/api/drivers/:id/kpi` | KPI tài xế |

### Orders
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/orders` | Danh sách đơn hàng |
| POST | `/api/orders` | Tạo đơn |
| PATCH | `/api/orders/:id` | Cập nhật đơn |
| PATCH | `/api/orders/:id/status` | Cập nhật trạng thái |

### Dispatch
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/dispatch/suggest` | Gợi ý xe cho đơn hàng |
| POST | `/api/dispatch/assign` | Gán đơn vào xe/trip |
| POST | `/api/dispatch/cluster` | Gom đơn gần nhau |

### Trips
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/trips` | Danh sách chuyến |
| GET | `/api/trips/:id` | Chi tiết chuyến |
| PATCH | `/api/trips/:id/status` | Cập nhật trạng thái |
| POST | `/api/trips/:id/accept` | Tài xế accept chuyến |
| POST | `/api/trips/:id/reject` | Tài xế reject chuyến |
| POST | `/api/trips/:id/start` | Bắt đầu chuyến |
| POST | `/api/trips/:id/complete` | Hoàn thành chuyến |
| POST | `/api/trips/:id/incident` | Báo sự cố |
| GET | `/api/trips/:id/route` | Tuyến đường tối ưu |

### Tracking (WebSocket)
| Event | Direction | Mô tả |
|-------|-----------|-------|
| `gps:update` | Client → Server | Gửi vị trí GPS |
| `vehicle:location` | Server → Client | Broadcast vị trí xe |
| `alert:new` | Server → Client | Cảnh báo vi phạm |
| `trip:status` | Server → Client | Cập nhật trạng thái trip |

### Reports
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/reports/fleet-performance` | Hiệu suất đội xe |
| GET | `/api/reports/driver-kpi` | Bảng KPI tài xế |
| GET | `/api/reports/fuel-cost` | Chi phí nhiên liệu |
| GET | `/api/reports/trip-summary` | Tổng hợp chuyến |
| GET | `/api/reports/export` | Export PDF/Excel |

---

## 6. UI Screens (Tổng quan)

### Admin Dashboard (Web)

| # | Screen | Mô tả |
|---|--------|-------|
| 1 | Login | Đăng nhập admin |
| 2 | Dashboard Overview | Tổng quan: số xe, chuyến hôm nay, KPI, biểu đồ |
| 3 | Vehicle List | Bảng danh sách xe + filter |
| 4 | Vehicle Detail/Form | Thêm/sửa xe + upload ảnh |
| 5 | Driver List | Bảng danh sách tài xế + KPI mini |
| 6 | Driver Detail/Form | Thêm/sửa tài xế |
| 7 | Driver KPI Detail | Chi tiết KPI, lịch sử vi phạm |
| 8 | Order List | Danh sách đơn hàng + trạng thái |
| 9 | Order Create/Edit | Form tạo/sửa đơn + chọn điểm trên map |
| 10 | Dispatch Panel | Gán đơn → xe, gợi ý auto-match |
| 11 | Live Tracking Map | Bản đồ toàn bộ xe real-time |
| 12 | Vehicle Tracking | Theo dõi 1 xe cụ thể |
| 13 | Alerts Panel | Danh sách cảnh báo real-time |
| 14 | Fleet Report | Biểu đồ hiệu suất, chi phí |
| 15 | KPI Leaderboard | Bảng xếp hạng tài xế |

### Driver App (Mobile)

| # | Screen | Mô tả |
|---|--------|-------|
| 1 | Login | Đăng nhập tài xế |
| 2 | Trip List | Danh sách chuyến (pending, active, completed) |
| 3 | Trip Detail | Chi tiết chuyến + danh sách đơn |
| 4 | Navigation Map | Bản đồ tuyến đường + vị trí hiện tại |
| 5 | Delivery Update | Cập nhật trạng thái + chụp ảnh |
| 6 | Incident Report | Nút báo sự cố (1 tap) |
| 7 | Profile | Thông tin cá nhân + KPI |

---

## 7. Tình Huống Đặc Biệt

| Tình huống | Xử lý |
|-----------|-------|
| Tài xế reject chuyến | Quay lại gợi ý xe khác cho Admin |
| Xe gặp sự cố giữa chuyến | Tài xế bấm "Báo sự cố" → Admin nhận alert → Điều xe khác |
| Mất kết nối GPS | Queue GPS data locally, sync khi có mạng lại |
| Tài xế vượt tốc | Alert ngay cho Admin + ghi violation |
| Đơn hàng quá tải trọng xe | Hệ thống không cho gán, báo lỗi |
| Admin xóa xe đang chạy | Không cho xóa, hiển thị cảnh báo |
| 2 đơn cùng khu vực | Gợi ý gom vào 1 trip |
| Bằng lái hết hạn | Cảnh báo Admin, không cho gán chuyến |

---

## 8. Third-party Integrations

| Service | Mục đích | Pricing |
|---------|----------|---------|
| **Mapbox** | Bản đồ, routing, geocoding | Free: 25K map loads/tháng |
| **Supabase** | PostgreSQL + Auth + Storage | Free tier: 500MB DB |
| **Vercel** | Host admin dashboard | Free tier |
| **Railway** | Host NestJS backend | Free tier: $5 credit |

---

## 9. Non-Functional Requirements

| Yêu cầu | Target |
|----------|--------|
| GPS update latency | < 2 giây (WebSocket) |
| API response time | < 500ms (CRUD) |
| Concurrent WebSocket | 10-20 connections (5-10 xe + admin) |
| Map render time | < 3 giây |
| Mobile app size | < 50MB |
| Database | PostgreSQL 15+ với PostGIS |
| Browser support | Chrome, Firefox, Safari (latest) |
| Mobile support | iOS 15+, Android 10+ |
