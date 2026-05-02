# Phase 06: Backend — Reports & Optimization

**Status:** ⬜ Pending
**Dependencies:** Phase 05 (Real-time GPS)
**Ước tính:** 4-5 ngày

---

## Objective

Implement KPI tài xế, báo cáo hiệu suất đội xe, tối ưu tuyến đường (Mapbox Directions API), và export báo cáo PDF/Excel.

## Implementation Steps

### 1. KPI Engine
- [ ] `ReportsModule` — module setup
- [ ] `KpiService`:
  - `calculateDriverKpi(driverId)`:
    ```typescript
    KPI = 100 - (violations * penalty_per_violation)
    // penalty: speed = 5, route = 8, stop = 3, incident = 10
    // KPI min = 0, max = 100

    completion_rate = completed_trips / total_trips * 100
    ```
  - `updateKpiOnTripComplete(tripId)`:
    - total_trips++
    - completed_trips++ (if delivered)
    - Recalculate kpi_score
  - `updateKpiOnViolation(driverId, violationType)`:
    - total_violations++
    - speed/route_violations++ (by type)
    - Recalculate kpi_score
  - `getDriverKpiSummary(driverId)` — KPI dashboard data
  - `getKpiLeaderboard()` — Top tài xế sorted by KPI

### 2. Fleet Performance Reports
- [ ] `ReportsService`:
  - `getFleetPerformance(dateRange)`:
    ```typescript
    {
      totalTrips: number;
      completedTrips: number;
      failedTrips: number;
      completionRate: number; // %
      totalDistanceKm: number;
      estimatedFuelCost: number; // = totalDistance * fuelRate
      averageTripDuration: number; // minutes
      totalAlerts: number;
      alertsByType: { speed, route, stop, incident };
    }
    ```
  - `getTripSummary(dateRange)` — Daily/weekly/monthly breakdown
  - `getFuelCostReport(dateRange)`:
    - Fuel rate per vehicle type (small: 8L/100km, medium: 12L, large: 16L)
    - Fuel price configurable (default 25000 VND/L)
  - `getVehicleUtilization()` — % thời gian xe hoạt động

### 3. Reports Controller
- [ ] `ReportsController`:
  - `GET /reports/fleet-performance` — query: from, to, period (day/week/month)
  - `GET /reports/driver-kpi` — query: from, to
  - `GET /reports/driver-kpi/:driverId` — KPI chi tiết 1 driver
  - `GET /reports/kpi-leaderboard` — Bảng xếp hạng
  - `GET /reports/fuel-cost` — query: from, to
  - `GET /reports/trip-summary` — query: from, to, group_by
  - `GET /reports/vehicle-utilization` — query: from, to
  - `GET /reports/export` — query: type (pdf/excel), report_name

### 4. Route Optimization
- [ ] `OptimizationModule` — module setup
- [ ] `RouteService`:
  - `getOptimalRoute(waypoints[])`:
    - Input: Array of { lat, lng } (pickup + delivery points)
    - Call Mapbox Directions API
    - Return: optimized route (GeoJSON LineString), distance, duration, ETA
  - `reRoute(tripId, currentLocation)`:
    - Tính lại route từ vị trí hiện tại đến điểm tiếp theo
    - Update trip.planned_route
- [ ] `OptimizationService`:
  - `estimateETA(tripId)`:
    - Dựa trên remaining distance + average speed
  - `calculateTripDistance(tripId)`:
    - Sum distance from gps_locations of trip
    ```sql
    SELECT SUM(ST_Distance(
      lag(location) OVER (ORDER BY recorded_at),
      location
    )) as total_distance
    FROM gps_locations
    WHERE trip_id = :tripId
    ```

### 5. Export Service
- [ ] `ExportService`:
  - `exportPdf(reportData, templateName)`:
    - Dùng `pdfkit` hoặc `puppeteer` để generate PDF
    - Template: Fleet report, Driver KPI report
  - `exportExcel(reportData, sheetName)`:
    - Dùng `exceljs` package
    - Columns auto-sized, headers styled
  - Return: Buffer → download URL

## Files to Create/Modify

```
fleet-api/src/
├── reports/
│   ├── reports.module.ts
│   ├── reports.controller.ts
│   ├── reports.service.ts
│   ├── kpi.service.ts
│   ├── export.service.ts
│   └── dto/
│       ├── report-query.dto.ts
│       ├── fleet-performance.dto.ts
│       ├── driver-kpi.dto.ts
│       └── fuel-cost.dto.ts
├── optimization/
│   ├── optimization.module.ts
│   ├── route.service.ts
│   └── optimization.service.ts
```

## Test Criteria
- [ ] KPI: tạo trip + complete → KPI updated chính xác
- [ ] KPI: violation → score giảm đúng số điểm
- [ ] Leaderboard: sorted by kpi_score DESC
- [ ] Fleet performance: correct counts, distances, costs
- [ ] Fuel cost: calculation correct (distance × rate × price)
- [ ] Route optimization: Mapbox API → valid GeoJSON route
- [ ] Export PDF: downloadable, formatted correctly
- [ ] Export Excel: columns correct, data accurate

---

**Next Phase:** [Phase 07 — Admin Dashboard Core UI](./phase-07-admin-dashboard.md)
