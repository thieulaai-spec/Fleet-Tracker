# 💡 BRIEF: FleetTracker — Hệ Thống Điều Phối & Quản Lý Đội Xe

**Ngày tạo:** 2026-05-02
**Loại dự án:** Dự án học tập (Full-feature)
**Phạm vi:** Full feature — Không cắt MVP

**Trạng thái hiện tại:** Phase 05 (Real-time GPS & Alerts) và Phase 06 (Reports & Optimization) đã hoàn tất trong `fleet-api`.

---

## 1. VẤN ĐỀ CẦN GIẢI QUYẾT

Quản lý đội xe vận tải (5-10 xe) hiện tại gặp nhiều khó khăn:
- Không biết xe đang ở đâu, chạy đúng tuyến hay không
- Phân xe thủ công, không tối ưu tải trọng và khoảng cách
- Không có dữ liệu KPI để đánh giá tài xế
- Không phát hiện được sự cố kịp thời (sai tuyến, dừng bất thường, vượt tốc)
- Báo cáo chi phí nhiên liệu, hiệu suất thủ công

## 2. GIẢI PHÁP ĐỀ XUẤT

Xây dựng **FleetTracker** — hệ thống quản lý đội xe gồm 2 phần:
- 🖥️ **Admin Dashboard (Web App):** Quản lý xe, tài xế, đơn hàng, điều phối, giám sát real-time, báo cáo
- 📱 **Driver App (Mobile App):** Nhận chuyến, xem tuyến đường, cập nhật trạng thái, báo sự cố

## 3. ĐỐI TƯỢNG SỬ DỤNG

| Vai trò | Mô tả | Platform |
|---------|--------|----------|
| **Admin / Dispatcher** | Quản lý, điều phối xe, giám sát | Web Dashboard |
| **Tài xế (Driver)** | Nhận chuyến, chạy, báo cáo | Mobile App (iOS/Android) |

## 4. NGHIÊN CỨU THỊ TRƯỜNG

### Đối thủ:

| App | Điểm mạnh | Điểm yếu |
|-----|-----------|----------|
| Vietmap TMS (VN) | GPS tracking tốt, quen thị trường VN | UI cũ, thiếu AI |
| QT Software (VN) | Quản lý đội xe, tích hợp ERP | Giá cao, DN lớn |
| Samsara (Global) | AI dashcam, predictive maintenance | Giá cao, không phù hợp VN nhỏ |
| Fleetio (Global) | Maintenance, UX hiện đại | Thiếu GPS native |

### Điểm khác biệt của FleetTracker:
- **UI/UX hiện đại** — Dark theme, real-time map, smooth animations
- **Gom đơn thông minh** — Clustering đơn hàng cùng khu vực
- **KPI minh bạch** — Dashboard hiệu suất tài xế rõ ràng
- **Chi phí thấp** — Phù hợp DN vừa và nhỏ VN (5-10 xe)
- **Full real-time** — GPS cập nhật mỗi 5-10 giây

## 5. TÍNH NĂNG CHI TIẾT

### 🚗 Module 1: Quản Lý Xe
- [ ] CRUD thông tin xe (ID, ảnh, biển số, loại xe, tải trọng)
- [ ] Phân loại: xe tải nhỏ / trung / lớn
- [ ] Trạng thái xe: Rảnh / Đang giao / Bảo trì
- [ ] Gán tài xế phụ trách cho xe
- [ ] Upload và hiển thị hình ảnh xe

### 👨‍✈️ Module 2: Quản Lý Tài Xế
- [ ] CRUD thông tin tài xế (ID, họ tên, SĐT, bằng lái)
- [ ] Quản lý bằng lái (hạng, hạn sử dụng)
- [ ] Trạng thái: Rảnh / Đang chạy
- [ ] Dashboard KPI cá nhân:
  - Tổng chuyến đã chạy
  - Tỉ lệ hoàn thành
  - Số lần vi phạm (vượt tốc, sai tuyến)
  - Điểm KPI tổng

### 📦 Module 3: Quản Lý Đơn Hàng
- [ ] Tạo đơn hàng (điểm lấy hàng, điểm giao, trọng lượng, ghi chú)
- [ ] Trạng thái đơn: Mới / Đã gán / Đang giao / Hoàn thành / Thất bại
- [ ] Lịch sử đơn hàng

### 🚀 Module 4: Điều Phối Xe
- [ ] **Auto-matching:** Gợi ý xe phù hợp dựa trên:
  - Xe gần điểm lấy hàng nhất (geospatial)
  - Xe còn đủ tải trọng
  - Tài xế đang rảnh
- [ ] Gán đơn hàng → xe (manual override)
- [ ] Gán tuyến đường → tài xế
- [ ] Điều chỉnh tuyến khi có sự cố (kẹt xe, xe hỏng)

### 🗺️ Module 5: Theo Dõi Hành Trình (Real-time)
- [ ] GPS tracking real-time (cập nhật 5-10 giây)
- [ ] Bản đồ hiển thị toàn bộ xe (Admin)
- [ ] Bản đồ tuyến đường riêng (Driver)
- [ ] Geofencing — phát hiện sai tuyến
- [ ] Cảnh báo real-time:
  - Đi sai tuyến
  - Dừng bất thường (> X phút)
  - Vượt tốc độ cho phép
- [ ] Lịch sử hành trình (route replay)

### 📊 Module 6: Tối Ưu Vận Hành
- [ ] Gom đơn hàng gần nhau (clustering algorithm)
- [ ] Gợi ý tuyến đường tối ưu (ngắn nhất, ít nhiên liệu)
- [ ] Ước tính thời gian giao hàng (ETA)

### 📈 Module 7: Báo Cáo & Phân Tích
- [ ] Tổng quãng đường (km)
- [ ] Chi phí nhiên liệu (ước tính)
- [ ] Số chuyến hoàn thành / thất bại
- [ ] Bảng xếp hạng KPI tài xế
- [ ] Biểu đồ hiệu suất đội xe (theo ngày/tuần/tháng)
- [ ] Export báo cáo (PDF/Excel)

### 👤 Module 8: Driver App (Mobile)
- [ ] Đăng nhập
- [ ] Nhận chuyến (accept/reject)
- [ ] Xem tuyến đường trên map
- [ ] Bắt đầu chuyến (start trip)
- [ ] Cập nhật trạng thái giao hàng (đã lấy hàng / đang giao / hoàn thành)
- [ ] Hoàn thành chuyến (chụp ảnh xác nhận)
- [ ] Xem vị trí hiện tại trên map
- [ ] Nút báo sự cố (1 tap → thông báo Admin)
- [ ] Gửi GPS liên tục lên server

### 🔐 Module 9: Auth & Phân Quyền
- [ ] Đăng nhập / Đăng xuất
- [ ] Phân quyền: Admin vs Driver
- [ ] JWT token authentication
- [ ] Refresh token

## 6. KIẾN TRÚC ĐỀ XUẤT

### Tech Stack:

| Layer | Công nghệ | Lý do |
|-------|-----------|-------|
| **Admin Frontend** | Next.js 14+ (React) | SSR, App Router, UI hiện đại |
| **Driver Mobile App** | React Native (Expo) | Cross-platform iOS/Android, share logic với web |
| **Backend API** | Node.js + NestJS | TypeScript, WebSocket native, module structure |
| **Database** | PostgreSQL + PostGIS | Geospatial queries, mature, free |
| **Real-time** | WebSocket (Socket.io) | GPS streaming, live updates |
| **Auth** | Supabase Auth hoặc JWT custom | Đơn giản, miễn phí tier |
| **Maps** | Google Maps API / Mapbox | Bản đồ, routing, geocoding |
| **File Storage** | Supabase Storage / Cloudinary | Ảnh xe, ảnh xác nhận giao hàng |
| **Hosting** | Vercel (Web) + Railway/Render (API) | Free tier cho dự án học tập |

### Kiến trúc tổng quan:

```
┌─────────────────┐     ┌──────────────────┐
│  Admin Web App  │     │  Driver Mobile   │
│   (Next.js)     │     │  (React Native)  │
└────────┬────────┘     └────────┬─────────┘
         │                       │
         │    REST API + WS      │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │    Backend API        │
         │    (NestJS)           │
         │                       │
         │  ┌───────────────────┐│
         │  │ WebSocket Server  ││
         │  │ (GPS Streaming)   ││
         │  └───────────────────┘│
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │  PostgreSQL + PostGIS │
         │  (Supabase hosted)    │
         └───────────────────────┘
```

### Data Flow — GPS Real-time:

```
Driver Phone (GPS)
    │
    ▼ (WebSocket emit every 5-10s)
NestJS WebSocket Gateway
    │
    ├──▶ Save to DB (PostGIS point)
    ├──▶ Broadcast to Admin Dashboard (live map)
    ├──▶ Check geofence (sai tuyến?)
    ├──▶ Check speed (vượt tốc?)
    └──▶ Check idle time (dừng bất thường?)
            │
            ▼ (if violation detected)
       Push alert to Admin Dashboard
```

## 7. ƯỚC TÍNH ĐỘ PHỨC TẠP

| Module | Độ khó | Thời gian ước tính |
|--------|--------|-------------------|
| Auth + phân quyền | 🟢 Dễ | 2-3 ngày |
| CRUD xe, tài xế, đơn hàng | 🟢 Dễ | 3-5 ngày |
| Admin Dashboard UI | 🟡 TB | 5-7 ngày |
| Điều phối xe (auto-match) | 🟡 TB | 3-5 ngày |
| KPI & Báo cáo | 🟡 TB | 3-5 ngày |
| Map integration (hiển thị) | 🟡 TB | 3-5 ngày |
| GPS real-time + WebSocket | 🔴 Khó | 7-10 ngày |
| Geofencing + Cảnh báo | 🔴 Khó | 5-7 ngày |
| Gom đơn + Route optimization | 🔴 Khó | 5-7 ngày |
| Driver Mobile App | 🔴 Khó | 10-14 ngày |
| **TỔNG** | | **~46-68 ngày** |

## 8. RỦI RO

| Rủi ro | Mức độ | Giải pháp |
|--------|--------|-----------|
| Google Maps API phát sinh phí | ⚠️ Trung bình | Dùng free tier ($200/tháng) hoặc Mapbox free |
| GPS trên simulator không chính xác | ⚠️ Trung bình | Mock GPS data cho testing |
| WebSocket scale khi nhiều xe | 🟡 Thấp (5-10 xe) | Với 10 xe thì Socket.io đủ |
| PostGIS learning curve | ⚠️ Trung bình | Chỉ dùng basic functions: ST_Distance, ST_Within |
| React Native learning curve | ⚠️ Trung bình | Dùng Expo để đơn giản hóa |

## 9. BƯỚC TIẾP THEO

```
→ Chạy /plan để tạo PRD + Database Schema + API Design chi tiết
→ Chạy /design để thiết kế DB, API, Flow
→ Chạy /visualize để thiết kế UI mockup
→ Chạy /code để bắt đầu implement
```