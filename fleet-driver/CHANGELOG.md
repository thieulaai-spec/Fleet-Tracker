# Changelog

## [2026-05-17] - Live Tracking & Coordinate Parsing Fixes
### Fixed
- **Admin Fleet Tracking**: Fixed blank map screen by correctly unpacking the API response structure `{ statusCode, message, data }` in `useFleetTrackingStore`.
- **PostGIS Coordinate Parsing**: Built a custom high-precision hexadecimal decoder for WKB (Well-Known Binary) PostGIS Geography formats in `geo.ts` to decode hex-encoded coordinates without external binary libraries.
- **Unit Test Coverage**: Added comprehensive test suite `geo.test.ts` validating standard GeoJSON, WKT, plain objects, and binary hex-encoded WKB PostGIS inputs.

## [2026-05-15] - Driver App Polish & UI Standardization
### Refactored
- Unified all component imports (Themed, StyledText, ExternalLink) to `@/components/ui`.
- Tidied up codebase by removing deprecated component files (`Themed.tsx`, `StyledText.tsx`, etc.).
- Modularized component structure: moved components to `components/map`, `components/trip`, `components/ui`, etc.

### Fixed
- Prop name mismatches in `MapControls`, `MissionDashboard`, and `MissionPanel`.
- Login screen TypeScript error by integrating `toggleForgotMode` from `useAuthFlow`.
- Broken import paths in `app/+not-found.tsx`.
- Safety checks in `MissionPanel` for progress calculation and optional callbacks.

### Improved
- `TripCard` now features `Accept` and `Pass` action buttons for pending trips with loading states.
- Centralized status color mapping (Pending: Orange, Accepted: Indigo, In-Progress: Blue-Indigo, Completed: Green).
- Full repository type safety verified with `tsc --noEmit`.

## [2026-05-13]
### Fixed
- Socket.io connection rejection due to "Bearer " prefix in token auth.
- Tracking Gateway token extraction logic to be more robust.
- Driver app socket configuration to send raw token.

### Improved
- Increased socket connection timeout to 60s for better stability on Render.com free tier and mobile networks.

## [2026-05-13] - Navigation Optimization
### Added
- Dynamic navigation target switching (Pickup vs Delivery) based on order status.
- Support for `pickupAddress` in Trip Store and Order interface.

### Fixed
- TypeScript errors in `index.tsx` (navigation -> router) and `map.tsx` (currentOrder undefined check).
- UI padding adjustment for device camera notch in Mission Intel section.
- Trip card alignment and "Target Location Pending" fallback text.

### Improved
- Optimized Mission Control navigation button to automatically lead to the correct destination.

## [2026-05-15] - Maps & Profile Refinement
### Added
- "Zoom to Destination" button in Map Controls.
- Dynamic route distance calculation (Pickup/Delivery point based on trip status).

### Fixed
- **Background location permissions**: Corrected Android 10+ flow by requesting Foreground before Background permissions.
- **Profile Switch Accessibility**: Removed blocking decorative glows and improved `SettingsItem` hit area.
- **Duty Status Toggle**: Fixed logic to allow user feedback even when disabled, and ensured row remains clickable.
- **Map Viewport**: Ensured `MapView` fills the container properly with `absoluteFillObject`.

### Improved
- Better UI positioning for Map Controls (centered vertically/horizontally as requested).
- Enhanced debug logging for `Duty Status` transitions.


## [2026-05-16] - Navigation & Trip Flow Optimization
### Added
- **2D Navigation Mode**: Map now rotates based on vehicle heading (`heading-up` view).
- **Auto-Follow Mode**: Integrated with navigation mode to keep driver centered.
- **Dynamic Route Refresh**: throttled route data fetching (1s) to balance performance and battery.

### Fixed
- **Deploy Trip Logic**: Corrected premature destination switching. The map now maintains the Pickup Point destination after "Deploy Trip" until the order is explicitly marked as "Picked Up".
- **Misleading Alert**: Updated "Deploy Trip" confirmation message to be about starting the mission rather than finishing pickup.

### Improved
- **Map Responsiveness**: Reduced map animation duration to 600ms for smoother tracking.
- **UI Feedback**: Map controls now highlight when Follow or Navigation modes are active.

### Geofencing & Location Audit
- **Added**: Enforced 200m geofencing for "Pick Up" and "Submit Proof" actions.
- **Added**: `useGeofencing` hook for centralized, high-accuracy location checks.
- **Refactored**: Moved inline location logic from `OrderCard` and `signature` to shared hook.
## [2026-05-16] - Reporting & Analytics (Phase 07)
### Added
- **Fleet KPI Dashboard**: Visualization of fleet performance metrics.
- **Utilization Tracking**: Detailed reports on vehicle and driver efficiency.
- **Fuel Monitoring**: Analytics for fuel consumption and cost tracking.
- **Trip History & Export**: Comprehensive trip logs with PDF/Excel export functionality.
- **Reporting Store**: Centralized state management for complex analytical data using `useReportStore`.

### Fixed
- **Test Stability**: Fixed import path in `StyledText-test.js` ensuring clean test runs.
- **Build Integrity**: Verified complete build cycle with `npx expo export`.

### Improved
- **Type Safety**: Ensured 100% TypeScript coverage for the reporting module.
- **UI/UX**: Integrated `react-native-chart-kit` with the Tactical Admin theme.

