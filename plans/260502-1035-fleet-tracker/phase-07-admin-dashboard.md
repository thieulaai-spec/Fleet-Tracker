# Phase 07: Admin Dashboard — Core UI

**Status:** ✅ Completed
**Dependencies:** Phase 03 (Backend Core APIs)
**Ước tính:** 6-8 ngày

---

## Objective

Xây dựng Admin Dashboard: layout, design system, CRUD pages (vehicles/drivers/orders), dispatch panel. Dark theme, modern UI.

## Implementation Steps

### 1. Design System & Layout
- [x] **Task 7.1: Init Admin Project & Design System**
    - [x] Khởi tạo Next.js 14 (App Router) - *Đã có sẵn*
    - [x] Thiết lập `globals.css` với các Design Tokens (Colors, Typography)
    - [x] Cài đặt các thư viện cần thiết (Lucide, Mapbox, Recharts, TanStack Query) - *Đã có trong package.json*
- [x] CSS design tokens (dark theme): bg, surface, primary, success, warning, danger
- [x] `DashboardLayout`: Sidebar (collapsible) + Header + Content
- [x] Shared UI: DataTable, StatCard, Badge, Modal, SearchInput, ConfirmDialog, LoadingSpinner

### 2. Dashboard Overview (/)
- [x] StatCards: Total Vehicles, Active Drivers, Pending Orders, Today Revenue
- [x] Recent Orders list (với trạng thái Badge)
- [x] Live Alerts feed (Speed, Route, Stop alerts)

### 3. Vehicle Management (/vehicles)
- [x] DataTable hiển thị danh sách xe (Plate, Type, Status, Driver)
- [x] Bộ lọc Status & Search bar
- [x] UI cho Add/Edit Vehicle Modal

### 4. Driver Management (/drivers)
- [x] DataTable hiển thị danh sách tài xế (Name, Avatar, Status, Rating, Trips)
- [x] Bộ lọc & Search
- [x] View chi tiết tài xế (Mock UI)

### 5. Order Management (/orders)
- [x] DataTable danh sách đơn hàng (Order ID, Route Points, Weight, Status, Created At)
- [x] UI cho Create Order Form
- [x] Cluster view: group nearby orders (Mocked in Dispatch)

### 6. Dispatch Control Center (/dispatch)
- [x] Giao diện 3 cột: Đơn hàng chờ (Trái) | Bản đồ (Giữa) | Xe sẵn sàng (Phải)
- [x] Tích hợp Mapbox (Mock container & Pins)
- [x] Action "Assign Order" để gán đơn cho xe

### 7. API Integration
- [x] API client (lib/api.ts): JWT interceptor, error handling
- [x] React Query hooks: useVehicles, useDrivers, useOrders, useDispatch
- [x] Socket.io client (lib/socket.ts): auto-connect, event listeners

## Test Criteria
- [x] Login → dashboard with live data
- [x] All CRUD operations working
- [x] Dispatch: suggest + assign flow
- [x] Dark theme consistent
- [x] Responsive on 1024px+

---

**Next Phase:** [Phase 08 — Admin Maps & Monitoring](./phase-08-admin-maps.md)
