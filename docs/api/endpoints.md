# API Documentation - Fleet Tracker

Ngày cập nhật: 2026-05-10
Base URL: `http://localhost:3001`

---

## 🔐 Authentication

### POST `/auth/login`
Đăng nhập vào hệ thống.
**Header khuyên dùng:** `x-client-type: web` (để nhận token qua cookie).

**Request Body:**
```json
{
  "email": "admin@fleettracker.com",
  "password": "Password@123"
}
```

**Response (200):**
*Nếu là web client:*
```json
{
  "user": { "id": "uuid", "email": "...", "role": "admin" }
}
```
*Nếu là mobile client:*
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { ... }
}
```

### POST `/auth/refresh`
Làm mới access token bằng refresh token (từ body hoặc cookie).

### POST `/auth/logout`
Đăng xuất và hủy refresh token trong database.

### GET `/auth/me`
Lấy thông tin profile người dùng hiện tại.

---

## 🚚 Vehicles

### GET `/vehicles`
Lấy danh sách phương tiện.

### GET `/vehicles/available`
Lấy danh sách phương tiện đang rảnh (không trong chuyến đi nào).
**Roles:** Admin, Dispatcher.

### POST `/vehicles`
Tạo phương tiện mới.

---

## 👥 Drivers

### GET `/drivers`
Lấy danh sách tài xế.

---

## 📦 Orders

### GET `/orders`
Lấy danh sách đơn hàng. Hỗ trợ phân trang và lọc qua Query Params.

### POST `/orders`
Tạo đơn hàng mới (Admin).

---

## 🏗️ Dispatch & Assignment

### POST `/dispatch/assign`
Gán một đơn hàng cho phương tiện và tạo chuyến đi.

### POST `/dispatch/bulk-assign`
Gán nhiều đơn hàng cho cùng một phương tiện trong một chuyến đi duy nhất.
**Request Body:**
```json
{
  "vehicleId": "uuid",
  "orderIds": ["uuid-1", "uuid-2"]
}
```

### GET `/dispatch/suggest/:orderId`
Gợi ý danh sách xe khả dụng cho một đơn hàng dựa trên khoảng cách và tải trọng.

### POST `/dispatch/cluster`
Tự động nhóm các đơn hàng chờ xử lý dựa trên vị trí lấy hàng (bán kính 3km).

---

## 📊 Reports & Analytics

### GET `/reports/fleet-performance`
Lấy thông tin tổng quan hiệu suất đội xe.
**Query Params:** `from`, `to` (ISO Date).

### GET `/reports/driver-kpi/:driverId`
Lấy chi tiết KPI của một tài xế (Số chuyến đi, tỷ lệ hoàn thành, số sự cố).

### GET `/reports/kpi-leaderboard`
Bảng xếp hạng tài xế dựa trên điểm KPI.

### GET `/reports/fuel-cost`
Báo cáo chi phí nhiên liệu dựa trên quãng đường thực tế.

### GET `/reports/vehicle-utilization`
Thống kê hiệu suất sử dụng xe (xe nào đang chạy, xe nào rảnh).

### GET `/reports/export`
Xuất báo cáo (XLSX/PDF).
**Report Names:** `fleet-performance`, `fuel-cost`, `kpi-leaderboard`.

---

## 🗺️ Route Optimization

### GET `/optimization/trip/:id/eta`
Dự đoán thời gian đến (ETA) dựa trên vị trí hiện tại.
**Query Params:** `lat`, `lng`.

### POST `/optimization/trip/:id/optimize`
Yêu cầu hệ thống tính toán lại tuyến đường tối ưu cho chuyến đi (Mapbox integration).

---

## 📡 Tracking (WebSocket)
**Endpoint:** `ws://localhost:3001/tracking`

**Authentication:** 
Token phải được gửi qua `auth.token` trong handshake.

### Events Emitted (Client -> Server):

#### `gps:update`
Cập nhật GPS đơn lẻ. Server thực hiện debouncing (5s) và kiểm tra tính hợp lệ của trip/vehicle.
**Payload:**
```json
{
  "vehicleId": "uuid",
  "tripId": "uuid",
  "latitude": 10.123,
  "longitude": 106.456,
  "speed": 50,
  "heading": 90,
  "timestamp": 1651854000000
}
```

#### `gps:batch_update`
Cập nhật GPS theo lô (Batch). Dùng khi tài xế có kết nối trở lại sau khi offline để đồng bộ toàn bộ lịch sử di chuyển.
**Payload:** `GpsUpdateDto[]` (Mảng các object tương tự `gps:update`).

**Response Event:** `gps:batch_received`
**Payload:** `{ count: number, timestamp: number }`

#### `subscribe:trip`
Đăng ký nhận cập nhật cho một chuyến đi cụ thể.
**Payload:**
```json
{
  "tripId": "uuid"
}
```

#### `sos:alert` (Client -> Server)
Gửi tín hiệu khẩn cấp ngay lập tức. Server sẽ broadcast đến toàn bộ Admin và Dispatcher.
**Payload:**
```json
{
  "tripId": "uuid",
  "vehicleId": "uuid",
  "latitude": 10.123,
  "longitude": 106.456,
  "message": "Chi tiết sự cố (tùy chọn)",
  "timestamp": 1651854000000
}
```

---

## 🔔 Alerts

### GET `/alerts/active`
Lấy danh sách các cảnh báo chưa xử lý.
**Roles:** Admin, Dispatcher.

### GET `/alerts/stats`
Thống kê số lượng cảnh báo theo loại.
**Roles:** Admin.

### POST `/alerts/report-incident`
Tài xế báo cáo sự cố. Cảnh báo sẽ được tự động debouncing nếu trùng vị trí/thời gian.
**Roles:** Driver.

**Request Body (ReportIncidentDto):**
```json
{
  "tripId": "uuid",
  "vehicleId": "uuid",
  "message": "Chi tiết sự cố...",
  "type": "ACCIDENT | MECHANICAL | THEFT | OTHER",
  "location": {
    "latitude": 10.762622,
    "longitude": 106.660172
  }
}
```

### PUT `/alerts/:id/resolve`
Đánh dấu cảnh báo đã xử lý.
**Roles:** Admin, Dispatcher.
