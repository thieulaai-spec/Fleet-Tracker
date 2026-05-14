# Changelog

All notable changes to this project will be documented in this file.

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
