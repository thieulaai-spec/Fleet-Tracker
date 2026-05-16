# Changelog

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
- **Improved**: Added loading indicators during location verification to enhance UX.
