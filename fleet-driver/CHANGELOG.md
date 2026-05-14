# Changelog

## [2026-05-13]
### Fixed
- Socket.io connection rejection due to "Bearer " prefix in token auth.
- Tracking Gateway token extraction logic to be more robust.
- Driver app socket configuration to send raw token.

### Improved
- Increased socket connection timeout to 60s for better stability on Render.com free tier and mobile networks.
