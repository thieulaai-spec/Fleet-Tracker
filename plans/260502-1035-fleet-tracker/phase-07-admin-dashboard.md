# Phase 07: Admin Dashboard — Core UI

**Status:** ⬜ Pending
**Dependencies:** Phase 03 (Backend Core APIs)
**Ước tính:** 6-8 ngày

---

## Objective

Xây dựng Admin Dashboard: layout, design system, CRUD pages (vehicles/drivers/orders), dispatch panel. Dark theme, modern UI.

## Implementation Steps

### 1. Design System & Layout
- [ ] CSS design tokens (dark theme): bg, surface, primary, success, warning, danger
- [ ] `DashboardLayout`: Sidebar (collapsible) + Header + Content
- [ ] Shared UI: DataTable, StatCard, Badge, Modal, SearchInput, ConfirmDialog, LoadingSpinner

### 2. Dashboard Overview (/)
- [ ] Stat cards: Tổng xe, Xe đang chạy, Đơn hôm nay, Chuyến hoàn thành
- [ ] Mini chart: Chuyến theo tuần (recharts)
- [ ] Active trips + Recent alerts + Top KPI drivers

### 3. Vehicle Management (/vehicles)
- [ ] Vehicle List: DataTable + filter (status, type) + search (plate) + pagination
- [ ] Vehicle Form (Modal): plate_number, type, capacity, driver, image upload
- [ ] Actions: View, Edit, Delete (confirm)

### 4. Driver Management (/drivers)
- [ ] Driver List: DataTable + filter (status) + search (name, phone) + KPI badge
- [ ] Driver Form (Modal): full_name, phone, email, password, license
- [ ] Driver KPI Detail (/drivers/:id/kpi): KPI gauge, stats, violations, trip history

### 5. Order Management (/orders)
- [ ] Order List: DataTable + filter (status, date range)
- [ ] Order Form: pickup/delivery address + mini map geocoding + weight

### 6. Dispatch Panel (/dispatch)
- [ ] Split layout: pending orders (left) + available vehicles (right)
- [ ] Auto-match: select order → suggest top 5 vehicles → assign
- [ ] Cluster view: group nearby orders

### 7. API Integration
- [ ] API client (lib/api.ts): JWT interceptor, error handling
- [ ] React Query hooks: useVehicles, useDrivers, useOrders, useDispatch
- [ ] Socket.io client (lib/socket.ts): auto-connect, event listeners

## Test Criteria
- [ ] Login → dashboard with live data
- [ ] All CRUD operations working
- [ ] Dispatch: suggest + assign flow
- [ ] Dark theme consistent
- [ ] Responsive on 1024px+

---

**Next Phase:** [Phase 08 — Admin Maps & Monitoring](./phase-08-admin-maps.md)
