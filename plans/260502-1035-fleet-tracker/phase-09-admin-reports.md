# Phase 09: Admin Dashboard — Reports & Analytics

**Status:** ⬜ Pending
**Dependencies:** Phase 06 (Backend Reports), Phase 07 (Admin Core UI)
**Ước tính:** 3-4 ngày

---

## Objective

Xây dựng trang báo cáo & phân tích: fleet performance dashboard, KPI leaderboard, fuel cost analysis, charts (recharts), export PDF/Excel.

## Implementation Steps

### 1. Fleet Performance Dashboard (/reports)
- [ ] Date range picker (today, 7 days, 30 days, custom)
- [ ] Stat cards: Total trips, Completion rate, Total distance, Fuel cost
- [ ] Charts (recharts):
  - AreaChart: Trips per day/week
  - BarChart: Trips by vehicle
  - PieChart: Trip status distribution
  - LineChart: Fleet performance trend

### 2. KPI Leaderboard (/reports/kpi)
- [ ] Ranking table: # | Driver | Score | Trips | Completion % | Violations
- [ ] KPI score gauge chart per driver
- [ ] Color-coded rows: green (>80), yellow (50-80), red (<50)
- [ ] Click driver → link to driver KPI detail page

### 3. Fuel Cost Analysis (/reports/fuel)
- [ ] Cost breakdown by vehicle type (small/medium/large)
- [ ] Cost per trip average
- [ ] Cost trend over time (LineChart)
- [ ] Vehicle-level fuel cost table

### 4. Trip Summary (/reports/trips)
- [ ] Filterable trip table: date range, vehicle, driver, status
- [ ] Trip detail modal: route map, orders, timeline, violations
- [ ] Summary stats at top

### 5. Export Functionality
- [ ] Export buttons on each report page
- [ ] PDF: formatted report with charts (server-side render)
- [ ] Excel: raw data table download
- [ ] Loading state while generating

## Test Criteria
- [ ] All charts render with real data
- [ ] Date range filter updates all charts
- [ ] KPI leaderboard sorted correctly
- [ ] Export PDF/Excel download successfully
- [ ] Responsive layout for report pages

---

**Next Phase:** [Phase 10 — Driver Mobile App](./phase-10-driver-app.md)
