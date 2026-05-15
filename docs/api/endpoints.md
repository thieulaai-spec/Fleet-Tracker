# API Documentation - Dispatch Module

Ngày cập nhật: 2026-05-11
Base URL: `http://localhost:3000/api`

---

## 🛰️ Smart Dispatch

### GET `/dispatch/suggest`
Tìm kiếm và gợi ý xe tối ưu cho một đơn hàng cụ thể.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| orderId | string | Yes | ID của đơn hàng cần gán |

**Algorithm:**
1. Lọc xe có `status = 'available'`.
2. Kiểm tra `maxCapacityKg - currentLoadKg >= order.weightKg`.
3. Kiểm tra `driver.licenseExpiry > now()`.
4. Sắp xếp theo khoảng cách từ `vehicle.lastKnownLocation` đến `order.pickupLocation`.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "vehicle": { "id": "...", "plateNumber": "...", "lastKnownLocation": { "lat": 21.0, "lng": 105.8 } },
      "driver": { "id": "...", "fullName": "..." },
      "distanceKm": 2.5,
      "freeCapacityKg": 500,
      "kpiScore": 85
    }
  ]
}
```

---

### GET `/dispatch/cluster`
Gom nhóm các đơn hàng chờ xử lý dựa trên vị trí địa lý.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| radiusKm | number | 3 | Bán kính để gom nhóm |

**Backend Requirement:** Sử dụng PostGIS `ST_DWithin` hoặc `ST_ClusterDBSCAN`.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "key": "cluster-hanoi-01",
      "label": "Hoàn Kiếm - Hai Bà Trưng",
      "centroid": { "lat": 21.02, "lng": 105.85 },
      "orders": [...]
    }
  ]
}
```

---

### POST `/dispatch/assign`
Thực hiện gán xe vào đơn hàng và khởi tạo chuyến đi.

**Request Body:**
```json
{
  "orderId": "string",
  "vehicleId": "string"
}
```

**Actions:**
1. Update `order.status = 'assigned'`.
2. Update `vehicle.status = 'delivering'`.
3. Create new `Trip` record with `vehicleId`, `driverId`, and the order.

---

## 📊 Driver Performance (KPI)

### GET `/drivers/:id/kpi`
Lấy dữ liệu chỉ số hiệu suất chi tiết của tài xế.

**Path Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | ID của tài xế |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalTrips": 12,
    "completedTrips": 11,
    "completionRate": 91.67,
    "totalViolations": 2,
    "speedViolations": 1,
    "routeViolations": 1,
    "kpiScore": 95,
    "updatedAt": "2026-05-12T10:00:00Z"
  }
}
```

---

## 🗺️ External Services

### Mapbox Geocoding (Address Search)
Dùng để tìm kiếm vị trí và bay đến (Fly-to) trên bản đồ Dispatch.

**Service:** Mapbox Geocoding API
**Frontend Usage:**
- **Endpoint:** `https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json`
- **Params:** `access_token`, `country=vn`, `limit=5`, `proximity={current_location}`.
- **Action:** Trả về danh sách tọa độ (Center). Component `DispatchMapPanel` sử dụng `map.flyTo()` để di chuyển đến vị trí đã chọn.
 
 ---
 
## 🔌 Real-time Tracking (WebSockets)

### Connection Handshake
Sử dụng **Socket.io** để duy trì kết nối thời gian thực giữa Driver App và Backend.

**Endpoint:** `wss://api.example.com/tracking` (Gateway: `TrackingGateway`)

**Authentication:**
- Token được gửi qua trường `auth` trong handshake object.
- **Robust Format:** Backend hỗ trợ cả raw token và token có tiền tố `Bearer `. 
- **Handshake Example:**
```javascript
const socket = io(URL, {
  auth: { token: "your_jwt_token" }
});
```

**Stability Settings:**
- `connectionTimeout`: 60,000ms (Hỗ trợ mạng di động yếu).
- `transports`: `['websocket']`.

**Events:**
- `gps:update`: Gửi vị trí đơn lẻ.
- `gps:batch_update`: Gửi danh sách vị trí (Offline sync).
- `sos:alert`: Báo cáo sự cố khẩn cấp.

---

## 📟 Hardware GPS Ingestion

### POST `/tracking/device`
Endpoint dành cho các thiết bị GPS phần cứng (Hardware modules) để cập nhật vị trí trực tiếp.

**Authentication:**
Yêu cầu mã định danh `apiKey` trong header để xác thực thiết bị.
- **Header:** `X-Device-API-Key: <your_device_api_key>`

**Request Body:**
```json
{
  "deviceId": "string (Unique Identifier)",
  "lat": number,
  "lng": number,
  "speed": number (Optional),
  "heading": number (Optional),
  "timestamp": "ISO8601 string (Optional, default is now)"
}
```

**Actions:**
1. Xác thực `apiKey` khớp với cấu hình hệ thống.
2. Tìm xe (`Vehicle`) được gán với `deviceId` này.
3. Cập nhật `lastKnownLocation` của xe.
4. Phát sự kiện `vehicle:location` qua Socket.io tới Admin dashboard.
5. Lưu vào lịch sử `gps_locations`.

---
