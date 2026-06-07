# API Documentation

Ngày cập nhật: 2026-06-06
Base URL: `http://localhost:3000/api`

---

## 📦 Orders Management

### POST `/orders`
Tạo đơn hàng mới (Admin only).

**Request Body:**
```json
{
  "pickupAddress": "Học viện Công nghệ Bưu chính Viễn thông, Hà Đông, Hà Nội",
  "pickupLat": 20.980689,
  "pickupLng": 105.787689,
  "deliveryAddress": "Hồ Hoàn Kiếm, Hoàn Kiếm, Hà Nội",
  "deliveryLat": 21.028511,
  "deliveryLng": 105.852444,
  "weightKg": 150.5,
  "description": "Linh kiện điện tử dễ vỡ",
  "recipientName": "Nguyễn Văn A",
  "recipientPhone": "0987654321",
  "category": "component",
  "priority": "high",
  "deliveryDeadline": "2026-06-06T18:00:00.000Z"
}
```

**Fields:**
- `recipientName`: Họ tên người nhận (bắt buộc)
- `recipientPhone`: Số điện thoại người nhận (bắt buộc, định dạng Việt Nam)
- `category`: Phân loại hàng hoá (`raw_material` | `finished_goods` | `component` | `equipment` | `other`, mặc định `other`)
- `priority`: Mức độ ưu tiên (`low` | `medium` | `high`, mặc định `medium`)
- `deliveryDeadline`: Thời gian giới hạn nhận hàng (nếu quá thời gian này mà chưa giao, hệ thống sẽ kích hoạt cảnh báo quá hạn `Delivery Overdue` mức độ HIGH đến admin)

**Response (201):**
```json
{
  "id": "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6",
  "pickupAddress": "...",
  "pickupLocation": { "type": "Point", "coordinates": [105.787689, 20.980689] },
  "deliveryAddress": "...",
  "deliveryLocation": { "type": "Point", "coordinates": [105.852444, 21.028511] },
  "weightKg": "150.50",
  "description": "Linh kiện điện tử dễ vỡ",
  "status": "pending",
  "recipientName": "Nguyễn Văn A",
  "recipientPhone": "0987654321",
  "category": "component",
  "priority": "high",
  "deliveryDeadline": "2026-06-06T18:00:00.000Z",
  "createdAt": "2026-06-06T14:33:04.000Z",
  "updatedAt": "2026-06-06T14:33:04.000Z"
}
```

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

## 🗺️ Trips Management

### GET `/trips/my`
Lấy danh sách các chuyến đi của tài xế đang đăng nhập.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "trip-uuid-1",
      "status": "accepted",
      "startedAt": null,
      "endedAt": null,
      "vehicle": { "id": "...", "plateNumber": "..." },
      "orders": [...]
    }
  ]
}
```

---

### GET `/trips/:id`
Lấy thông tin chi tiết một chuyến đi cụ thể.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "trip-uuid-1",
    "status": "accepted",
    "plannedRoute": { "type": "LineString", "coordinates": [...] },
    "orders": [...]
  }
}
```

---

### PATCH `/trips/:id/status`
Cập nhật trạng thái chuyến đi.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "status": "accepted"
}
```

**Mecanism khi chấp nhận đơn ghép:**
Khi tài xế đang có chuyến đi hoạt động (`ACCEPTED`/`IN_PROGRESS`) và chấp nhận một chuyến đi `PENDING` mới gán:
1. Hệ thống tự động gộp (merge) toàn bộ đơn hàng của chuyến đi `PENDING` vào chuyến đi đang hoạt động.
2. Gọi Mapbox Optimization API để tối ưu lại lộ trình mới.
3. Xoá chuyến đi `PENDING` vừa được gộp.
4. Phát đi sự kiện WebSocket `trip:status_changed` với trạng thái custom là `merged` để thông báo cho Admin Dashboard (tránh bắn trạng thái `cancelled` gây toast thông báo lỗi sai lệch trên app tài xế).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "active-trip-uuid",
    "status": "accepted",
    "orders": [...]
  }
}
```

---

