## [2026-05-18] - Order Detail Vehicle Selection Crash Fix
### Fixed
- **Couldn't find a navigation context crash when selecting a vehicle**:
  - Resolved a critical crash that occurred when selecting a non-optimal vehicle on the order details screen inside the `fleet-driver` mobile app.
  - Replaced dynamic Tailwind CSS shadow and opacity classes (e.g. `shadow-indigo-500/10`) in `OrderDetailScreen` (`[id].tsx`) and `VehicleDispatchItem` (`VehicleDispatchItem.tsx`) with robust native React Native inline shadow style properties to prevent layout tree CSS parsing race conditions under Expo Router.

## [2026-05-18] - Order Management Map Integration & Tailwind CSS Migration
### Added
- **Interactive Map Search & Reverse Geocoding in MapPicker**:
  - Re-engineered `MapPicker.tsx` to support real-time Address Search (Autocomplete) using Mapbox Search API directly inside the picker modal.
  - Implemented automatic Reverse Geocoding utilizing dynamic map coordinates to retrieve real-time street address strings upon dragging the picker's central pin or panning the map view.
  - Upgraded callback method `onSelect` signature to dispatch both geographic coordinates `(latitude, longitude)` and resolved readable address `(address)` back to the parent components.
  - Enhanced mobile layout with premium glassmorphism overlay headers, dynamic drop-down search result overlays, and fluid dark-mode elements matching the dashboard style.

### Changed
- **OrderForm Tailwind CSS Migration**:
  - Migrated `OrderForm.tsx` completely from classical React Native `StyleSheet` styling to utility-first Tailwind CSS (NativeWind v4) layouts.
  - Integrated dynamic MapPicker coordinate & address states directly into the Form fields, replacing static, manual input fields for pickup and delivery locations.
- **Auto Admin Dashboard Redirection**:
  - Wired in user role authorization checks inside the mobile home screen (`fleet-driver/app/(tabs)/index.tsx`).
  - Added immediate redirection logic to automatically swap standard driver dashboard panels with the `(tabs)/admin-dashboard` layout when an Administrator persona signs in.

### Fixed
- **Mobile Order Detail Map Load Error**:
  - Fixed map viewport failure inside order detail views (`fleet-driver/app/admin/orders/[id].tsx`) where the Mapbox/Google Map engine failed to paint or rendered with dimensions of 0x0 pixels.
  - Swapped standard `className="flex-1"` with explicit inline style declaration `style={{ flex: 1 }}` to correctly enforce layout bounds on native MapViews under the NativeWind v4 compiler.
- **Admin Dashboard Cleanup**:
  - Removed outdated pulse banner indicators inside the web admin creation portal `OrderCreateModal.tsx` to maintain unified presentation standards.

## [2026-05-18] - Admin Profile View Streamlining
### Changed
- **Profile Tab Customizations for Admin Role**:
  - Excluded standard stats view (`ProfileStats`) from Administrator profiles inside `fleet-driver/app/(tabs)/profile.tsx` to streamline their profile experience.
  - Excluded trip/mission history (`MissionHistory`) for Administrator accounts, hiding the driver-specific card.
  - Excluded driver-specific settings (like the "Duty Status" switch) in `fleet-driver/components/profile/SettingsSection.tsx` by introducing the `showDutyStatus` condition based on user role (`user?.role !== 'admin'`).

## [2026-05-18] - Live Map Tracking Marker Bugfix & Tailwind CSS Migration
### Added
- **Tailwind CSS Styling**: Migrated custom marker component `FleetMarker.tsx` from raw React Native `StyleSheet` to unified Tailwind CSS (NativeWind) classes, matching the global premium logistics visual aesthetic.

### Fixed
- **Marker Cutoff and Disappearance on Live Map**:
  - Solved the persistent bug where live tracking vehicle marker icons were partially cut off or disappeared completely during dynamic WebSocket telemetry updates.
  - Hardened container dimensions using static, explicit width/height constraints (`w-[120px] h-[65px]`) combined with `overflow-visible` and `bg-transparent` properties to ensure all marker elements (vehicle icon, license plate card, anchor arrow) remain fully visible.
  - Increased `tracksViewChanges` redraw delay timer from `300ms` to `1500ms` in the react-native-maps `useEffect` lifecycle to allow complex UI layouts and icons to completely paint before pausing expensive native map canvas redraw threads.
  - Re-implemented vehicle movement orientation (heading) dynamic rotation through standard inline styles (`transform: [{ rotate: ... }]`) to rotate the indicator smoothly without breaking the layout bounds.

## [2026-05-17] - Driver Creation & Editing UI Improvements
### Added
- **Tailwind CSS Styling**: Migrated legacy vanilla Stylesheets in `DriverForm.tsx` to utility-first Tailwind CSS classes, matching the glassmorphic dark-mode admin aesthetic.
- **Dynamic Date Picker Modal**: Replaced the standard text field with a native React Native DateTimePicker modal for selecting the driver's license expiration date in `YYYY-MM-DD` format.
- **Create Driver Password Field**: Added a new `Password` field (minimum 6 characters, secure text entry) to the driver creation interface.

### Fixed
- **Driver Editing Fields & NestJS Payload Violations**:
  - Made the `Email` field read-only (`editable={!initialData}`) and visually dimmed it during editing to prevent accidental changes.
  - Stripped both `email` and `password` fields from the update payload in `handleSubmit` before passing it to `onSubmit`, resolving the `property email should not exist` NestJS validation error.

## [2026-05-17] - Driver Filtering & Friendly Error Messages
### Added
- **User-Friendly Error Handling (`fleet-driver`)**:
    - Introduced a central error parsing utility `fleet-driver/utils/error.ts` to extract descriptive error messages from backend exceptions and raw Axios payloads, replacing technical "Request failed with status code" messages.
    - Integrated the new error-handling framework across authentication flow (`useAuthFlow.ts`), profile management (`useProfileFlow.ts`), and global Zustand state stores (`useFleetStore.ts`, `useFleetTrackingStore.ts`, `useTripStore.ts`).
    - Handled peripheral errors in camera capture and signature pad uploads to guarantee localized, readable mobile notifications.

### Fixed
- **Role-based Driver Exclusion (`fleet-api`)**:
    - Fixed driver listing and assignment issues where administrator and dispatcher accounts mistakenly appeared as selectable drivers on the mobile app's fleet-driver tab and within vehicle-driver assignment interfaces.
    - Replaced generic user listings in `DriversService.findAll` with precise query builders that explicitly target and filter only records associated with the `DRIVER` role.
    - Updated `VehiclesService` role check to reject non-driver profiles when assigning drivers to fleet vehicles, backed by comprehensive mock tests in `vehicles.service.spec.ts` and `drivers.service.spec.ts`.
- **Cascading Vehicle & Driver Deletion Support (`fleet-api`)**:
    - Fixed database constraint violations when deleting a Vehicle or Driver associated with dynamic Trip history.
    - Updated `Trip` entity relations (`vehicle`, `driver`) to `nullable: true` and configured `{ onDelete: 'SET NULL' }` cascading constraints.
    - Standardized `vehicleId` and `driverId` to nullable types on the `Trip` entity, preventing TypeORM query crashes.
    - Hardened `AlertsService` and `TripsService` to handle null `vehicleId` and `driverId` fields safely.
- **Order Form & Address Autocomplete Stability (`fleet-driver`)**:
    - Resolved critical React Native crash caused by standard comments outside of `<Text>` tags inside layout views in `create.tsx`.
    - Fixed `VirtualizedLists should never be nested inside plain ScrollViews` warning/crash on Address Autocomplete popup by swapping `<FlatList>` with `<ScrollView>` and a standard `.map()` structure in `AddressAutocomplete.tsx`.
    - Avoided empty string boolean coercion bugs by replacing standard ternary string validations with strict boolean checks (`!!error`, `!!errors.weightKg`) on text fields.

## [2026-05-17] - Admin Vehicle Creation Fix & Driver Checks
### Added
- **Driver Eligibility Validation (`fleet-api`)**:
    - Implemented a check in `VehiclesService.create` to verify that when assigning a driver to a vehicle during creation, the driver exists in the database.
    - Added validation to ensure the driver is not currently active on another trip (`DriverStatus.ON_TRIP`), throwing a `ConflictException` if violated.
    - Wrote comprehensive unit tests in `vehicles.service.spec.ts` covering successful creation with a driver, `NotFoundException` for invalid driver IDs, and `ConflictException` for drivers already on a trip.

### Fixed
- **API Vehicle Creation Validation Failure (400 Bad Request)**:
    - Fixed a bug where creating a vehicle from the mobile admin interface failed with a `400 Bad Request` validation error when `driverId` or `status` was supplied.
    - Updated `CreateVehicleDto` in `create-vehicle.dto.ts` to allow and validate `status` and `driverId` fields using `IsEnum` and `IsUUID` validation decorators.

## [2026-05-17] - Mobile Live Tracking & Auth Refinements
### Added
- **Mobile Fleet Tracking Refinements (`fleet-driver`)**:
    - **Tailwind CSS UI Migration**: Migrated legacy Stylesheets in `admin-tracking.tsx` to utility-first Tailwind classes, optimizing headers, cards, overlay panels, search bar, and map controls for pure Glassmorphism.
    - **Automated Vehicle Following**: Implemented dynamic map camera centering. The camera automatically pans and tracks selected vehicles in real-time as coordinates update.
    - **Unified Search Result Dropdown**: Added interactive vehicle list searching by license plate and driver name, allowing direct marker focus on select.
    - **Standard/Satellite/Hybrid Map View**: Added dynamic layer toggle control buttons for standard, satellite, and hybrid layers on mobile maps.
    - **Tracking Map Performance Optimization**: Throttled automated map camera following to 1.5s intervals using a ref timestamp and added `React.memo` caching to `FleetMarker` to minimize React Native re-rendering stress during rapid WebSocket location updates.
    - **react-native-maps CPU Reduction**: Implemented transient `tracksViewChanges` state control (enabling it for 300ms only when coords/heading/status updates and then resetting it to false) to bypass expensive native map redraw loops.
    - **Marker Icon Visual Correction**: Resolved native MapView custom icon cutoffs and boundary clipping by introducing outer container padding, forcing `overflow: 'visible'`, and configuring a precise base anchor (`anchor={{ x: 0.5, y: 1.0 }}`) to align markers correctly with coordinates.

### Fixed
- **Mobile Keyboard Auto-Capitalization Failure**:
    - Fixed credentials entry crash where default mobile keyboards capitalized input email addresses, causing hidden case-mismatch auth failures. Enforced `autoCapitalize="none"` and `autoCorrect={false}` client-side and transformed incoming fields using `.trim().toLowerCase()` in the hooks layer.

## [2026-05-17] - Navigation Stabilization & Layout Remount
### Added
- **Multi-Role Nav Stabilization (`fleet-driver`)**:
    - **Dynamic Tabs Remounting**: Added `key={user.id}` to `<Tabs>` component in `app/(tabs)/_layout.tsx` to force full React Navigation cache reset on role switch, preventing UI tab leak.
    - **Flash Guard**: Added early return on `!isAuthenticated || !user` to block rendering stale/empty layout before store hydrates.
    - **Tab Layout Clean Up**: Removed redundant `<Tabs.Screen options={{ href: null }}` configurations at bottom, replaced with dynamic `href` properties.
- **Mapbox Config Template (`fleet-driver`)**:
    - Added `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` entry to `fleet-driver/.env.example`.

### Fixed
- **Expo Router Layout Routing Collision**:
    - Resolved `ERROR [Error: Cannot use href and tabBarButton together.]` runtime crash by using dynamic `href: isAdmin ? undefined : null` instead of dynamic component blocks or combining custom button structures.

## [2026-05-16] - Mobile Admin Mirror Phase 04 (Order Management)
### Added
- **Mobile Admin Mirror Phase 04 (Order Management CRUD)**:
    - **Order List Screen**: Developed `admin-orders.tsx` featuring real-time status filtering (Pending, Ongoing, Completed, Cancelled), search bar, and interactive order cards.
    - **Create Order Workflow**: Implemented `app/admin/orders/create.tsx` for manual order entry.
    - **MapPicker Component**: Built a reusable geospatial picker using a center-pin interaction pattern for high-precision pickup/delivery coordinate selection.
    - **OrderForm Component**: Integrated form validation, address inputs, weight fields, and the MapPicker for a seamless administrative experience.
    - **Zustand Order Store**: Created `useOrderStore` to manage CRUD operations, pagination, and backend API synchronization for orders.

## [2026-05-16] - Mobile Admin Mirror Phase 02 & 03
### Added
- **Mobile Admin Mirror Phase 02 (Navigation & Architecture)**:
    - **Multi-Role Root Layout**: Implemented dynamic role-based routing in `app/_layout.tsx` to switch between `(driver_tabs)` and `(admin_tabs)`.
    - **Admin Tab Bar**: Created a glassmorphic bottom navigation bar for administrators with screens for Dashboard, Tracking, Orders, and Management.
    - **Session Persistence**: Enhanced `useAuthStore` to handle role-specific initial routes and deep linking.
- **Mobile Admin Mirror Phase 03 (Live Fleet Tracking Map)**:
    - **Interactive Map Screen**: Developed `admin-tracking.tsx` using `react-native-maps` with support for Standard/Satellite/Hybrid layers.
    - **Real-time State Sync**: Integrated `useFleetTrackingStore` (Zustand) with Socket.io to receive and render live GPS telemetry.
    - **Fleet Markers**: Created status-aware markers with vehicle heading rotation, license plate labels, and smooth movement animations.
    - **Vehicle Detail Cards**: Implemented glassmorphic overlay cards showing real-time driver info, speed, and status.
    - **Map Controls**: Added "Fit All" auto-zoom and layer toggle controls.

## [2026-05-16] - Mobile Admin Mirror Planning
### Added
- **Project Planning**:
    - **Mobile Admin Mirror**: Initiated the project to mirror `fleet-admin` functionalities into the `fleet-driver` mobile app.
    - **Phased Roadmap**: Created a 7-phase implementation plan covering Navigation, Dashboard, Fleet Tracking, Order CRUD, Management, Dispatching, and Analytics.
    - **Navigation Architecture**: Designed a multi-role navigation system (`(driver_tabs)` vs `(admin_tabs)`) for the mobile application.
- **Documentation**:
    - Created detailed phase documents in `plans/240516-mobile-admin-mirror/`.
    - Updated project knowledge base (`brain.json`) and session tracking (`session.json`).

## [2026-05-16] - Data Seeding & Profile Information Enhancement
### Added
- **Backend (API)**:
    - **Seed Script (`src/database/seeds/seed.ts`)**: Updated to ensure `fullName` and `phone` are correctly populated for Admin, Dispatcher, and Driver accounts. Added `upsert` logic to update existing users instead of skipping them.
    - **Hotfix**: Executed SQL migration to fill missing `fullName` and `phone` data in the `users` table for existing driver accounts.
- **Mobile (Driver App)**:
    - **Profile Screen**: Replaced placeholder "Driver Name" with the driver's actual `fullName` from the user profile.
    - **Profile UI**: Updated `AccountInfo` and `ProfileHeader` to display vehicle information (vehicle name + license plate) instead of placeholder text.
    - **Data Flow**: Verified and optimized `useAuthStore` to ensure user profile data (including `fullName`) is correctly fetched and stored upon login.

## [2026-05-16] - Geofencing Enforcement & Backend Audit Trail
### Added
- **Mobile (Driver App)**:
    - **Geofencing Enforcement**: Implemented a mandatory 200m proximity check for "Pick Up" and "Submit Proof" actions.
    - **useGeofencing Hook**: Centralized hook for managing location permissions, high-accuracy GPS state, and distance calculations.
    - **UI Feedback**: Added loading indicators and error handling for location-based actions in `OrderCard`.
- **Backend (API)**:
    - **Audit Columns**: Added `pickupActualLocation` and `deliveryActualLocation` geography columns to the `Order` entity.
    - **Status API Updates**: Enhanced the status update endpoint to capture and persist actual action coordinates from the driver app.

## [2026-05-15] - Massive Fleet Admin Refactoring & Modularization
### Changed
- **Frontend (Admin Dashboard)**:
    - **Module Refactoring**: Completed a massive refactor of `Tracking`, `Dispatch`, `Vehicles`, `Drivers`, `Orders`, and `Dashboard` modules to improve maintainability and performance.
    - **Hook-based Logic**: Introduced custom hooks (`useTracking`, `useDispatchLogic`) to encapsulate business logic, socket listeners, and state management, keeping UI components clean.
    - **Component Modularization**: Extracted UI elements into local `components/` subfolders within each module directory (e.g., `VehicleDispatchCard`, `OrderTable`, `DriverFilters`).
    - **Type Standardization**: Unified coordinate naming conventions across the project, standardizing on `{ lat, lng }` to prevent runtime and build-time errors.
    - **Build Stability**: Resolved all TypeScript errors and ensured a 100% successful production build (`next build`).
    - **Profile Page**: Implemented dirty checking to disable the "Save Changes" button when no modifications are detected.

### Added
- **Frontend (Admin Dashboard)**:
    - **useTracking Hook**: Manages WebSocket connections and real-time vehicle movement logic.
    - **useDispatchLogic Hook**: Handles complex order clustering, vehicle filtering, and assignment states.
    - **New Components**: Created over 30 new modular components to replace large, monolithic page files.
- **Backend (API)**:
    - **Data Mapping**: Included `fullName` as a top-level field in `Vehicle` and `Driver` responses by mapping from the related `User` entity.

## [2026-05-14] - UI Standardization & Premium Components
### Added
- **Frontend (Admin Dashboard)**:
    - **Premium Select Component**: Implemented a custom, glassmorphic dropdown component with smooth animations (`framer-motion` style feel), icon support, and improved UX focus states.
    - **UI Consistency**: Standardized filter bars across `Vehicles`, `Orders`, and `Drivers` pages using the new `Select` component.
    - **Iconography**: Integrated `lucide-react` icons for status and type indicators in dropdown menus.

### Added (Earlier today)
- **Frontend (Admin Dashboard)**:
    - **Enhanced Tracking UI**: Refined vehicle cards with modern glassmorphism design and real-time "ping" status animations for active transport.

    - **Responsive Map Control**: Optimized map container height (3/4 h-screen) and implemented automatic `map.resize()` on selection events to ensure visual stability.
- **Backend (API)**:
    - **Operational State Mapping**: Synchronized `statusMap` to include `transporting`, `off_duty`, and `completed` states, improving tracking accuracy.

### Fixed
- **Backend (API)**:
    - Fixed broken unit tests in `ViolationDetectorService`, `RolesGuard`, and `DriversService` caused by type mismatches (timestamp), missing enum members (`UserRole.OPERATOR`), and DTO class-to-object compatibility.
- **Frontend (Admin Dashboard)**:
    - Resolved build parser errors in `tracking/page.tsx` caused by redundant text tokens.
    - Fixed layout shifting issues in the tracking sidebar when expanding vehicle details.

## [2026-05-13] - Driver Status Synchronization & API Hardening
### Added
- **Backend (API)**:
    - **Entity Relations**: Thiết lập quan hệ `@OneToOne` hai chiều giữa `User` và `Driver` entities.
    - **Auth Service**: Cập nhật `login`, `refreshTokens` và `validateUser` để tự động nạp (eager load) dữ liệu `driver`.
    - **Payload Expansion**: Trả về đầy đủ đối tượng `driver` trong phản hồi đăng nhập/refresh để đồng bộ trạng thái UI ngay lập tức.

### Fixed
- **Backend (API)**:
    - Khắc phục lỗi **500 Internal Server Error** khi truy cập hoặc cập nhật trạng thái tài xế do thiếu mapping quan hệ trong database.
- **Frontend (Driver App)**:
    - Xác định và hướng dẫn vị trí nút **Duty Status** (Switch) trong màn hình Profile.
    - Xử lý vấn đề cache bundle/version mismatch khiến UI mới không hiển thị trên thiết bị.

## [2026-05-13] - Vehicle Management & Driver Assignment Optimization
### Added
- **Backend (API)**:
    - **Safety Checks**: Bổ sung kiểm tra trạng thái trước khi thay đổi/gỡ tài xế. Chặn thao tác nếu xe đang `DELIVERING` hoặc tài xế đang `ON_TRIP`.
    - **VehiclesModule**: Tích hợp `Driver` entity để hỗ trợ kiểm tra trạng thái tài xế trực tiếp trong `VehiclesService`.
- **Frontend (Admin Dashboard)**:
    - **User Feedback**: Tích hợp `sonner` toast để hiển thị thông báo lỗi chi tiết khi vi phạm các ràng buộc nghiệp vụ (ví dụ: "Cannot unassign driver while vehicle is delivering").

### Fixed
- **Frontend (Admin Dashboard)**:
    - **UI Interaction**: Khắc phục lỗi lồng Modal (Overlap) khi nhấn "Change Driver" hoặc "Unassign". Sử dụng `stopPropagation()` để ngăn chặn sự kiện mở Modal chi tiết xe.
    - **Data Persistence**: Sửa lỗi không gỡ được tài xế bằng cách gửi giá trị `null` (thay vì `undefined`) cho `driverId`.
- **Type Safety**:
    - Đồng bộ hóa kiểu dữ liệu `nullable` cho `driver` và `driverId` trên cả Backend (TypeORM Entity) và Frontend (TypeScript Interface), đảm bảo quá trình build thành công 100%.

## [2026-05-13] - Socket Connection Stabilization & Robust Authentication
### Fixed
- **Core (Infrastructure)**:
    - **WebSocket Gateway (`TrackingGateway`)**: Cập nhật cơ chế `extractToken` để tự động bóc tách tiền tố `Bearer ` nếu có, tăng tính ổn định cho quá trình Handshake.
    - **Driver App (Socket Client)**: Đồng bộ hóa cấu hình để gửi token "sạch" (raw token) về server, tránh lỗi mismatch prefix gây ngắt kết nối.
    - **Connection Reliability**: Tăng `connectionTimeout` lên **60s** cho Driver App để hỗ trợ tốt hơn trên môi trường mạng 4G/LTE không ổn định.

### Changed
- Cải thiện thông báo lỗi kết nối trong Driver App, giúp phân biệt rõ lỗi Timeout và lỗi Xác thực (Authentication).

## [2026-05-12] - Driver App Web Login & CORS Hardening
### Added
- **Mobile (Driver App)**:
    - Bổ sung **Debug Logs** chi tiết vào màn hình Login để theo dõi luồng API_URL, Platform, Response status và Data payload.
    - Cải thiện thông báo lỗi người dùng: Phân tách rõ lỗi nghiệp vụ (Role mismatch) và lỗi hệ thống (Connection refused).

### Changed
- **Backend (API)**:
    - Mở rộng cấu hình **CORS**: Cho phép các origin mặc định của Expo Web (`http://localhost:8081`, `http://localhost:19006`) bên cạnh `localhost:3000`.
    - Cập nhật `.env` và `main.ts` để đồng bộ cấu hình CORS mới, hỗ trợ quá trình phát triển đa nền tảng (Web/Mobile).

### Fixed
- **Mobile (Driver App)**: 
    - Khắc phục tiềm tàng lỗi đăng nhập trên bản Web do sai lệch cấu hình CORS hoặc thiếu thông tin môi trường.

## [2026-05-12] - Performance Stability & Driver KPI Analytics
### Added
- **Frontend (Admin Dashboard)**:
    - **Driver KPI Detail Page**: 
        - Hoàn thiện trang chi tiết chỉ số hiệu suất tài xế với các biểu đồ Recharts (Safety, Fuel, Efficiency).
        - Hiển thị đầy đủ thông tin liên hệ, rating và trạng thái hoạt động.
        - Tích hợp dữ liệu thực tế từ backend, hỗ trợ giá trị mặc định (Score 100) khi chưa có dữ liệu.
- **Backend (API)**:
    - **Driver KPI Integration**:
        - Đăng ký `DriverKpi` entity vào `DriversModule`.
        - Cập nhật `DriversService.getKpi` để truy vấn dữ liệu thực tế từ database thay vì dùng dữ liệu giả.

### Fixed
- **Infinite Loop Stabilization**:
    - Khắc phục lỗi vòng lặp re-fetch vô tận trong `useAlerts` và `useTrips` bằng cách chuyển Dependency Array từ dạng object sang các giá trị nguyên thủy (primitive values).
    - Giảm thiểu số lượng request API dư thừa, giúp backend và frontend chạy mượt mà hơn.
- **Frontend Crash Fixes**:
    - Sửa lỗi `TypeError: toFixed is not a function` khi dữ liệu KPI chưa kịp tải hoặc bị null.
    - Xử lý triệt để lỗi 404 khi gọi `/api/alerts` do sai cấu trúc query params.
- **UI & Layout**:
    - Đồng bộ hóa lại padding và margin cho Dashboard admin sau khi di chuyển sang Tailwind v4.

## [2026-05-12] - UI Modernization & Tailwind CSS v4 Migration
### Added
- **Frontend (Admin Dashboard)**:
    - **Sidebar Navigation Redesign**: Cập nhật giao diện Sidebar theo chuẩn Figma (Fixed width 260px, màu nền #1A1D27, hiệu ứng active với accent border #6366F1).
    - **Address Search Integration**: Tích hợp tính năng tìm kiếm địa chỉ (Mapbox Geocoding) trong module Dispatch, hỗ trợ tự động bay đến vị trí (Fly-to) và cập nhật tọa độ.

### Changed
- **Tailwind CSS v4 Migration**:
    - Di chuyển toàn bộ giao diện **Dispatch Module** (MapPanel, VehiclesSidebar, OrdersSidebar) sang Tailwind CSS v4.
    - Sử dụng các utility classes chuẩn dự án (`glass`, `bg-background`, `text-foreground`) và hệ thống spacing tokens (xs, sm, md).
    - Loại bỏ các mã màu hardcoded và pixel values cũ, thay thế bằng design system tokens.
    - Đồng bộ hóa hiệu ứng Blur và Transparency cho các floating panels thông qua utility `glass`.

### Fixed
- **Layout & Responsiveness**:
    - Cải thiện cơ chế đóng/mở Sidebar, đảm bảo nội dung chính (body) co giãn chính xác.
    - Chuẩn hóa thứ tự hiển thị (z-index) cho các thành phần điều khiển trên bản đồ.

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
