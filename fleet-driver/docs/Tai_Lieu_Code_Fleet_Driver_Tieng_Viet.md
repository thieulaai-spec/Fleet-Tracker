# T?i li?u code Fleet Driver App

T?i li?u n?y vi?t b?ng ti?ng Vi?t c? d?u, d?nh cho ng??i ch?a bi?t code. M?c ti?u l? gi?p b?n hi?u to?n b? app: m?i kh?i l?m g?, c? nh?ng h?m/action/component n?o, v? c?c kh?i n?i v?i nhau ra sao.

## C?ch ??c t?i li?u n?y

1. ??c ph?n t?ng quan ?? hi?u app d?ng cho ai.
2. ??c ph?n ki?n tr?c ?? hi?u d? li?u ?i t? m?n h?nh ??n server nh? th? n?o.
3. ??c ph?n t?ng kh?i ?? bi?t file n?o l?m nhi?m v? g?.
4. Khi g?p m?t file l?, tra ph? l?c b?ng file ? cu?i t?i li?u.

## 1. App n?y l? g??

??y l? app Expo React Native cho h? th?ng qu?n l? ??i xe v? giao h?ng. App c? hai nh?m ng??i d?ng ch?nh:

- **Driver / t?i x?**: nh?n chuy?n, xem b?n ??, l?y h?ng, giao h?ng, g?i b?ng ch?ng, g?i SOS.
- **Admin / ?i?u ph?i**: xem dashboard, ?i?u ph?i ??n, theo d?i xe realtime, qu?n l? t?i x?/xe/??n h?ng, xem b?o c?o.

N?i ??n gi?n: t?i x? d?ng app ?? ch?y chuy?n; admin d?ng app ?? ?i?u h?nh ??i xe.

## 2. B?c tranh t?ng quan c?c kh?i

| Kh?i | S? file | S? d?ng | Vai tr? |
|---|---:|---:|---|
| `__tests__/` | 3 | 176 | Test t? ??ng |
| `app/` | 34 | 5746 | M?n h?nh v? ??nh tuy?n |
| `components/` | 111 | 10425 | C?c m?nh giao di?n t?i s? d?ng |
| `hooks/` | 14 | 1777 | Logic ?i?u khi?n m?n h?nh |
| `lib/` | 4 | 588 | H? t?ng API, socket, offline, background |
| `store/` | 7 | 1375 | B? nh? d?ng chung v? API actions |
| `types/` | 1 | 62 | Ki?u d? li?u Trip/Order |
| `utils/` | 3 | 243 | H?m ti?n ?ch |

## 3. Gi?i th?ch si?u ng?n c?c thu?t ng?

| Thu?t ng? | Ngh?a d? hi?u |
|---|---|
| Component | M?t m?nh giao di?n nh?, v? d? card xe, n?t SOS, form t?o ??n. |
| Screen | M?t m?n h?nh ho?n ch?nh. File trong `app/` th??ng l? screen. |
| Hook | H?m b?t ??u b?ng `use...`, gom logic nh? l?y d? li?u, b?m n?t, x? l? b?n ??. |
| Store | B? nh? d?ng chung c?a app. App n?y d?ng Zustand. |
| API | ???ng g?i l?n backend/server, v? d? `/trips/my`, `/orders`. |
| Socket | K?t n?i realtime, server ??y d? li?u ngay: v? tr? xe, trip m?i, c?nh b?o. |
| Props | D? li?u truy?n t? component cha xu?ng component con. |
| State | D? li?u ?ang n?m trong m?n h?nh ho?c store t?i th?i ?i?m hi?n t?i. |
| Token | V? v?o c?ng ?? g?i API sau khi ??ng nh?p. |
| Refresh token | V? d? ph?ng d?ng ?? xin token m?i khi token c? h?t h?n. |
| Geofence | Ki?m tra t?i x? c? ?ang ? g?n ?i?m l?y/giao h?ng hay kh?ng. |

## 4. Ki?n tr?c app ch?y nh? th? n?o?

```text
Ng??i d?ng b?m m?n h?nh
        |
        v
app/ screen
        |
        v
hooks/ logic ?i?u khi?n
        |
        v
store/ b? nh? + action
        |
        +--> lib/authFetch.ts  --> Backend REST API
        |
        +--> lib/socket.ts     --> Backend Socket realtime
        |
        +--> utils/            --> T?nh kho?ng c?ch, ??c t?a ??, format l?i
        |
        v
components/ hi?n th? giao di?n
```

C?ch hi?u: file trong `app/` l? m?n h?nh. M?n h?nh g?i `hooks/` ho?c `store/` ?? l?y d? li?u. `store/` g?i API/backend. `components/` ch? nh?n d? li?u ?? hi?n th?.

## 5. C?c m?n h?nh ch?nh trong `app/`

| File | M?n h?nh | Ai d?ng | Nhi?m v? |
|---|---|---|---|
| `app/_layout.tsx` | Layout g?c | T?t c? | N?p font, ki?m tra login, k?t n?i socket global, hi?n th? Toast. |
| `app/login.tsx` | ??ng nh?p | T?t c? | Login, qu?n m?t kh?u, reset m?t kh?u. |
| `app/(tabs)/_layout.tsx` | Tab layout | Sau login | ?n/hi?n tab theo role Driver/Admin. |
| `app/(tabs)/index.tsx` | My Trips | Driver | Xem chuy?n ?ang ch?y v? chuy?n ch? nh?n. |
| `app/(tabs)/map.tsx` | Active Map | Driver | B?n ?? chuy?n ?ang ch?y, v? tr? xe, n?t l?y/giao h?ng. |
| `app/(tabs)/history.tsx` | History | Driver | L?ch s? chuy?n. |
| `app/(tabs)/profile.tsx` | Profile | Driver/Admin | H? s?, tr?ng th?i online/offline, ??i m?t kh?u. |
| `app/trip/[id].tsx` | Trip detail | Driver/Admin | Chi ti?t m?t chuy?n, order, timeline, action. |
| `app/camera.tsx` | Camera proof | Driver | Ch?p ?nh b?ng ch?ng. |
| `app/signature.tsx` | Signature | Driver | Kh?ch k? x?c nh?n giao h?ng. |
| `app/(tabs)/admin-dashboard.tsx` | Dashboard | Admin | KPI, ho?t ??ng g?n ??y, c?nh b?o. |
| `app/(tabs)/admin-tracking.tsx` | Tracking | Admin | Theo d?i xe realtime tr?n b?n ??. |
| `app/(tabs)/admin-orders.tsx` | Orders | Admin | Danh s?ch, l?c, t?o, s?a ??n. |
| `app/(tabs)/admin-fleet.tsx` | Fleet | Admin | Qu?n l? t?i x?, xe, v?n tay. |
| `app/admin/dispatch/index.tsx` | Dispatch Center | Admin | Ch?n ??n, l?y g?i ? xe, x?c nh?n ?i?u ph?i. |
| `app/admin/orders/create.tsx` | Create Order | Admin | T?o ??n m?i. |
| `app/admin/orders/[id].tsx` | Order Detail | Admin | Xem/s?a/x?a/h?y/assign ??n. |
| `app/admin/fleet/drivers/[id].tsx` | Driver Detail | Admin | Xem/s?a/x?a t?i x?, KPI, v?n tay. |
| `app/admin/fleet/vehicles/[id].tsx` | Vehicle Detail | Admin | Xem/s?a/x?a xe. |
| `app/admin/reports/*.tsx` | Reports | Admin | B?o c?o KPI, nhi?n li?u, chuy?n, s? d?ng xe. |

## 6. Role Driver v? Admin ???c t?ch nh? th? n?o?

Trong `app/(tabs)/_layout.tsx`, app ??c `user.role` t? `useAuthStore`.

```text
N?u user.role l? ADMIN:
  hi?n tab admin-dashboard, admin-tracking, admin-orders, admin-fleet, profile
  ?n tab driver nh? index/map/history

N?u user.role l? driver:
  hi?n tab index, map, history, profile
  ?n tab admin
```

Trong `app/_layout.tsx`, app ki?m tra ??ng nh?p:

```text
N?u ch?a ??ng nh?p m? kh?ng ? login:
  chuy?n v? /login

N?u ?? ??ng nh?p m? c?n ? login:
  chuy?n v? /(tabs)
```

## 7. Brain c?a app n?m ? ??u?

| Brain | File | L?m g? |
|---|---|---|
| Auth brain | `store/useAuthStore.ts`, `lib/authFetch.ts` | L?u session, token, refresh token, logout. |
| Trip brain | `store/useTripStore.ts` | L?y trip, nh?n/t? ch?i trip, ??i tr?ng th?i trip/order, g?i verification. |
| Mission/map brain | `hooks/map/useMapFlow.ts`, `hooks/map/useTripActions.ts` | ?i?u khi?n b?n ??, order hi?n t?i, n?t l?y/giao h?ng, geofence. |
| Realtime brain | `lib/socket.ts`, `store/useFleetTrackingStore.ts` | K?t n?i socket, nh?n v? tr? xe, reconnect, sync offline. |
| Verification brain | `components/trip/verification/useVerification.ts` | V?n tay, ph?n c?ng, polling, upload ?nh h?ng, submit proof. |

## 8. Store: b? nh? d?ng chung c?a app

### `useAuthStore`

| Action | ? ngh?a |
|---|---|
| `setAuth(user, token, refreshToken)` | L?u user/token sau login, app coi l? ?? ??ng nh?p. |
| `updateUser(partialUser)` | C?p nh?t m?t ph?n user, v? d? avatar ho?c fingerprint. |
| `updateTokens(token, refreshToken)` | C?p nh?t token m?i sau khi refresh. |
| `logout()` | X?a session, app quay v? tr?ng th?i ch?a ??ng nh?p. |

### `useTripStore`

| Action | G?i API | ? ngh?a |
|---|---|---|
| `fetchTrips(filters?)` | `GET /trips/my` | L?y chuy?n c?a t?i x?, chia th?nh active/pending/history. |
| `acceptTrip(id)` | qua `updateTripStatus` | Nh?n chuy?n. |
| `rejectTrip(id)` | qua `updateTripStatus` | T? ch?i chuy?n. |
| `updateTripStatus(id, status)` | `PATCH /trips/:id/status` | ??i tr?ng th?i chuy?n. |
| `updateOrderStatus(id, status, options?)` | `PATCH /orders/:id/status` | ??i tr?ng th?i ??n, c? th? k?m ?nh/ch? k?/t?a ??. |
| `submitOrderVerification(orderId, data)` | `POST /orders/:id/verifications` | G?i b?ng ch?ng x?c th?c. |
| `updateCargoPhoto(orderId, step, url)` | `PATCH /orders/:id/verifications/:step/cargo-photo` | Th?m ?nh h?ng cho verification ?? c?. |
| `fetchTripDetails(id)` | `GET /trips/:id`, `/trips/:id/verifications` | L?y chi ti?t chuy?n. |

### `useOrderStore`

| Action | G?i API | ? ngh?a |
|---|---|---|
| `fetchOrders(params?)` | `GET /orders` | L?y danh s?ch ??n cho admin. |
| `createOrder(orderData)` | `POST /orders` | T?o ??n, bi?n t?a ?? th?nh DTO backend. |
| `updateOrder(id, orderData)` | `PATCH /orders/:id` ho?c `/orders/:id/status` | S?a ??n ho?c ??i status. |
| `deleteOrder(id)` | `DELETE /orders/:id` | X?a ??n. |
| `assignOrder(orderId, vehicleId, driverId)` | `POST /dispatch/assign` | G?n ??n cho xe. |
| `getOrderById(id)` | local | T?m ??n trong store. |
| `fetchOrderById(id)` | `GET /orders/:id` | L?y chi ti?t ??n. |

### `useFleetStore`

| Nh?m | Action | ? ngh?a |
|---|---|---|
| Driver | `fetchDrivers`, `createDriver`, `updateDriver`, `deleteDriver` | CRUD t?i x?. |
| Vehicle | `fetchVehicles`, `createVehicle`, `updateVehicle`, `deleteVehicle` | CRUD xe. |
| Dispatch | `fetchSuggestions(orderId)` | L?y g?i ? xe ph? h?p t? backend. |
| Fingerprint | `clearFingerprint`, `clearAllFingerprints` | X?a v?n tay. |
| Assignment | `assignDriverToVehicle` | G?n t?i x? v?o xe. |

### `useFleetTrackingStore`

| Action | ? ngh?a |
|---|---|
| `fetchLiveLocations()` | L?y snapshot v? tr? xe ban ??u t? `/tracking/live`. |
| `updateVehicleLocation(data)` | C?p nh?t m?t xe trong map `vehicles[vehicleId]`. |
| `startTracking()` | ??ng k? socket `gps:update`. |
| `stopTracking()` | H?y socket `gps:update`. |

### `useDashboardStore`

`fetchStats()` g?i song song `/vehicles`, `/orders`, `/alerts`, `/trips`, sau ?? t?nh KPI dashboard.

### `useReportStore`

| Action | API | M?n h?nh d?ng |
|---|---|---|
| `fetchFleetPerformance(params)` | `/reports/fleet-performance` | B?o c?o chuy?n/performance. |
| `fetchDriverKPIs()` | `/reports/kpi-leaderboard` | X?p h?ng t?i x?. |
| `fetchVehicleUtilization(params)` | `/reports/vehicle-utilization` | S? d?ng xe. |
| `fetchFuelCost(params)` | `/reports/fuel-cost` | Chi ph? nhi?n li?u. |

## 9. Lu?ng ??ng nh?p

```text
LoginScreen
  -> useAuthFlow.handleLogin()
  -> POST /auth/login
  -> nh?n accessToken, refreshToken, user
  -> useAuthStore.setAuth(...)
  -> router.replace('/(tabs)')
```

`authFetch()` trong `lib/authFetch.ts` l? c?a g?i API c? b?o v?:

```text
1. L?y token t? useAuthStore.
2. G?n Authorization: Bearer token.
3. G?i API.
4. N?u kh?ng ph?i l?i 401: tr? response.
5. N?u 401: g?i /auth/refresh.
6. N?u refresh th?nh c?ng: g?i l?i request ban ??u.
7. N?u refresh th?t b?i: logout.
```

## 10. Lu?ng t?i x? nh?n v? ch?y chuy?n

```text
Driver v?o tab My Trips
  -> app/(tabs)/index.tsx
  -> useTripStore.fetchTrips()
  -> Backend /trips/my
  -> store chia d? li?u th?nh activeTrip, pendingTrips, tripHistory

Driver b?m Accept
  -> acceptTrip(id)
  -> updateTripStatus(id, accepted)
  -> fetchTrips l?i
  -> chuy?n sang /(tabs)/map

Driver v?o Map
  -> app/(tabs)/map.tsx
  -> useMapFlow()
      -> useHardwareLocation()
      -> useMapRoute()
      -> useMapCamera()
      -> useTripActions()
```

## 11. Lu?ng b?n ?? v? v? tr? xe

App hi?n ?ang theo h??ng **IoT strict mode**:

- V? tr? xe tr?n map l?y t? ph?n c?ng/IoT qua socket.
- ?i?n tho?i kh?ng upload GPS li?n t?c l?n server ?? tracking.
- GPS ?i?n tho?i v?n d?ng c?c b? ?? ki?m tra t?i x? c? g?n ?i?m l?y/giao h?ng kh?ng.

Lu?ng map:

```text
useHardwareLocation
  -> emit subscribe:trip
  -> nghe socket trip:location
  -> c?p nh?t hardwareLocation
  -> useMapFlow bi?n th?nh location
  -> ActiveTripMap v? marker xe
```

## 12. Lu?ng pickup/delivery v? x?c th?c

```text
Driver b?m l?y h?ng/giao h?ng
  -> useTripActions ki?m tra c? location kh?ng
  -> calculateDistance() t?nh kho?ng c?ch t?i ?i?m pickup/delivery
  -> n?u xa h?n 200m: ch?n v? b?o l?i
  -> n?u trong 200m: m? VerificationModal

VerificationModal
  -> useVerification reset state
  -> n?u c? hardware: POST /tracking/active-order
  -> nghe socket order:verified
  -> ??ng th?i polling /orders/:id/verifications m?i 3 gi?y
  -> khi verified: chuy?n sang ch?p ?nh h?ng h?a
  -> upload ?nh h?ng l?n /upload?folder=orders
  -> submit proof
```

## 13. Lu?ng admin ?i?u ph?i ??n

```text
Admin v?o Dispatch Center
  -> fetchOrders({ status: pending })
  -> fetchVehicles()
  -> admin ch?n m?t order
  -> fetchSuggestions(orderId) g?i /dispatch/suggest/:orderId
  -> frontend hi?n th? xe ???c g?i ? + xe c?n l?i
  -> frontend c?nh b?o n?u thi?u t?i tr?ng ho?c b?ng l?i h?t h?n
  -> admin b?m Confirm
  -> assignOrder(orderId, vehicleId, driverId)
  -> backend /dispatch/assign nh?n orderId + vehicleId
```

L?u ?: thu?t to?n ?i?u ph?i th?ng minh th?t s? n?m ? backend, kh?ng n?m trong frontend.

## 14. Lu?ng admin tracking realtime

```text
Admin v?o admin-tracking
  -> fetchLiveLocations() l?y snapshot ban ??u t? /tracking/live
  -> startTracking() ??ng k? socket gps:update
  -> m?i l?n c? gps:update:
       updateVehicleLocation(data)
       c?p nh?t vehicles[vehicleId]
       FleetMarker render l?i tr?n b?n ??
  -> admin b?m v?o xe:
       GET /trips/:tripId
       GET /trips/:tripId/verifications
       hi?n marker order v? modal proof
```

## 15. Socket realtime

### App ?ang nghe

| Event | File | ? ngh?a |
|---|---|---|
| `trip:assigned` | `app/_layout.tsx` | C? trip m?i ???c g?n cho driver. |
| `trip:cancelled` | `app/_layout.tsx` | Trip b? h?y b?i dispatcher. |
| `enroll:required` | `app/_layout.tsx` | C?n ??ng k? v?n tay. |
| `enroll:result` | `app/_layout.tsx` | K?t qu? ??ng k? v?n tay. |
| `fingerprint:deleted` | `app/_layout.tsx` | K?t qu? x?a v?n tay m?t t?i x?. |
| `fingerprint:all_cleared` | `app/_layout.tsx` | K?t qu? x?a to?n b? v?n tay. |
| `alert:new` | `hooks/admin/useAdminDashboard.ts` | C?nh b?o m?i. |
| `trip:status-changed` | `hooks/admin/useAdminDashboard.ts` | Trip ??i tr?ng th?i. |
| `order:verified` | `useVerification.ts` | ??n ?? ???c hardware/backend x?c th?c. |
| `trip:location` | `useHardwareLocation.ts` | V? tr? xe trong trip. |
| `gps:update` | `useFleetTrackingStore.ts` | V? tr? xe realtime cho admin. |

### App ?ang g?i

| Event | File | ? ngh?a |
|---|---|---|
| `subscribe:trip` | `useHardwareLocation.ts` | V?o room c?a trip ?? nghe v? tr?. |
| `trip:status_change` | `useTripActions.ts` | B?o trip ??i status. |
| `order:status_change` | `useTripActions.ts` | B?o order ??i status. |
| `gps:batch_update` | `socket.ts` | ??ng b? GPS offline queue. |
| `sos:alert` | `socket.ts` | G?i SOS qua socket. |

## 16. Components quan tr?ng

| Nh?m | Component | ? ngh?a |
|---|---|---|
| Auth | `LoginForm`, `ForgotPassFlow`, `AuthInput`, `AuthButton` | Giao di?n ??ng nh?p/qu?n m?t kh?u. |
| Trip | `TripCard`, `OrderCard`, `TripActions`, `TripTimeline` | Hi?n th? v? thao t?c chuy?n. |
| Map | `MissionDashboard`, `MissionPanel`, `ActionButton`, `FleetMarker` | B?n ??, marker, n?t h?nh ??ng. |
| Verification | `VerificationModal`, `useVerification`, `HardwareStep`, `CargoCaptureStep` | X?c th?c l?y/giao h?ng. |
| Admin Dashboard | `StatCard`, `ActivityLogsModal`, `KpiDetailModal` | KPI v? timeline. |
| Admin Dispatch | `OrdersSection`, `VehiclesSection`, `ConfirmDispatchButton` | ?i?u ph?i ??n. |
| Admin Fleet | `DriverCard`, `VehicleCard`, `DriverForm`, `VehicleForm` | Qu?n l? t?i x?/xe. |
| Admin Order | `OrderForm`, `MapPicker`, `OrderDetailInfo` | T?o/s?a/xem ??n. |
| Admin Tracking | `TrackingHeader`, `SelectedVehicleCard`, `ProofDetailsModal` | Theo d?i xe v? proof. |
| Profile | `ProfileHeader`, `ProfileStats`, `SettingsSection`, `PasswordModal` | H? s? user. |
| UI chung | `ConnectionStatus`, `NetworkBanner`, `SosButton` | Tr?ng th?i m?ng/socket v? SOS. |

## 17. API endpoints ???c frontend g?i

C?c API n?y ???c tr?ch xu?t t? code hi?n t?i.

| File:d?ng | D?ng code g?i API |
|---|---|
| `app/(tabs)/admin-tracking.tsx:42` | `const tripRes = await authFetch(`/trips/${tripId}`);` |
| `app/(tabs)/admin-tracking.tsx:48` | `const verifRes = await authFetch(`/trips/${tripId}/verifications`);` |
| `app/(tabs)/index.tsx:55` | `const response = await authFetch('/auth/me');` |
| `app/admin/fleet/drivers/[id].tsx:66` | `const response = await axios.get(`${API_URL}/reports/driver-kpi/${id}`, {` |
| `app/admin/fleet/drivers/[id].tsx:82` | `const response = await axios.get(`${API_URL}/drivers/${id}/verifications`, {` |
| `app/admin/fleet/drivers/[id].tsx:97` | `const response = await axios.get(`${API_URL}/trips?driverId=${id}`, {` |
| `app/admin/fleet/drivers/[id].tsx:110` | `const response = await axios.get(`${API_URL}/alerts?driverId=${id}`, {` |
| `app/admin/orders/[id].tsx:59` | `authFetch(`/orders/${id}/verifications`)` |
| `app/admin/trips.tsx:73` | `const response = await authFetch(url);` |
| `app/camera.tsx:68` | `const response = await authFetch('/upload?folder=orders', {` |
| `app/signature.tsx:44` | `const uploadRes = await authFetch('/upload?folder=signatures', {` |
| `components/admin/fleet/VehicleForm.tsx:68` | `const response = await axios.post(`${API_URL}/upload?folder=vehicles`, uploadData, {` |
| `components/admin/order/AddressAutocomplete.tsx:45` | `const response = await axios.get(` |
| `components/admin/order/MapPicker.tsx:153` | `const mapboxPromise = axios.get(` |
| `components/admin/order/MapPicker.tsx:167` | `const osmPromise = axios.get(` |
| `components/admin/order/MapPicker.tsx:246` | `const response = await axios.get(` |
| `components/admin/tracking/SelectedVehicleCard.tsx:54` | `const response = await authFetch('/drivers');` |
| `components/trip/verification/useVerification.ts:71` | `authFetch('/tracking/active-order', {` |
| `components/trip/verification/useVerification.ts:134` | `const response = await authFetch(`/orders/${orderId}/verifications`);` |
| `components/trip/verification/useVerification.ts:288` | `const response = await authFetch('/upload?folder=orders', {` |
| `components/ui/SosButton.tsx:33` | `const response = await authFetch(`/trips/${tripId}/incident`, {` |
| `hooks/auth/useAuthFlow.ts:33` | `const response = await fetch(`${API_URL}/auth/login`, {` |
| `hooks/auth/useAuthFlow.ts:88` | `const response = await fetch(`${API_URL}/auth/forgot-password`, {` |
| `hooks/auth/useAuthFlow.ts:135` | `const response = await fetch(`${API_URL}/auth/reset-password`, {` |
| `hooks/profile/useAvatarUpload.ts:52` | `const uploadResponse = await authFetch('/upload?folder=avatars', {` |
| `hooks/profile/useAvatarUpload.ts:71` | `const updateResponse = await authFetch('/users/profile', {` |
| `hooks/profile/usePasswordChange.ts:43` | `const response = await authFetch('/auth/change-password', {` |
| `hooks/profile/useProfileFlow.ts:44` | `const response = await authFetch('/auth/me');` |
| `hooks/profile/useProfileFlow.ts:73` | `const response = await authFetch(`/reports/driver-kpi/${user.driver.id}`);` |
| `hooks/profile/useProfileFlow.ts:85` | `const response = await authFetch(`/alerts?driverId=${user.driver.id}`);` |
| `hooks/profile/useProfileFlow.ts:116` | `const response = await authFetch('/drivers/status/me', {` |
| `lib/authFetch.ts:40` | `const response = await fetch(`${API_URL}/auth/refresh`, {` |
| `lib/authFetch.ts:77` | `export async function authFetch(` |
| `lib/authFetch.ts:89` | `let response = await fetch(url, requestOptions);` |
| `lib/authFetch.ts:100` | `response = await fetch(url, {` |
| `store/useDashboardStore.ts:50` | `fetch(`${API_URL}/vehicles`, { headers }),` |
| `store/useDashboardStore.ts:51` | `fetch(`${API_URL}/orders`, { headers }),` |
| `store/useDashboardStore.ts:52` | `fetch(`${API_URL}/alerts`, { headers }),` |
| `store/useDashboardStore.ts:53` | `fetch(`${API_URL}/trips`, { headers }).catch(() => null), // Fail-safe fallback if /trips fails` |
| `store/useFleetStore.ts:108` | `const response = await axios.get(`${API_URL}/drivers`, {` |
| `store/useFleetStore.ts:121` | `const response = await axios.get(`${API_URL}/vehicles`, {` |
| `store/useFleetStore.ts:134` | `const response = await axios.get(`${API_URL}/dispatch/suggest/${orderId}`, {` |
| `store/useFleetStore.ts:147` | `const response = await axios.post(`${API_URL}/drivers`, data, {` |
| `store/useFleetStore.ts:165` | `const response = await axios.post(`${API_URL}/vehicles`, data, {` |
| `store/useFleetStore.ts:183` | `const response = await axios.patch(`${API_URL}/drivers/${id}`, data, {` |
| `store/useFleetStore.ts:202` | `const response = await axios.patch(`${API_URL}/vehicles/${id}`, data, {` |
| `store/useFleetStore.ts:221` | `await axios.delete(`${API_URL}/drivers/${id}`, {` |
| `store/useFleetStore.ts:239` | `await axios.delete(`${API_URL}/vehicles/${id}`, {` |
| `store/useFleetStore.ts:257` | `await axios.delete(`${API_URL}/drivers/${id}/fingerprint`, {` |
| `store/useFleetStore.ts:275` | `await axios.delete(`${API_URL}/drivers/fingerprints/all`, {` |
| `store/useFleetStore.ts:293` | `await axios.post(`${API_URL}/vehicles/${vehicleId}/assign/${driverId}`, {}, {` |
| `store/useFleetTrackingStore.ts:43` | `const response = await authFetch('/tracking/live');` |
| `store/useOrderStore.ts:78` | `const response = await axios.get(`${API_URL}/orders`, {` |
| `store/useOrderStore.ts:125` | `const response = await axios.post(`${API_URL}/orders`, payload, {` |
| `store/useOrderStore.ts:150` | `response = await axios.patch(`${API_URL}/orders/${id}/status`, { status: orderData.status }, {` |
| `store/useOrderStore.ts:173` | `response = await axios.patch(`${API_URL}/orders/${id}`, payload, {` |
| `store/useOrderStore.ts:195` | `await axios.delete(`${API_URL}/orders/${id}`, {` |
| `store/useOrderStore.ts:216` | `await axios.post(`${API_URL}/dispatch/assign`, {` |
| `store/useOrderStore.ts:255` | `const response = await axios.get(`${API_URL}/orders/${id}`, {` |
| `store/useReportStore.ts:106` | `const response = await axios.get(`${API_URL}/reports/fleet-performance`, {` |
| `store/useReportStore.ts:121` | `const response = await axios.get(`${API_URL}/reports/kpi-leaderboard`, {` |
| `store/useReportStore.ts:144` | `const response = await axios.get(`${API_URL}/reports/vehicle-utilization`, {` |
| `store/useReportStore.ts:159` | `const response = await axios.get(`${API_URL}/reports/fuel-cost`, {` |
| `store/useTripStore.ts:99` | `const response = await authFetch(url);` |
| `store/useTripStore.ts:149` | `const response = await authFetch(`/trips/${id}/status`, {` |
| `store/useTripStore.ts:173` | `const response = await authFetch(`/orders/${id}/status`, {` |
| `store/useTripStore.ts:203` | `const response = await authFetch(`/orders/${orderId}/verifications`, {` |
| `store/useTripStore.ts:226` | `const response = await authFetch(`/orders/${orderId}/verifications/${step}/cargo-photo`, {` |
| `store/useTripStore.ts:249` | `const tripRes = await authFetch(`/trips/${id}`);` |
| `store/useTripStore.ts:264` | `const verRes = await authFetch(`/trips/${id}/verifications`);` |
| `utils/geo.ts:92` | `const response = await fetch(url);` |

## 18. Socket events ???c frontend d?ng

| File:d?ng | D?ng code socket |
|---|---|
| `app/_layout.tsx:174` | `socketService.on('trip:assigned', handleTripAssigned);` |
| `app/_layout.tsx:175` | `socketService.on('trip:cancelled', handleTripCancelled);` |
| `app/_layout.tsx:176` | `socketService.on('enroll:required', handleEnrollRequired);` |
| `app/_layout.tsx:177` | `socketService.on('enroll:result', handleEnrollResult);` |
| `app/_layout.tsx:178` | `socketService.on('fingerprint:deleted', handleFingerprintDeleted);` |
| `app/_layout.tsx:179` | `socketService.on('fingerprint:all_cleared', handleFingerprintAllCleared);` |
| `app/_layout.tsx:182` | `socketService.off('trip:assigned', handleTripAssigned);` |
| `app/_layout.tsx:183` | `socketService.off('trip:cancelled', handleTripCancelled);` |
| `app/_layout.tsx:184` | `socketService.off('enroll:required', handleEnrollRequired);` |
| `app/_layout.tsx:185` | `socketService.off('enroll:result', handleEnrollResult);` |
| `app/_layout.tsx:186` | `socketService.off('fingerprint:deleted', handleFingerprintDeleted);` |
| `app/_layout.tsx:187` | `socketService.off('fingerprint:all_cleared', handleFingerprintAllCleared);` |
| `components/trip/verification/useVerification.ts:129` | `socketService.on('order:verified', handleOrderVerified);` |
| `components/trip/verification/useVerification.ts:154` | `socketService.off('order:verified', handleOrderVerified);` |
| `hooks/admin/useAdminDashboard.ts:244` | `socketService.on('alert:new', handleNewAlert);` |
| `hooks/admin/useAdminDashboard.ts:245` | `socketService.on('trip:status-changed', handleTripStatusChanged);` |
| `hooks/admin/useAdminDashboard.ts:246` | `socketService.on('order:verified', handleOrderVerified);` |
| `hooks/admin/useAdminDashboard.ts:249` | `socketService.off('alert:new', handleNewAlert);` |
| `hooks/admin/useAdminDashboard.ts:250` | `socketService.off('trip:status-changed', handleTripStatusChanged);` |
| `hooks/admin/useAdminDashboard.ts:251` | `socketService.off('order:verified', handleOrderVerified);` |
| `hooks/map/useHardwareLocation.ts:30` | `socketService.emit('subscribe:trip', { tripId: activeTrip.id });` |
| `hooks/map/useHardwareLocation.ts:44` | `socketService.on('trip:location', onTripLocation);` |
| `hooks/map/useHardwareLocation.ts:47` | `socketService.off('trip:location', onTripLocation);` |
| `hooks/map/useTripActions.ts:49` | `socketService.emit('trip:status_change', {` |
| `hooks/map/useTripActions.ts:134` | `socketService.emit('order:status_change', {` |
| `hooks/map/useTripActions.ts:214` | `socketService.emit('trip:status_change', {` |
| `hooks/map/useTripActions.ts:228` | `socketService.emit('order:status_change', {` |
| `hooks/map/useTripActions.ts:234` | `socketService.emit('trip:status_change', {` |
| `hooks/map/useTripActions.ts:245` | `socketService.emit('order:status_change', {` |
| `hooks/map/useTripActions.ts:255` | `socketService.emit('order:status_change', {` |
| `hooks/map/useTripActions.ts:266` | `socketService.emit('trip:status_change', {` |
| `hooks/useLocationTracking.ts:47` | `socketService.emit('gps:update', {` |
| `lib/backgroundTasks.ts:58` | `socketService.emit('gps:update', payload);` |
| `lib/socket.ts:103` | `this.socket.io.on('reconnect_attempt', async () => {` |
| `lib/socket.ts:116` | `this.socket.on('connect', () => {` |
| `lib/socket.ts:122` | `this.socket.on('disconnect', (reason) => {` |
| `lib/socket.ts:130` | `this.socket.on('connect_error', (err) => {` |
| `lib/socket.ts:188` | `this.socket.emit('sos:alert', { tripId, description, location }, (response: any) => {` |
| `lib/socket.ts:231` | `this.socket!.emit('gps:batch_update', chunk, (ack: any) => {` |
| `store/useFleetTrackingStore.ts:110` | `socketService.on('gps:update', updateFn);` |
| `store/useFleetTrackingStore.ts:116` | `socketService.off('gps:update', updateFn);` |

## 19. Store actions tr?ch xu?t t? code

### `useAuthStore.ts`

| D?ng | Action / field |
|---:|---|
| 28 | `setAuth: (user: User, token: string, refreshToken: string) => void;` |
| 29 | `updateUser: (user: Partial<User>) => void;` |
| 30 | `updateTokens: (token: string, refreshToken: string) => void;` |
| 31 | `logout: () => void;` |
| 36 | `getItem: async (name: string) => {` |
| 42 | `setItem: async (name: string, value: string) => {` |
| 49 | `removeItem: async (name: string) => {` |
| 61 | `user: null,` |
| 62 | `token: null,` |
| 63 | `refreshToken: null,` |
| 64 | `isAuthenticated: false,` |
| 65 | `setAuth: (user, token, refreshToken) =>` |
| 67 | `updateUser: (updatedUser) =>` |
| 71 | `updateTokens: (token, refreshToken) => set({ token, refreshToken }),` |
| 72 | `logout: () =>` |
| 81 | `name: 'auth-storage',` |
| 82 | `storage: createJSONStorage(() => persistentStorage),` |

### `useDashboardStore.ts`

| D?ng | Action / field |
|---:|---|
| 20 | `fetchStats: () => Promise<void>;` |
| 39 | `fetchStats: async () => {` |

### `useFleetStore.ts`

| D?ng | Action / field |
|---:|---|
| 81 | `fetchDrivers: () => Promise<void>;` |
| 82 | `fetchVehicles: () => Promise<void>;` |
| 83 | `fetchSuggestions: (orderId: string) => Promise<void>;` |
| 84 | `createDriver: (data: any) => Promise<void>;` |
| 85 | `createVehicle: (data: any) => Promise<void>;` |
| 86 | `updateDriver: (id: string, data: any) => Promise<void>;` |
| 87 | `updateVehicle: (id: string, data: any) => Promise<void>;` |
| 88 | `deleteDriver: (id: string) => Promise<void>;` |
| 89 | `deleteVehicle: (id: string) => Promise<void>;` |
| 90 | `clearFingerprint: (id: string) => Promise<void>;` |
| 91 | `clearAllFingerprints: () => Promise<void>;` |
| 92 | `assignDriverToVehicle: (driverId: string, vehicleId: string) => Promise<void>;` |
| 104 | `fetchDrivers: async () => {` |
| 117 | `fetchVehicles: async () => {` |
| 130 | `fetchSuggestions: async (orderId: string) => {` |
| 143 | `createDriver: async (data) => {` |
| 161 | `createVehicle: async (data) => {` |
| 179 | `updateDriver: async (id, data) => {` |
| 198 | `updateVehicle: async (id, data) => {` |
| 217 | `deleteDriver: async (id) => {` |
| 235 | `deleteVehicle: async (id) => {` |
| 253 | `clearFingerprint: async (id) => {` |
| 271 | `clearAllFingerprints: async () => {` |
| 289 | `assignDriverToVehicle: async (driverId, vehicleId) => {` |

### `useFleetTrackingStore.ts`

| D?ng | Action / field |
|---:|---|
| 29 | `fetchLiveLocations: () => Promise<void>;` |
| 30 | `updateVehicleLocation: (data: any) => void;` |
| 31 | `startTracking: () => void;` |
| 32 | `stopTracking: () => void;` |
| 40 | `fetchLiveLocations: async () => {` |
| 79 | `updateVehicleLocation: (data: any) => {` |
| 83 | `vehicles: {` |
| 106 | `startTracking: () => {` |
| 113 | `stopTracking: () => {` |

### `useOrderStore.ts`

| D?ng | Action / field |
|---:|---|
| 43 | `id: string;` |
| 44 | `fullName: string \| null;` |
| 45 | `phone: string \| null;` |
| 48 | `id: string;` |
| 49 | `plateNumber: string \| null;` |
| 58 | `fetchOrders: (params?: any) => Promise<void>;` |
| 59 | `createOrder: (orderData: Partial<Order>) => Promise<Order>;` |
| 60 | `updateOrder: (id: string, orderData: Partial<Order>) => Promise<Order>;` |
| 61 | `deleteOrder: (id: string) => Promise<void>;` |
| 62 | `assignOrder: (orderId: string, vehicleId: string, driverId: string) => Promise<void>;` |
| 63 | `getOrderById: (id: string) => Order \| undefined;` |
| 64 | `fetchOrderById: (id: string) => Promise<Order>;` |
| 74 | `fetchOrders: async (params = {}) => {` |
| 98 | `createOrder: async (orderData) => {` |
| 142 | `updateOrder: async (id, orderData) => {` |
| 191 | `deleteOrder: async (id) => {` |
| 210 | `assignOrder: async (orderId, vehicleId, driverId) => {` |
| 247 | `getOrderById: (id) => {` |
| 251 | `fetchOrderById: async (id) => {` |

### `useReportStore.ts`

| D?ng | Action / field |
|---:|---|
| 86 | `fetchFleetPerformance: (params: { from: string; to: string }) => Promise<void>;` |
| 87 | `fetchDriverKPIs: () => Promise<void>;` |
| 88 | `fetchVehicleUtilization: (params: { from: string; to: string }) => Promise<void>;` |
| 89 | `fetchFuelCost: (params: { from: string; to: string }) => Promise<void>;` |
| 102 | `fetchFleetPerformance: async (params) => {` |
| 117 | `fetchDriverKPIs: async () => {` |
| 140 | `fetchVehicleUtilization: async (params) => {` |
| 155 | `fetchFuelCost: async (params) => {` |

### `useTripStore.ts`

| D?ng | Action / field |
|---:|---|
| 21 | `lastKnownLocation: parsePoint(t.vehicle.lastKnownLocation),` |
| 24 | `id: t.driver.id,` |
| 25 | `fingerprintId: t.driver.fingerprintId,` |
| 59 | `setActiveTrip: (trip: Trip \| null) => void;` |
| 60 | `setSocketConnected: (connected: boolean) => void;` |
| 61 | `fetchTrips: (filters?: { startDate?: string; endDate?: string }) => Promise<void>;` |
| 62 | `acceptTrip: (id: string) => Promise<void>;` |
| 63 | `rejectTrip: (id: string) => Promise<void>;` |
| 64 | `updateTripStatus: (id: string, status: TripStatus) => Promise<void>;` |
| 65 | `updateOrderStatus: (id: string, status: OrderStatus, options?: { photoUrl?: string, signatureUrl?: string, actionLat?: number, actionLng?: number }) => Promise<void>;` |
| 66 | `submitOrderVerification: (orderId: string, data: { step: string; fingerprintStatus: boolean; facePhotoUrl?: string; cargoPhotoUrl?: string; latitude?: number; longitude?: number }) => Promise<void>;` |
| 67 | `updateCargoPhoto: (orderId: string, step: string, cargoPhotoUrl: string) => Promise<void>;` |
| 68 | `fetchTripDetails: (id: string) => Promise<{ trip: Trip; verifications: any[] }>;` |
| 74 | `activeTrip: null,` |
| 75 | `pendingTrips: [],` |
| 76 | `tripHistory: [],` |
| 77 | `isLoading: false,` |
| 78 | `error: null,` |
| 79 | `isSocketConnected: false,` |
| 81 | `setActiveTrip: (trip) => set({ activeTrip: trip }),` |
| 82 | `setSocketConnected: (connected) => set({ isSocketConnected: connected }),` |
| 84 | `fetchTrips: async (filters) => {` |
| 138 | `acceptTrip: async (id: string) => {` |
| 142 | `rejectTrip: async (id: string) => {` |
| 146 | `updateTripStatus: async (id: string, status: TripStatus) => {` |
| 170 | `updateOrderStatus: async (id: string, status: OrderStatus, options?: { photoUrl?: string, signatureUrl?: string, actionLat?: number, actionLng?: number }) => {` |
| 200 | `submitOrderVerification: async (orderId: string, verificationData: any) => {` |
| 223 | `updateCargoPhoto: async (orderId: string, step: string, cargoPhotoUrl: string) => {` |
| 246 | `fetchTripDetails: async (id: string) => {` |
| 283 | `name: 'trip-storage',` |
| 284 | `storage: createJSONStorage(() => AsyncStorage),` |
| 285 | `partialize: (state) => ({` |


## 20. B?ng tra c?u to?n b? file

| File | D?ng | ??nh ngh?a ??c l??ng | Export/component ch?nh |
|---|---:|---:|---|
| `__tests__/FleetMarker.test.tsx` | 110 | 11 | - |
| `__tests__/geo.test.ts` | 52 | 10 | - |
| `__tests__/smoke.test.tsx` | 14 | 0 | - |
| `app/(tabs)/_layout.tsx` | 153 | 3 | TabLayout |
| `app/(tabs)/admin-dashboard.tsx` | 258 | 3 | AdminDashboardScreen |
| `app/(tabs)/admin-fleet.tsx` | 240 | 20 | AdminFleetScreen |
| `app/(tabs)/admin-orders.tsx` | 285 | 26 | AdminOrdersScreen |
| `app/(tabs)/admin-tracking.tsx` | 319 | 40 | AdminTrackingScreen |
| `app/(tabs)/history.tsx` | 284 | 23 | TripHistoryTab |
| `app/(tabs)/index.tsx` | 291 | 26 | TripsScreen |
| `app/(tabs)/map.tsx` | 217 | 4 | ActiveTripMap |
| `app/(tabs)/profile.tsx` | 124 | 3 | ProfileScreen |
| `app/+html.tsx` | 38 | 2 | Root |
| `app/+not-found.tsx` | 18 | 1 | NotFoundScreen |
| `app/_layout.tsx` | 224 | 21 | re-export, unstable_settings, RootLayout |
| `app/admin/_layout.tsx` | 7 | 1 | AdminLayout |
| `app/admin/dispatch/components/ConfirmDispatchButton.tsx` | 40 | 2 | - |
| `app/admin/dispatch/components/DispatchHeader.tsx` | 45 | 2 | - |
| `app/admin/dispatch/components/OrdersSection.tsx` | 46 | 2 | - |
| `app/admin/dispatch/components/SmartDispatchBanner.tsx` | 35 | 2 | - |
| `app/admin/dispatch/components/VehiclesSection.tsx` | 96 | 4 | - |
| `app/admin/dispatch/index.tsx` | 268 | 37 | DispatchCenterScreen |
| `app/admin/fleet/drivers/[id].tsx` | 299 | 32 | DriverDetailScreen |
| `app/admin/fleet/vehicles/[id].tsx` | 191 | 11 | VehicleDetailScreen |
| `app/admin/orders/[id].tsx` | 305 | 21 | OrderDetailScreen |
| `app/admin/orders/create.tsx` | 49 | 4 | CreateOrderScreen |
| `app/admin/reports/drivers.tsx` | 211 | 10 | DriverLeaderboardScreen |
| `app/admin/reports/fuel.tsx` | 202 | 14 | FuelReportScreen |
| `app/admin/reports/index.tsx` | 19 | 2 | ReportsOverviewScreen |
| `app/admin/reports/trips.tsx` | 192 | 14 | TripReportsScreen |
| `app/admin/reports/utilization.tsx` | 176 | 11 | UtilizationReportScreen |
| `app/admin/trips.tsx` | 278 | 33 | AdminTripsScreen |
| `app/camera.tsx` | 174 | 16 | CameraScreen |
| `app/login.tsx` | 87 | 2 | LoginScreen |
| `app/modal.tsx` | 18 | 1 | ModalScreen |
| `app/signature.tsx` | 202 | 23 | SignatureCapture |
| `app/trip/[id].tsx` | 355 | 26 | TripDetails |
| `components/__tests__/StyledText-test.js` | 20 | 1 | - |
| `components/admin/dashboard/ActivityLogsModal.tsx` | 93 | 2 | ActivityLogsModal |
| `components/admin/dashboard/ExportButton.tsx` | 85 | 10 | ExportButton |
| `components/admin/dashboard/KpiDetailModal.tsx` | 235 | 9 | KpiDetailModal |
| `components/admin/dashboard/ReportCard.tsx` | 34 | 2 | ReportCard |
| `components/admin/dashboard/StatCard.tsx` | 48 | 5 | StatCard |
| `components/admin/dispatch/AssignedTripCard.tsx` | 79 | 5 | AssignedTripCard |
| `components/admin/dispatch/VehicleDispatchItem.tsx` | 162 | 8 | VehicleDispatchItem |
| `components/admin/fleet/DriverCard.tsx` | 70 | 5 | DriverCard |
| `components/admin/fleet/DriverContact.tsx` | 34 | 2 | DriverContact |
| `components/admin/fleet/DriverDetailTabs.tsx` | 31 | 2 | DriverDetailTabs |
| `components/admin/fleet/DriverForm.tsx` | 245 | 13 | DriverForm |
| `components/admin/fleet/DriverHeader.tsx` | 49 | 2 | DriverHeader |
| `components/admin/fleet/DriverJourneyTimeline.tsx` | 129 | 7 | DriverJourneyTimeline |
| `components/admin/fleet/DriverKpi.tsx` | 52 | 2 | DriverKpi |
| `components/admin/fleet/DriverKpiChart.tsx` | 68 | 3 | DriverKpiChart |
| `components/admin/fleet/DriverLicense.tsx` | 38 | 2 | DriverLicense |
| `components/admin/fleet/DriverProfileCard.tsx` | 53 | 4 | DriverProfileCard |
| `components/admin/fleet/FingerprintStatusCard.tsx` | 50 | 2 | FingerprintStatusCard |
| `components/admin/fleet/FleetHeader.tsx` | 51 | 2 | FleetHeader |
| `components/admin/fleet/FleetTabs.tsx` | 35 | 2 | FleetTabs |
| `components/admin/fleet/vehicle-form/DriverAssigner.tsx` | 124 | 5 | DriverAssigner |
| `components/admin/fleet/vehicle-form/VehicleBasicInfo.tsx` | 50 | 2 | VehicleBasicInfo |
| `components/admin/fleet/vehicle-form/VehicleImagePicker.tsx` | 100 | 6 | VehicleImagePicker |
| `components/admin/fleet/vehicle-form/VehicleStatusSelector.tsx` | 31 | 2 | VehicleStatusSelector |
| `components/admin/fleet/vehicle-form/VehicleTypeSelector.tsx` | 33 | 2 | VehicleTypeSelector |
| `components/admin/fleet/VehicleCard.tsx` | 64 | 5 | VehicleCard |
| `components/admin/fleet/VehicleDriver.tsx` | 34 | 2 | VehicleDriver |
| `components/admin/fleet/VehicleForm.tsx` | 162 | 18 | VehicleForm |
| `components/admin/fleet/VehicleHealth.tsx` | 24 | 1 | VehicleHealth |
| `components/admin/fleet/VehicleJourneyTimeline.tsx` | 141 | 7 | VehicleJourneyTimeline |
| `components/admin/fleet/VehicleSpecs.tsx` | 46 | 3 | VehicleSpecs |
| `components/admin/order/AddressAutocomplete.tsx` | 162 | 16 | AddressAutocomplete |
| `components/admin/order/MapPicker.tsx` | 399 | 36 | MapPicker |
| `components/admin/order/order-form/CargoDetailsSection.tsx` | 114 | 5 | CargoDetailsSection |
| `components/admin/order/order-form/CategoryModal.tsx` | 78 | 4 | categories, CategoryModal |
| `components/admin/order/order-form/DeadlineSection.tsx` | 40 | 2 | DeadlineSection |
| `components/admin/order/order-form/LocationSection.tsx` | 68 | 5 | LocationSection |
| `components/admin/order/order-form/RecipientSection.tsx` | 53 | 2 | RecipientSection |
| `components/admin/order/OrderCardItem.tsx` | 144 | 21 | STATUS_CONFIG, FILTER_STATUSES, OrderCardItem |
| `components/admin/order/OrderDateFilter.tsx` | 140 | 9 | OrderDateFilter |
| `components/admin/order/OrderDetailHeader.tsx` | 53 | 2 | OrderDetailHeader |
| `components/admin/order/OrderDetailInfo.tsx` | 283 | 11 | OrderDetailInfo |
| `components/admin/order/OrderDetailMap.tsx` | 86 | 9 | OrderDetailMap |
| `components/admin/order/OrderDispatchItem.tsx` | 75 | 2 | OrderDispatchItem |
| `components/admin/order/OrderFilterPills.tsx` | 91 | 4 | OrderFilterPills |
| `components/admin/order/OrderForm.tsx` | 296 | 15 | OrderForm |
| `components/admin/tracking/LightboxModal.tsx` | 47 | 2 | LightboxModal |
| `components/admin/tracking/ProofDetailsModal.tsx` | 216 | 11 | ProofDetailsModal |
| `components/admin/tracking/SelectedVehicleCard.tsx` | 243 | 12 | SelectedVehicleCard |
| `components/admin/tracking/TrackingHeader.tsx` | 126 | 2 | TrackingHeader |
| `components/admin/tracking/trackingUtils.ts` | 25 | 8 | formatTime, normalizePlate, getStatusColor |
| `components/admin/trip/AdminTripCard.tsx` | 65 | 6 | AdminTripCard |
| `components/admin/trip/CustomDatePickerRange.tsx` | 43 | 2 | CustomDatePickerRange |
| `components/admin/trip/TripFilterPills.tsx` | 49 | 4 | TripFilterPills |
| `components/auth/AuthUI.tsx` | 120 | 6 | AuthBackground, AuthInput, AuthButton |
| `components/auth/ForgotPassFlow.tsx` | 88 | 2 | ForgotPassFlow |
| `components/auth/LoginForm.tsx` | 55 | 2 | LoginForm |
| `components/auth/LoginHeader.tsx` | 41 | 2 | LoginHeader |
| `components/EditScreenInfo.tsx` | 47 | 1 | EditScreenInfo |
| `components/ExternalLink.tsx` | 24 | 1 | ExternalLink |
| `components/map/FleetMarker.tsx` | 86 | 6 | FleetMarker |
| `components/map/MapComponents.tsx` | 7 | 3 | MapComponent, MarkerComponent, PolylineComponent, re-export |
| `components/map/MapComponents.web.tsx` | 94 | 12 | MapComponent, MarkerComponent, PolylineComponent, PROVIDER_GOOGLE |
| `components/map/MapControls.tsx` | 47 | 2 | MapControls |
| `components/map/mission-panel/ActionButton.tsx` | 215 | 5 | ActionButton |
| `components/map/mission-panel/OrderDetailsSection.tsx` | 95 | 7 | OrderDetailsSection |
| `components/map/mission-panel/OrderSelectModal.tsx` | 93 | 6 | OrderSelectModal |
| `components/map/MissionDashboard.tsx` | 171 | 8 | MissionDashboard |
| `components/map/MissionPanel.tsx` | 176 | 7 | MissionPanel |
| `components/map/TripRoutePath.tsx` | 32 | 2 | TripRoutePath |
| `components/profile/AccountInfo.tsx` | 58 | 2 | AccountInfo |
| `components/profile/DriverKpiModal.tsx` | 292 | 14 | DriverKpiModal |
| `components/profile/MissionHistory.tsx` | 106 | 5 | MissionHistory |
| `components/profile/PasswordModal.tsx` | 134 | 2 | PasswordModal |
| `components/profile/ProfileHeader.tsx` | 85 | 2 | ProfileHeader |
| `components/profile/ProfileStats.tsx` | 62 | 3 | ProfileStats |
| `components/profile/SettingsSection.tsx` | 52 | 2 | SettingsSection |
| `components/trip/EmptyTrips.tsx` | 29 | 2 | EmptyTrips |
| `components/trip/NoActiveTrip.tsx` | 162 | 10 | NoActiveTrip |
| `components/trip/OrderCard.tsx` | 259 | 18 | OrderCard |
| `components/trip/OrderDetails.tsx` | 122 | 6 | OrderDetails |
| `components/trip/OrderProofDetails.tsx` | 152 | 9 | OrderProofDetails |
| `components/trip/TripActions.tsx` | 121 | 3 | TripActions |
| `components/trip/TripBadge.tsx` | 61 | 5 | getStatusColors, TripBadge |
| `components/trip/TripCard.tsx` | 137 | 12 | TripCard |
| `components/trip/TripHeader.tsx` | 24 | 2 | TripHeader |
| `components/trip/TripSectionHeader.tsx` | 37 | 3 | TripSectionHeader |
| `components/trip/TripSummaryCard.tsx` | 53 | 5 | TripSummaryCard |
| `components/trip/TripTimeline.tsx` | 94 | 3 | TripTimeline |
| `components/trip/verification/CargoCaptureStep.tsx` | 112 | 2 | CargoCaptureStep |
| `components/trip/verification/FaceCaptureStep.tsx` | 34 | 2 | FaceCaptureStep |
| `components/trip/verification/FingerprintStep.tsx` | 68 | 2 | FingerprintStep |
| `components/trip/verification/HardwareStep.tsx` | 57 | 2 | HardwareStep |
| `components/trip/verification/StepperProgress.tsx` | 20 | 2 | StepperProgress |
| `components/trip/verification/SubmitProofStep.tsx` | 87 | 2 | SubmitProofStep |
| `components/trip/verification/useVerification.ts` | 396 | 42 | useVerification |
| `components/trip/VerificationModal.tsx` | 179 | 4 | VerificationModal |
| `components/ui/ConnectionStatus.tsx` | 27 | 2 | ConnectionStatus |
| `components/ui/ExpandableToast.tsx` | 126 | 7 | toastConfig |
| `components/ui/NetworkBanner.tsx` | 54 | 6 | NetworkBanner |
| `components/ui/ProfileInfoItem.tsx` | 40 | 2 | ProfileInfoItem |
| `components/ui/SettingsItem.tsx` | 94 | 5 | SettingsItem |
| `components/ui/SosButton.tsx` | 198 | 10 | SosButton |
| `components/ui/StatCard.tsx` | 61 | 3 | StatCard |
| `components/ui/StyledText.tsx` | 5 | 1 | MonoText |
| `components/ui/Themed.tsx` | 45 | 9 | useThemeColor, Text, View |
| `components/useClientOnlyValue.ts` | 4 | 1 | useClientOnlyValue |
| `components/useClientOnlyValue.web.ts` | 12 | 2 | useClientOnlyValue |
| `components/useColorScheme.ts` | 1 | 0 | re-export |
| `components/useColorScheme.web.ts` | 8 | 1 | useColorScheme |
| `hooks/admin/useAdminDashboard.ts` | 292 | 43 | useAdminDashboard |
| `hooks/auth/useAuthFlow.ts` | 197 | 31 | useAuthFlow |
| `hooks/map/useHardwareLocation.ts` | 52 | 3 | useHardwareLocation |
| `hooks/map/useMapCamera.ts` | 101 | 8 | useMapCamera |
| `hooks/map/useMapFlow.ts` | 158 | 28 | useMapFlow |
| `hooks/map/useMapRoute.ts` | 38 | 6 | useMapRoute |
| `hooks/map/useTripActions.ts` | 306 | 14 | useTripActions |
| `hooks/profile/useAvatarUpload.ts` | 107 | 17 | useAvatarUpload |
| `hooks/profile/usePasswordChange.ts` | 94 | 10 | usePasswordChange |
| `hooks/profile/useProfileFlow.ts` | 196 | 26 | useProfileFlow |
| `hooks/profile/useProfileStats.ts` | 41 | 8 | useProfileStats |
| `hooks/useCountdown.ts` | 18 | 5 | useCountdown |
| `hooks/useGeofencing.ts` | 92 | 12 | LocationCoords, useGeofencing |
| `hooks/useLocationTracking.ts` | 85 | 9 | useLocationTracking |
| `lib/authFetch.ts` | 106 | 14 | - |
| `lib/backgroundTasks.ts` | 131 | 11 | LOCATION_TASK_NAME, startBackgroundLocation, stopBackgroundLocation |
| `lib/offlineQueue.ts` | 77 | 6 | GpsPoint, offlineQueue |
| `lib/socket.ts` | 274 | 13 | socketService |
| `store/useAuthStore.ts` | 85 | 4 | useAuthStore |
| `store/useDashboardStore.ts` | 127 | 21 | useDashboardStore |
| `store/useFleetStore.ts` | 307 | 40 | DriverStatus, VehicleType, VehicleStatus, Driver, Vehicle, DispatchSuggestion, useFleetStore |
| `store/useFleetTrackingStore.ts` | 118 | 12 | TrackedVehicle, useFleetTrackingStore |
| `store/useOrderStore.ts` | 278 | 29 | OrderStatus, Order, useOrderStore |
| `store/useReportStore.ts` | 169 | 28 | PerformanceTrend, StatusDistribution, TripsByVehicle, FleetPerformanceData, DriverKPI, VehicleUtilizationStats, UtilizationData, FuelCostByVehicleType, FuelCostTrend, VehicleFuelStats, FuelCostData, useReportStore |
| `store/useTripStore.ts` | 291 | 31 | re-export, useTripStore |
| `types/trip.ts` | 62 | 4 | TripStatus, OrderStatus, Order, Trip |
| `utils/error.ts` | 67 | 4 | formatError |
| `utils/geo.ts` | 134 | 29 | parsePoint, parseLineString, getRoute, calculateDistance |
| `utils/order.ts` | 42 | 10 | getCategoryLabel, getPriorityLabel, getPriorityColor, formatCountdown |

## 21. Nh?ng ?i?m c?n ch? ?

| ?i?m | V? sao c?n ch? ? |
|---|---|
| `app/trip/[id].tsx` c? `fillAll:` | G?n nh? ch?c l? typo c?a `finally`. TypeScript v?n pass v? JavaScript cho ph?p label, nh?ng n?n s?a ?? r? ngh?a. |
| `app/admin/trips.tsx` g?i `/trips/my` | N?u admin c?n xem t?t c? chuy?n th? endpoint n?y c? th? sai. |
| Fallback API URL ch?a th?ng nh?t | C? file fallback `3000/api`, c? file `3001/api`, c? file `3000` kh?ng `/api`. N?n th?ng nh?t qua `.env`. |
| Forgot password hi?n reset code demo | `Reset code: ... (Demo)` kh?ng n?n d?ng production. |
| SOS hardcode `911` | N?u tri?n khai ? Vi?t Nam c?n ??i theo y?u c?u v?n h?nh. |
| Nh?nh delivery verification | Frontend emit `DELIVERED`, c?n x?c minh backend c? t? ??i order status kh?ng. |

## 22. L?nh ki?m tra ?? ch?y

```powershell
cmd /c npx.cmd tsc --noEmit --pretty false
cmd /c npm.cmd test -- --runInBand --coverage=false
```

K?t qu? l?c vi?t t?i li?u: TypeScript pass, 4 test suites pass, 11 tests pass.
