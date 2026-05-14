# Changelog

All notable changes to this project will be documented in this file.

## [2026-05-14] - Profile & Security Refinement
### Added
- **Profile Settings**: Implemented modern profile page with read-only email restriction for enhanced security.
- **Security**: Finalized `ChangePasswordModal` with full-screen overlay and smooth animations.
- **UX**: Added glassmorphic design and `animate-fade-in` transitions to profile module.

## [2026-05-14] - UI Refinement
### Refactored
- `DatePicker`: Implemented dynamic viewport-aware positioning.
- `DatePicker`: Added horizontal overflow protection and automatic vertical flipping (above/below trigger).
- `DatePicker`: Fixed state synchronization bugs and added window resize/scroll listeners for stable portal placement.

## [2026-05-14] - Reports UX & Select Fixes
### Fixed
- **Reports**: Implemented click-outside-to-close for `DateRangeFilter` dropdown to improve UI consistency.
- **Reports**: Refined dropdown positioning and layering to ensure they are not obscured by the sidebar.
- **Reports**: Standardized event propagation handling to ensure clean closure when interacting with nested dropdown elements.
- **Select Component**: Standardized `useRef` + `useEffect` pattern for reliable dropdown closure across the app.
- **Build**: Fixed critical build-time errors in `DateRangeFilter.tsx` caused by missing imports and state regressions.

## [2026-05-14] - Maps & Dispatch
### Fixed
- **Dispatch UI**: Resolved search bar overlap issue in `DispatchOrdersSidebar` and `DispatchVehiclesSidebar` by moving search inputs and status banners out of the scrollable container.
- **Dispatch Logic**: Fixed the "Available Fleet" synchronization bug where assigned vehicles remained in the list. Added React Query cache invalidation (`vehicles`) on successful order assignment.
### Added
- **Map Enhancements**: Implemented unified map controls (2D/3D toggle, Satellite/Streets style, and Traffic layer visibility) for both Dispatch and Tracking modules.
- **Mapbox Integration**: Added support for `mapbox-traffic-v1` vector tiles with dynamic congestion coloring (Low, Moderate, Heavy, Severe).

## [2026-05-12]
### Fixed
- **UI Styling**: Resolved critical layout issues where padding and margins were not being applied in Tailwind CSS v4.
- **Tailwind v4 Workaround**: Manually defined `@utility` classes for all named spacing tokens (`xs` to `3xl`) to bypass automatic generation conflicts with breakpoint names.
- **CSS Reset**: Removed redundant and aggressive `*` selector reset in `globals.css` that interfered with utility class specificity.

### Optimized
- **Design Tokens**: Standardized spacing across `Orders` and `Drivers` pages using the new design system tokens.
- **Sidebar & Header**: Refined padding and height calculations to ensure consistent layout across all screen sizes.

## [2026-05-11]
### Added
- **Address Search**: Integrated Mapbox Geocoding API into `MapBox` component for easy location lookup.
- **Smart Fly-to**: Automatic map centering and smooth animation when searching or selecting vehicles.
- **Map Aesthetics**: Updated tracking and replay maps to use `streets-v12` style for consistent, rich visuals.

### Fixed
- **Dispatch Search**: Fixed the non-functional dummy search bar on the Dispatch screen.
- **Tracking View**: Fixed vehicle icons and popups potentially being cut off by adding auto-focus logic.
- **Syntax Fix**: Resolved a critical build-breaking syntax error in `RouteReplayMap.tsx`.

### Optimized
- `useDispatch` hook now fetches `available` vehicles directly from the server to ensure data consistency.
- `useVehicles` hook updated to support server-side parameters.

### Fixed
- UI: Scrollbar overflow in Dispatch sidebars by adding `min-height: 0` to flex content.
- Data Consistency: Fixed discrepancy between total vehicle count in `/vehicles` and available count in `/dispatch`.
- Stability: Reduced "Unauthorized" WebSocket disconnection issues.
- API: Fixed `HTTP 400` error when creating vehicles by stripping restricted fields (`status`, `driverId`) from POST payload.
- API: Fixed `HttpClient` parameter stringification bug (`undefined` becoming `"undefined"`).
- Validation: Fixed Zod schema to allow empty strings for `driverId` (Unassigned state).
- Debugging: Added detailed API error logging to `HttpClient.request`.

## [2026-05-10]
### Added
- Initial project structure for Fleet-Tracker Admin.
- Tailwind CSS v4 configuration.
- Basic dashboard layouts and mapping components.
