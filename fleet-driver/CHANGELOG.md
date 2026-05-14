# Changelog

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

