## [2026-05-11] - Dashboard Real-time Alerts & Monitoring
### Added
- **Frontend (Admin Dashboard)**:
    - Triển khai **Real-time Active Alerts**:
        - Thay thế toàn bộ dữ liệu hardcoded (fake) bằng dữ liệu thực tế từ API `/alerts/active`.
        - Tích hợp **WebSocket Listener** (`alert:new`, `alert:resolved`) để cập nhật danh sách cảnh báo ngay lập tức mà không cần tải lại trang.
        - Tạo hook `useAlerts` hỗ trợ quản lý trạng thái, xử lý lỗi và polling fallback (60s).
        - Cập nhật giao diện Dashboard hiển thị đầy đủ các loại vi phạm: Quá tốc độ, Lệch lộ trình, Dừng đỗ bất thường và Sự cố (Incident).
        - Hỗ trợ chức năng **Dismiss Alert** đồng bộ trực tiếp với cơ sở dữ liệu qua API `/resolve`.

### Fixed
- **Frontend (Admin Dashboard)**:
    - Khắc phục lỗi TypeScript: Xử lý biến `isLoading` bị khai báo trùng lặp trong `DashboardPage`.
    - Đồng bộ hóa kiểu dữ liệu Alert Enums giữa Backend (Postgres) và Frontend (TypeScript).
    - Đảm bảo build production thành công 100% với các thay đổi mới.

## [2026-05-11] - Interactive Order Dispatch & Driver Management (Phase 12)
### Added
- **Frontend (Admin Dashboard)**:
    - Triển khai chức năng **Interactive Order Creation**:
        - Giao diện split-view (Map + Form) cho phép chọn vị trí pickup/delivery trực tiếp trên bản đồ.
        - Hỗ trợ nút "Pick on Map" để lấy tọa độ Lat/Lng chính xác, thay thế dữ liệu hardcoded.
        - Hiển thị Marker màu sắc khác nhau (Tím cho Pickup, Xanh cho Delivery) để dễ nhận diện.
    - Hoàn thiện tính năng **Edit Driver**:
        - Nâng cấp modal đăng ký để hỗ trợ cả tạo mới và cập nhật thông tin tài xế.
        - Đồng bộ hóa dữ liệu tài xế từ bảng vào form chỉnh sửa một cách mượt mà.
    - Cập nhật component `Modal`: Hỗ trợ prop `className` và các kích thước linh hoạt (`xl`).
    - Nâng cấp component `MapBox`: Thêm sự kiện `onClick` để hỗ trợ chọn vị trí tương tác.

### Fixed
- **Backend (API)**:
    - Sửa lỗi nghiêm trọng `column "reset_code" does not exist`: Triển khai migration bổ sung cột `reset_code` và `reset_code_expiry` cho bảng `users`.
- **Frontend (Admin Dashboard)**:
    - Khắc phục lỗi TypeScript build liên quan đến `ModalProps` và `className`.
    - Đảm bảo dự án đạt trạng thái "Production Ready" với bản build thành công 100%.

### Dev Ops
- Tạo nhánh mới `feat/driver-edit-order-map-sync` và đẩy toàn bộ thay đổi lên GitHub.

## [2026-05-11] - Driver App Web Support & Platform Abstraction
### Added
- **Mobile (Driver App)**:
    - Triển khai cơ chế **Platform-specific Components**: Tách biệt logic bản đồ giữa Native (Dùng `react-native-maps`) và Web (Dùng Mock component).
    - Tạo `MapComponents.tsx` và `MapComponents.web.tsx` để đóng gói các thành phần bản đồ.
    - Cho phép chạy Driver App trực tiếp trên trình duyệt (`expo start --web`) để thuận tiện cho việc kiểm thử luồng GPS mà không cần thiết bị thật.

### Fixed
- **Mobile (Driver App)**:
    - Khắc phục lỗi crash nghiêm trọng khi chạy trên Web: `Importing native-only module "react-native/Libraries/Utilities/codegenNativeCommands"`.
    - Sử dụng dynamic `require` trong `MapComponents.tsx` để cô lập hoàn toàn thư viện Native khỏi Web bundler.
    - Sửa lỗi type definition cho `mapRef` để tương thích với cả `MapView` native và Mock component.

## [2026-05-11] - Dispatch API Fixes & Backend Hardening
### Fixed
- **Backend (API)**:
    - Khắc phục lỗi nghiêm trọng `QueryFailedError: FOR UPDATE cannot be applied to the nullable side of an outer join` bằng cách tách biệt truy vấn khóa (lock) thực thể và nạp dữ liệu quan hệ (relations).
    - Áp dụng bản vá cho `DispatchService` (assign/bulk-assign) và `TripsService` (updateStatus).
    - Giải quyết lỗi TypeScript build (`fullTrip is possibly null`) trong `TripsService.ts`.
- **Frontend (Admin Dashboard)**:
    - Sửa lỗi 404 khi gán đơn hàng: Cập nhật `use-orders.ts` gọi đúng endpoint `/api/dispatch/assign` thay vì `/api/orders/:id/assign`.
    - Đồng bộ hóa `use-dispatch-suggest.ts` sử dụng `/api/dispatch/bulk-assign` cho các thao tác gán đơn hàng hàng loạt.
    - Khắc phục lỗi Mapbox runtime: Chuyển đổi các biến màu CSS (`var(--color-...)`) sang mã Hex thông qua hàm `resolveColor` để tương thích với Mapbox GL JS.

## [2026-05-11] - Admin Dashboard Polishing & Build Stability (Phase 11)
### Added
- **Frontend (Admin Dashboard)**:
    - Cải thiện trải nghiệm người dùng với hiệu ứng tương tác (scale, hover states) cho toàn bộ hệ thống `Button`.
    - Tích hợp Menu Dropdown cho các hành động nhanh (Action) trong bảng điều khiển Live Alerts.
    - Hoàn thiện điều hướng cho các nút "View Reports" và "View All" trên Dashboard.

### Fixed
- **Frontend (Admin Dashboard)**:
    - Khắc phục triệt để lỗi Recharts cảnh báo "negative width/height" bằng cơ chế `min-width: 0` trên các container biểu đồ.
    - Giải quyết các lỗi TypeScript build nghiêm trọng:
        - Implicit `any` type trong logic lọc phương tiện của Dashboard Page.
        - Lỗi truy cập `props` của React component trong `Dropdown.tsx`.
- **General**:
    - Đảm bảo dự án đạt trạng thái "Production Ready" với lệnh build thành công.

## [2026-05-10] - Driver App Polishing & SOS Integration (Phase 10)
### Added
- **Mobile (Driver App)**:
    - Triển khai toàn bộ tính năng **SOS Alert**:
        - Giao diện nút SOS với countdown và phản hồi rung/âm thanh.
        - Tích hợp WebSocket gửi tọa độ khẩn cấp (`sos:alert`) về Admin.
        - Hỗ trợ gửi kèm thông tin trip và lý do sự cố.
    - Hoàn thiện **Real-time Tracking**:
        - Tích hợp `expo-location` và `expo-task-manager` cho việc tracking ngầm (background).
        - Cơ chế **Offline Batching**: Tự động lưu trữ tọa độ khi mất mạng và đồng bộ khi có kết nối trở lại.
    - Cải thiện UX/UI:
        - Hiển thị trạng thái kết nối (Connection Awareness) trực quan.
        - Tối ưu hóa hiệu suất Map rendering trên thiết bị di động.
- **Backend (API)**:
    - Triển khai `gps:batch_update` socket handler để hỗ trợ đồng bộ vị trí số lượng lớn.
    - Bổ sung `sos:alert` handler trong `TrackingGateway` để điều hướng cảnh báo khẩn cấp.
    - Cập nhật `AlertsModule` hỗ trợ báo cáo sự cố chi tiết từ tài xế.

### Changed
- **Mobile (Driver App)**:
    - Nâng cấp cơ chế Offline Sync: Sử dụng sự kiện `gps:batch_update` để gửi toàn bộ dữ liệu vị trí trong queue chỉ với một request.
    - Cải thiện **Proof of Delivery (POD)**:
        - Sử dụng `expo-file-system` để lưu trữ tạm thời chữ ký, khắc phục lỗi hiển thị trên Android.
        - Fix logic hoàn tất chuyến đi: Chỉ đóng chuyến đi khi *tất cả* đơn hàng đã được giao và ký nhận.
        - Khắc phục lỗi build TypeScript v18 của `expo-file-system`.
    - Profile: Thay thế `Math.random()` bằng các phép tính tốc độ thực tế từ lịch sử di chuyển.

### Fixed
- Build: Khắc phục triệt để lỗi TypeScript config và JSX resolution trên Expo.
- Backend: Sửa lỗi type-safety trong các báo cáo nhiên liệu (explicit typing for Decimal fields).
- State: Hoàn thiện logic `rejectTrip` và đồng bộ trạng thái đơn hàng.


# Changelog

Tất cả các thay đổi quan trọng đối với dự án FleetTracker sẽ được ghi nhận tại đây.

## [2026-05-09] - Admin Reports & Analytics (Phase 09)
### Added
- **Frontend (Admin Dashboard)**:
    - Triển khai toàn bộ module **Reports & Analytics**:
        - **Fuel Report**: Biểu đồ phân tích chi phí nhiên liệu theo xe và thời gian.
        - **KPI Report**: Theo dõi chỉ số hoàn thành chuyến đi và điểm an toàn.
        - **Trips Report**: Thống kê số lượng chuyến đi và quãng đường.
        - **Utilization Report**: Biểu đồ đo lường hiệu suất sử dụng đội xe.
    - Tích hợp tính năng lọc (Filtering) và phân trang cho các bảng dữ liệu báo cáo.
- **Documentation**:
    - Cập nhật tiến độ dự án cho Phase 10 (Driver App).
    - Tạo PR #12 hoàn tất Phase 09.

### Fixed
- Frontend: Khắc phục lỗi TypeScript nghiêm trọng trong component `DataTable` gây lỗi build production.
- Frontend: Đồng bộ hóa kiểu dữ liệu cho các cột báo cáo để đảm bảo type-safety.

## [2026-05-09] - Admin Maps & Monitoring (Phase 08)
### Added
- **Frontend (Admin Dashboard)**:
    - Triển khai toàn bộ module **Real-time Fleet Tracking**:
        - Bản đồ vệ tinh với markers xe di chuyển mượt mà (smooth animation).
        - Hiển thị trail (lịch sử di chuyển ngắn hạn) với màu sắc theo tốc độ.
        - Visualization hành lang địa giới (Geofence Corridor) 500m quanh tuyến đường dự kiến.
    - Hoàn thiện module **Route Replay** (`/tracking/replay`):
        - Hỗ trợ chọn xe và ngày để xem lại hành trình.
        - Bộ điều khiển playback (Play/Pause/Speed) và thanh timeline slider.
    - Cải tiến **Alerts Panel**:
        - Tích hợp âm thanh thông báo và click để focus bản đồ vào vị trí sự cố.
        - Hỗ trợ lọc cảnh báo theo loại và trạng thái xử lý.
    - Tích hợp bản đồ vào **Dispatch Center** để hỗ trợ điều phối trực quan.
### Fixed
- Frontend: Khắc phục lỗi TypeScript trong component `MapBox` và trang `tracking`.
- Frontend: Sửa lỗi hiển thị sai tên tài xế (mismatch `fullName` vs `name`) trên tooltip.
- Frontend: Xử lý triệt để lỗi crash bản đồ khi dữ liệu GPS nhận về giá trị `NaN`.

## [2026-05-08] - Final API Hardening & Testing Completion (PR #8)
### Added
- Khởi tạo cấu trúc monorepo: `fleet-api`, `fleet-admin`, `fleet-driver`.
- Thêm file `README.md` gốc với đầy đủ thông tin dự án và hướng dẫn khởi chạy.
- Thiết lập kế hoạch phát triển chi tiết trong thư mục `plans/`.
- Tài liệu hóa dự án trong thư mục `docs/` (`BRIEF.md`, `DESIGN.md`).

### Fixed
- Lỗi thiếu tài liệu hướng dẫn tổng quan tại thư mục gốc.

## [2026-05-05]
### Added
- Backend: Hoàn thiện Phase 04 - Điều phối và Gán đơn hàng.
- Backend: Triển khai tính năng gán đơn hàng hàng loạt (`bulk-assign`).
- Backend: Tích hợp tự động cập nhật KPI tài xế khi hoàn thành chuyến đi.
- Backend: Thắt chặt logic validation trạng thái xe và tài xế trong quá trình gán đơn.

## [2026-05-05] - Phase 06
### Added
- Backend: Triển khai **KPI Engine** tự động cập nhật điểm thưởng/phạt dựa trên sự kiện (Speed, Route, Stop, Incident).
- Backend: Thêm **ReportsModule** hỗ trợ báo cáo hiệu suất đội xe, chi phí nhiên liệu và tỷ lệ sử dụng xe.
- Backend: Tích hợp **ExportService** xuất báo cáo định dạng Excel (XLSX) và PDF.
- Backend: Triển khai **OptimizationModule** tích hợp Mapbox Directions API để tối ưu tuyến đường.
- Backend: Sử dụng PostGIS để tính quãng đường di chuyển thực tế từ lịch sử GPS.
- Backend: Thêm bộ test suite tự động cho các logic tính toán quan trọng (KPI, Fuel, Optimization).

## [2026-05-06]
### Added
- **Frontend (Admin Dashboard - Phase 07)**:
    - Hoàn thiện toàn bộ giao diện quản trị: Dashboard Overview, Vehicles, Drivers, Orders, Dispatch Control Center.
    - Đồng bộ hóa logic xác thực (Auth) và xử lý NestJS API response wrapper (`{data, statusCode, message}`).
    - Kết nối thành công dữ liệu thực tế từ backend vào UI thông qua React Query.
    - Khắc phục triệt để lỗi Redirect Loop khi đăng nhập.
    - Cập nhật script `comprehensive-seed.ts` để khởi tạo dữ liệu mẫu cho toàn bộ hệ thống.
### Fixed
- Lỗi mismatch kiểu dữ liệu giữa Frontend và Backend (Status ENUMs, field names như `customerName` vs `deliveryAddress`).
## [2026-05-07] - Testing & API Docs
### Added
- Backend: Triển khai bộ Unit Test toàn diện cho `AuthService` (13/13 tests pass).
- Backend: Triển khai bộ E2E Test cho Module **Authentication** (Bearer & Cookie Auth, Logout flow).
- Backend: Triển khai bộ E2E Test cho Module **Orders** (CRUD, Status Transitions, RBAC Protection).
- Documentation: Cập nhật `docs/api/endpoints.md` với chi tiết về GPS updates và Alert reporting.
- Testing: Tự động hóa việc tạo test users động (Admin/Driver) để đảm bảo tính cô lập của bài test.

### Fixed
- Backend: Sửa lỗi duplicate `bcrypt` imports trong các file spec.
- Backend: Đồng bộ hóa kiểu dữ liệu response (Decimal/String mismatch) trong bài test E2E.
- Backend: Khắc phục lỗi linting liên quan đến `UserRole` enum.

## [2026-05-07] - Initial Fixes
### Added
- Backend: Thêm biến môi trường cho mật khẩu seeding (`ADMIN_PASSWORD`, `DRIVER_PASSWORD`, `DISPATCHER_PASSWORD`).
- Backend: Bổ sung kiểm tra địa chỉ nhận/giao không trùng nhau trong `OrdersService`.
### Fixed
- Backend: Chuyển `synchronize: true` sang chỉ áp dụng cho môi trường development.
- Backend: Cấu hình hardened cho `UploadService` (config validation, robust extension extraction).
- Backend: Sửa lỗi TypeScript compile trong `AuthService` và `CreateOrderDto`.
- Backend: Sử dụng Enum `DriverStatus` thay vì hardcoded string trong `seed.ts`.

## [2026-05-07] - Refactoring & Security (PR #3)
### Added
- Backend: Triển khai bộ unit test cho `ViolationDetectorService` kiểm tra debouncing và caching.
- Backend: Cập nhật unit test cho `TrackingService` bao phủ cơ chế batching mới.

### Changed
- Backend: Tối ưu hóa **Tracking Module**:
    - Chuyển sang lưu trữ batch GPS (Buffer) để giảm tải cho Database.
    - Bảo mật hóa WebSocket: Cấm token trong query string, thêm ownership check cho tài xế.
    - Fix SQL Injection bằng cách sử dụng Parameterized Query trong `vehicleRepository`.
- Backend: Nâng cấp **Alerts Module**:
    - Thêm cơ chế **Route Caching** và **Alert Debouncing** (5 phút cooldown) để tránh notification spam.
    - Chuẩn hóa Enums cho `AlertsController`.
    - `Alert` entity: `driverId` cho phép nullable để xử lý linh hoạt hơn.

### Fixed
- Backend: Sửa lỗi khai báo trùng lặp biến `authHeader` trong `TrackingGateway`.
## [2026-05-07] - Dispatch Optimization & Reports (PR #4)
### Added
- **Optimization Module**:
    - Tôn trọng thứ tự tuyến đường (`sequence`) trước khi gửi đến Mapbox Directions API.
    - Thêm timeout 5s cho các gọi API ngoại vi (axios) để tăng tính ổn định.
- **KPI Module**:
    - Chuyển đổi logic cập nhật `completionRate` sang SQL atomic updates để tránh race condition.
- **Reports Module**:
    - Sử dụng triệt để Database Aggregation cho báo cáo hiệu suất đội xe.
    - Cập nhật bộ test suite cho `KpiService` and `ReportsService`.

### Changed
- **Reports Module**: 
    - Loại bỏ validation thủ công trong `ReportsController`, sử dụng `ValidationPipe` và `DateRangeDto`.
    - Hiện đại hóa cách import `PDFKit` trong `ExportService`.

### Fixed
- **Driver App**: Fix lỗi TypeScript compile (`unused @ts-expect-error`) trong `ExternalLink.tsx`.
- **KPI Module**: Sửa lỗi kiểu dữ liệu trả về `null` trong `getOrCreateKpi`.
- **Optimization Module**: Đồng bộ hóa chính xác tọa độ trạm dừng (`waypoints`) with Mapbox API.
