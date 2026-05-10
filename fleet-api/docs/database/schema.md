# Database Schema

## Tables Overview
Hệ thống sử dụng các bảng sau:

| Table Name | Description |
|------------|-------------|
| `users` | Thông tin người dùng (Admin, Manager, Customer) |
| `drivers` | Thông tin tài xế, liên kết với `users` |
| `vehicles` | Thông tin xe, liên kết với `drivers` |
| `orders` | Thông tin đơn hàng vận chuyển |
| `trips` | Chuyến đi, gom các đơn hàng |
| `trip_orders` | Bảng trung gian n-n giữa `trips` và `orders` |
| `gps_locations`| Tọa độ GPS thời gian thực (PostGIS) |
| `alerts` | Các cảnh báo vi phạm (tốc độ, lộ trình...) |
| `driver_kpi` | Chỉ số hiệu suất của tài xế |

## Relationships
- **User -> Driver:** 1-1
- **Driver -> Vehicle:** 1-1 (hoặc 1-n tùy cấu hình)
- **Trip -> Orders:** n-n (qua `trip_orders`)
- **Vehicle -> GPS:** 1-n
- **Trip -> GPS:** 1-n
