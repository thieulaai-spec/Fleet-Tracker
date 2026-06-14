# Module Code Guide Full App

File nay la ban do tung khoi code. Doc file nay khi ban muon biet: file nay o dau, ham nao quan trong, no gan voi file nao.

## Cach Doc Bang

| Cot | Nghia |
|---|---|
| File | Duong dan file trong project |
| Ham/component chinh | Ten ham/component/export quan trong |
| De lam gi | Giai thich bang ngon ngu binh thuong |
| Gan voi | File/khoi khac ma no goi hoac duoc goi boi |

## 1. Khoi `app/`: Man Hinh Va Router

`app/` la noi Expo Router doc de tao man hinh. Moi file `.tsx` trong day gan voi mot route.

### Root va Login

| File | Ham/component chinh | De lam gi | Gan voi |
|---|---|---|---|
| `app/_layout.tsx` | `RootLayout`, `RootLayoutNav` | Layout goc, nap font, guard login, ket noi socket global, hien Toast | `useAuthStore`, `useTripStore`, `socketService`, `NetworkBanner` |
| `app/login.tsx` | `LoginScreen` | Man dang nhap va quen mat khau | `useAuthFlow`, `LoginForm`, `ForgotPassFlow` |
| `app/+html.tsx` | `Root` | HTML wrapper khi chay web | Expo web |
| `app/+not-found.tsx` | `NotFoundScreen` | Man 404 khi route khong ton tai | Expo Router |
| `app/modal.tsx` | `ModalScreen` | Modal mau / placeholder | Expo Router |

### Tabs Role Driver/Admin

| File | Ham/component chinh | De lam gi | Gan voi |
|---|---|---|---|
| `app/(tabs)/_layout.tsx` | `TabLayout` | Dinh nghia tab bar, an/hien tab theo role | `useAuthStore` |
| `app/(tabs)/index.tsx` | `TripsScreen` | Man driver xem active/pending trips | `useTripStore`, `TripCard`, `ConnectionStatus` |
| `app/(tabs)/map.tsx` | `ActiveTripMap` | Man ban do trip dang chay | `useMapFlow`, `MapComponents`, `MissionPanel`, `VerificationModal` |
| `app/(tabs)/history.tsx` | `TripHistoryTab` | Lich su trip cua driver, filter ngay | `useTripStore`, `TripCard` |
| `app/(tabs)/profile.tsx` | `ProfileScreen` | Ho so, status online/offline, doi mat khau, KPI | `useProfileFlow`, profile components |
| `app/(tabs)/admin-dashboard.tsx` | `AdminDashboardScreen` | KPI tong quan admin va activity realtime | `useAdminDashboard`, dashboard components |
| `app/(tabs)/admin-tracking.tsx` | `AdminTrackingScreen` | Ban do theo doi xe realtime cho admin | `useFleetTrackingStore`, `FleetMarker`, tracking components |
| `app/(tabs)/admin-orders.tsx` | `AdminOrdersScreen` | Danh sach order, filter, search, tao order | `useOrderStore`, order components |
| `app/(tabs)/admin-fleet.tsx` | `AdminFleetScreen` | Danh sach driver/vehicle, search, xoa van tay | `useFleetStore`, fleet components |

### Driver Detail Screens

| File | Ham/component chinh | De lam gi | Gan voi |
|---|---|---|---|
| `app/trip/[id].tsx` | `TripDetails` | Chi tiet 1 trip, accept/reject/update order/trip, xem proof | `useTripStore`, `OrderCard`, `TripActions` |
| `app/camera.tsx` | `CameraScreen` | Chup anh proof delivery va upload | `expo-camera`, `authFetch`, `/upload?folder=orders` |
| `app/signature.tsx` | `SignatureCapture` | Ky ten khach, upload signature, update order delivered | `react-native-signature-canvas`, `useTripStore`, `authFetch` |

### Admin Detail Screens

| File | Ham/component chinh | De lam gi | Gan voi |
|---|---|---|---|
| `app/admin/_layout.tsx` | `AdminLayout` | Stack layout cho admin nested routes | Expo Router |
| `app/admin/dispatch/index.tsx` | `DispatchCenterScreen` | Chon pending order, lay suggest xe, assign xe | `useOrderStore`, `useFleetStore`, dispatch components |
| `app/admin/orders/create.tsx` | `CreateOrderScreen` | Tao order moi | `OrderForm`, `useOrderStore` |
| `app/admin/orders/[id].tsx` | `OrderDetailScreen` | Chi tiet/sua/xoa/huy/assign order | `useOrderStore`, `useFleetStore`, order detail components |
| `app/admin/fleet/drivers/[id].tsx` | `DriverDetailScreen` | Chi tiet driver, sua/xoa, van tay, KPI, journey | `useFleetStore`, driver components |
| `app/admin/fleet/vehicles/[id].tsx` | `VehicleDetailScreen` | Chi tiet vehicle, sua/xoa | `useFleetStore`, vehicle components |
| `app/admin/trips.tsx` | `AdminTripsScreen` | Lich su trip cho admin | `authFetch`, `AdminTripCard` |
| `app/admin/reports/index.tsx` | `ReportsOverviewScreen` | Hub report | report screens |
| `app/admin/reports/drivers.tsx` | `DriverLeaderboardScreen` | Bang xep hang KPI driver | `useReportStore` |
| `app/admin/reports/fuel.tsx` | `FuelReportScreen` | Bao cao chi phi nhien lieu | `useReportStore` |
| `app/admin/reports/trips.tsx` | `TripReportsScreen` | Bao cao trip/performance | `useReportStore` |
| `app/admin/reports/utilization.tsx` | `UtilizationReportScreen` | Bao cao su dung xe | `useReportStore` |

## 2. Khoi `store/`: Bo Nho Va API Actions

### `store/useAuthStore.ts`

| Phan | De lam gi |
|---|---|
| `User` interface | Hinh dang du lieu user dang login |
| `AuthState` interface | State gom user, token, refreshToken, isAuthenticated va 4 actions |
| `persistentStorage` | Native dung SecureStore, web dung AsyncStorage |
| `useAuthStore` | Store dang nhap, duoc persist voi key `auth-storage` |

Action:

| Action | Input | Ket qua |
|---|---|---|
| `setAuth` | user, token, refreshToken | App coi nhu da dang nhap |
| `updateUser` | partial user | Merge vao user hien tai |
| `updateTokens` | token moi | Thay token cu |
| `logout` | khong | Xoa session |

### `store/useTripStore.ts`

| Phan | De lam gi |
|---|---|
| `transformTripData(t)` | Bien data backend thanh data frontend de map/UI doc duoc |
| `useTripStore` | Luu `activeTrip`, `pendingTrips`, `tripHistory`, `isSocketConnected` |

Action quan trong:

| Action | Goi API | Ghi chu |
|---|---|---|
| `fetchTrips(filters)` | `GET /trips/my` | Chia trip thanh active/pending/history |
| `acceptTrip(id)` | qua `updateTripStatus` | Set accepted |
| `rejectTrip(id)` | qua `updateTripStatus` | Set cancelled |
| `updateTripStatus(id,status)` | `PATCH /trips/:id/status` | Sau do fetchTrips lai |
| `updateOrderStatus(id,status,options)` | `PATCH /orders/:id/status` | Dung cho pickup/delivery/signature |
| `submitOrderVerification(orderId,data)` | `POST /orders/:id/verifications` | Gui proof |
| `updateCargoPhoto(orderId,step,url)` | `PATCH /orders/:id/verifications/:step/cargo-photo` | Dung khi hardware da tao verification truoc |
| `fetchTripDetails(id)` | `GET /trips/:id`, `/trips/:id/verifications` | Man trip detail |

Gan voi:

| Goi boi | Ly do |
|---|---|
| `app/(tabs)/index.tsx` | Hien trips driver |
| `app/(tabs)/map.tsx` qua `useMapFlow` | Hien active trip tren map |
| `app/trip/[id].tsx` | Chi tiet trip |
| `app/signature.tsx` | Complete order bang chu ky |
| `components/trip/verification/useVerification.ts` | Refresh trip va update proof |

### `store/useOrderStore.ts`

| Action | Goi API | De lam gi |
|---|---|---|
| `fetchOrders(params)` | `GET /orders` | Lay orders cho admin |
| `createOrder(orderData)` | `POST /orders` | Tao order, map toa do sang DTO backend |
| `updateOrder(id,orderData)` | `PATCH /orders/:id` hoac `/orders/:id/status` | Sua order/status |
| `deleteOrder(id)` | `DELETE /orders/:id` | Xoa order |
| `assignOrder(orderId,vehicleId,driverId)` | `POST /dispatch/assign` | Gan order vao vehicle |
| `getOrderById(id)` | local | Tim trong store |
| `fetchOrderById(id)` | `GET /orders/:id` | Lay chi tiet order |

Gan voi:

| Goi boi | Ly do |
|---|---|
| `app/(tabs)/admin-orders.tsx` | List/filter orders |
| `app/admin/orders/create.tsx` | Tao order |
| `app/admin/orders/[id].tsx` | Detail/update/delete/assign order |
| `app/admin/dispatch/index.tsx` | Assign order trong dispatch center |

### `store/useFleetStore.ts`

| Nhom | Action | De lam gi |
|---|---|---|
| Driver | `fetchDrivers`, `createDriver`, `updateDriver`, `deleteDriver` | CRUD tai xe |
| Vehicle | `fetchVehicles`, `createVehicle`, `updateVehicle`, `deleteVehicle` | CRUD xe |
| Dispatch | `fetchSuggestions(orderId)` | Lay goi y xe phu hop cho order |
| Fingerprint | `clearFingerprint`, `clearAllFingerprints` | Xoa van tay DB/hardware |
| Assignment | `assignDriverToVehicle` | Gan tai xe vao xe |

Gan voi:

| Goi boi | Ly do |
|---|---|
| `app/(tabs)/admin-fleet.tsx` | Quan ly driver/vehicle |
| `app/admin/fleet/drivers/[id].tsx` | Driver detail |
| `app/admin/fleet/vehicles/[id].tsx` | Vehicle detail |
| `app/admin/dispatch/index.tsx` | Lay vehicles va suggestions |
| `app/admin/orders/[id].tsx` | Goi y xe trong order detail |

### `store/useFleetTrackingStore.ts`

| Action | De lam gi |
|---|---|
| `fetchLiveLocations()` | Lay snapshot vi tri xe ban dau tu `/tracking/live` |
| `updateVehicleLocation(data)` | Update 1 xe trong map `vehicles[vehicleId]` |
| `startTracking()` | Dang ky socket `gps:update` |
| `stopTracking()` | Huy socket `gps:update` |

Gan voi: `app/(tabs)/admin-tracking.tsx`.

### `store/useDashboardStore.ts`

Chi co action `fetchStats()`.

No goi song song:

| API | Muc dich |
|---|---|
| `/vehicles` | Dem xe active |
| `/orders` | Dem order pending |
| `/alerts` | Dem alert chua resolve |
| `/trips` | Dem total trips |

Gan voi: `hooks/admin/useAdminDashboard.ts` va `app/(tabs)/admin-dashboard.tsx`.

### `store/useReportStore.ts`

| Action | API | Man hinh dung |
|---|---|---|
| `fetchFleetPerformance(params)` | `/reports/fleet-performance` | trip reports |
| `fetchDriverKPIs()` | `/reports/kpi-leaderboard` | driver leaderboard |
| `fetchVehicleUtilization(params)` | `/reports/vehicle-utilization` | utilization report |
| `fetchFuelCost(params)` | `/reports/fuel-cost` | fuel report |

## 3. Khoi `lib/`: Ha Tang

| File | Ham/class | De lam gi | Gan voi |
|---|---|---|---|
| `lib/authFetch.ts` | `authFetch`, `refreshAccessToken` | Goi API kem token va tu refresh khi 401 | Stores/hooks dung API |
| `lib/socket.ts` | `socketService` | Quan ly socket realtime, reconnect, listener, offline sync | Layout, tracking, map, dashboard |
| `lib/offlineQueue.ts` | `offlineQueue` | Luu GPS points khi offline va sync lai | `socketService` |
| `lib/backgroundTasks.ts` | `startBackgroundLocation`, `stopBackgroundLocation` | Background location task, hien dang bypass upload GPS | Chua thay goi truc tiep trong app flow hien tai |

## 4. Khoi `hooks/`: Logic Dieu Khien

### Auth/Admin/Profile Hooks

| File | Hook | De lam gi | Gan voi |
|---|---|---|---|
| `hooks/auth/useAuthFlow.ts` | `useAuthFlow` | Login, forgot password, reset password | `app/login.tsx` |
| `hooks/admin/useAdminDashboard.ts` | `useAdminDashboard` | Fetch KPI, build activity timeline, nghe socket alert/trip/order | `admin-dashboard.tsx` |
| `hooks/profile/useProfileFlow.ts` | `useProfileFlow` | Ho so user, online/offline status, KPI, alerts, logout | `profile.tsx` |
| `hooks/profile/useAvatarUpload.ts` | `useAvatarUpload` | Chon anh, upload avatar, update profile | `useProfileFlow` |
| `hooks/profile/usePasswordChange.ts` | `usePasswordChange` | Doi mat khau | `useProfileFlow` |
| `hooks/profile/useProfileStats.ts` | `useProfileStats` | Tinh completed trips, total distance, avg speed | `useProfileFlow` |

### Map/Trip Hooks

| File | Hook | De lam gi | Gan voi |
|---|---|---|---|
| `hooks/map/useMapFlow.ts` | `useMapFlow` | Gom tat ca logic cua map driver | `app/(tabs)/map.tsx` |
| `hooks/map/useHardwareLocation.ts` | `useHardwareLocation` | Subscribe trip room va nghe `trip:location` tu hardware | `useMapFlow` |
| `hooks/map/useMapRoute.ts` | `useMapRoute` | Goi OSRM lay duong di live | `useMapFlow`, `utils/getRoute` |
| `hooks/map/useMapCamera.ts` | `useMapCamera` | Auto center, following, nav mode, fit route | `useMapFlow` |
| `hooks/map/useTripActions.ts` | `useTripActions` | Nut start/pickup/delivery/checkpoint/complete, geofence, verification | `useMapFlow` |
| `hooks/useLocationTracking.ts` | `useLocationTracking` | Lay location dien thoai local, bypass upload GPS | `useMapFlow` |
| `hooks/useGeofencing.ts` | `useGeofencing` | Kiem tra trong ban kinh 200m | `signature.tsx`, logic delivery |
| `hooks/useCountdown.ts` | `useCountdown` | Dem nguoc deadline | order cards |

## 5. Khoi `components/`: UI Nho Tai Su Dung

### Auth Components

| File | Component | De lam gi |
|---|---|---|
| `components/auth/AuthUI.tsx` | `AuthBackground`, `AuthInput`, `AuthButton` | UI nen/input/button login |
| `components/auth/LoginHeader.tsx` | `LoginHeader` | Header man login/forgot |
| `components/auth/LoginForm.tsx` | `LoginForm` | Form email/password |
| `components/auth/ForgotPassFlow.tsx` | `ForgotPassFlow` | UI quen mat khau theo stage email/code/password |

### Map Components

| File | Component | De lam gi |
|---|---|---|
| `components/map/MapComponents.tsx` | `MapComponent`, `MarkerComponent`, `PolylineComponent` | Alias native map components |
| `components/map/MapComponents.web.tsx` | web mock map components | Gia lap map tren web |
| `components/map/FleetMarker.tsx` | `FleetMarker` | Marker xe tren admin tracking map |
| `components/map/MapControls.tsx` | `MapControls` | Nut doi map type, center, zoom destination |
| `components/map/MissionDashboard.tsx` | `MissionDashboard` | Card tren cung map driver: ETA, distance, status |
| `components/map/MissionPanel.tsx` | `MissionPanel` | Panel duoi map driver: order hien tai, action, SOS |
| `components/map/TripRoutePath.tsx` | `TripRoutePath` | UI origin/destination path |
| `components/map/mission-panel/ActionButton.tsx` | `ActionButton` | Quyet dinh nut chinh: lay hang/giao hang/complete |
| `components/map/mission-panel/OrderDetailsSection.tsx` | `OrderDetailsSection` | Hien customer/order detail va modal chon order |
| `components/map/mission-panel/OrderSelectModal.tsx` | `OrderSelectModal` | Chon order nao trong multi-order trip |

### Trip Components

| File | Component | De lam gi |
|---|---|---|
| `components/trip/TripCard.tsx` | `TripCard` | Card trip trong list |
| `components/trip/TripBadge.tsx` | `TripBadge`, `getStatusColors` | Badge status trip |
| `components/trip/TripActions.tsx` | `TripActions` | Nut accept/reject/start/complete trong detail |
| `components/trip/TripHeader.tsx` | `TripHeader` | Header trip detail |
| `components/trip/TripTimeline.tsx` | `TripTimeline` | Timeline status trip |
| `components/trip/TripSummaryCard.tsx` | `TripSummaryCard` | Tong ket km/fuel |
| `components/trip/TripSectionHeader.tsx` | `TripSectionHeader` | Header section active/pending |
| `components/trip/OrderCard.tsx` | `OrderCard` | Card order trong trip |
| `components/trip/OrderDetails.tsx` | `OrderDetails` | Chi tiet order |
| `components/trip/OrderProofDetails.tsx` | `OrderProofDetails` | Xem proof cua order |
| `components/trip/EmptyTrips.tsx` | `EmptyTrips` | Trang thai khong co trip |
| `components/trip/NoActiveTrip.tsx` | `NoActiveTrip` | Man map khi chua co active trip |
| `components/trip/VerificationModal.tsx` | `VerificationModal` | Modal verify pickup/delivery/checkpoint/accept |

### Verification Components

| File | Component/Hook | De lam gi |
|---|---|---|
| `components/trip/verification/useVerification.ts` | `useVerification` | Brain cua verification modal |
| `components/trip/verification/StepperProgress.tsx` | `StepperProgress` | Thanh buoc verify |
| `components/trip/verification/FingerprintStep.tsx` | `FingerprintStep` | UI bam giu van tay gia lap/kich hoat |
| `components/trip/verification/FaceCaptureStep.tsx` | `FaceCaptureStep` | Hien anh mat tai xe |
| `components/trip/verification/CargoCaptureStep.tsx` | `CargoCaptureStep` | Chup/them/xoa anh hang hoa |
| `components/trip/verification/HardwareStep.tsx` | `HardwareStep` | Man doi thiet bi xe verify |
| `components/trip/verification/SubmitProofStep.tsx` | `SubmitProofStep` | Man review va submit proof |

### Admin Dashboard Components

| File | Component | De lam gi |
|---|---|---|
| `components/admin/dashboard/StatCard.tsx` | `StatCard` | O KPI tren dashboard |
| `components/admin/dashboard/ActivityLogsModal.tsx` | `ActivityLogsModal` | Modal xem tat ca activity |
| `components/admin/dashboard/KpiDetailModal.tsx` | `KpiDetailModal` | Modal chi tiet KPI |
| `components/admin/dashboard/ReportCard.tsx` | `ReportCard` | Card link report |
| `components/admin/dashboard/ExportButton.tsx` | `ExportButton` | Goi API export report |

### Admin Dispatch Components

| File | Component | De lam gi |
|---|---|---|
| `app/admin/dispatch/components/DispatchHeader.tsx` | `DispatchHeader` | Header dispatch center |
| `app/admin/dispatch/components/OrdersSection.tsx` | `OrdersSection` | List pending orders de chon |
| `app/admin/dispatch/components/SmartDispatchBanner.tsx` | `SmartDispatchBanner` | Banner hien dang lay goi y/suggest count |
| `app/admin/dispatch/components/VehiclesSection.tsx` | `VehiclesSection` | List xe suggested va xe con lai |
| `app/admin/dispatch/components/ConfirmDispatchButton.tsx` | `ConfirmDispatchButton` | Nut confirm assign |
| `components/admin/dispatch/VehicleDispatchItem.tsx` | `VehicleDispatchItem` | UI 1 xe trong danh sach assign |
| `components/admin/dispatch/AssignedTripCard.tsx` | `AssignedTripCard` | Hien trip da assign cua order |

### Admin Fleet Components

| File | Component | De lam gi |
|---|---|---|
| `components/admin/fleet/FleetHeader.tsx` | `FleetHeader` | Header fleet, add/settings/clear fingerprint |
| `components/admin/fleet/FleetTabs.tsx` | `FleetTabs` | Doi tab drivers/vehicles |
| `components/admin/fleet/DriverCard.tsx` | `DriverCard` | Card tai xe trong list |
| `components/admin/fleet/VehicleCard.tsx` | `VehicleCard` | Card xe trong list |
| `components/admin/fleet/DriverForm.tsx` | `DriverForm` | Form tao/sua tai xe |
| `components/admin/fleet/VehicleForm.tsx` | `VehicleForm` | Form tao/sua xe, upload anh xe |
| `components/admin/fleet/DriverHeader.tsx` | `DriverHeader` | Header detail tai xe |
| `components/admin/fleet/DriverProfileCard.tsx` | `DriverProfileCard` | Card profile tai xe |
| `components/admin/fleet/FingerprintStatusCard.tsx` | `FingerprintStatusCard` | Trang thai van tay va nut xoa |
| `components/admin/fleet/DriverContact.tsx` | `DriverContact` | Thong tin lien he tai xe |
| `components/admin/fleet/DriverLicense.tsx` | `DriverLicense` | Thong tin bang lai |
| `components/admin/fleet/DriverKpi.tsx` | `DriverKpi` | KPI tai xe |
| `components/admin/fleet/DriverKpiChart.tsx` | `DriverKpiChart` | Bieu do KPI |
| `components/admin/fleet/DriverDetailTabs.tsx` | `DriverDetailTabs` | Tab info/journey |
| `components/admin/fleet/DriverJourneyTimeline.tsx` | `DriverJourneyTimeline` | Timeline proof/verification driver |
| `components/admin/fleet/VehicleSpecs.tsx` | `VehicleSpecs` | Thong so xe |
| `components/admin/fleet/VehicleDriver.tsx` | `VehicleDriver` | Tai xe dang gan voi xe |
| `components/admin/fleet/VehicleHealth.tsx` | `VehicleHealth` | Placeholder suc khoe xe |
| `components/admin/fleet/VehicleJourneyTimeline.tsx` | `VehicleJourneyTimeline` | Timeline xe |
| `components/admin/fleet/vehicle-form/*` | subcomponents | Tach nho form xe: basic info, image, status, type, driver assigner |

### Admin Order Components

| File | Component | De lam gi |
|---|---|---|
| `components/admin/order/OrderForm.tsx` | `OrderForm` | Form tao/sua order |
| `components/admin/order/MapPicker.tsx` | `MapPicker` | Chon dia diem tren map, search Mapbox/OSM/toa do |
| `components/admin/order/AddressAutocomplete.tsx` | `AddressAutocomplete` | Goi Mapbox search dia chi |
| `components/admin/order/OrderCardItem.tsx` | `OrderCardItem` | Card order trong list admin |
| `components/admin/order/OrderFilterPills.tsx` | `OrderFilterPills` | Filter status order |
| `components/admin/order/OrderDateFilter.tsx` | `OrderDateFilter` | Filter ngay order |
| `components/admin/order/OrderDetailHeader.tsx` | `OrderDetailHeader` | Header order detail |
| `components/admin/order/OrderDetailMap.tsx` | `OrderDetailMap` | Map pickup/delivery trong order detail |
| `components/admin/order/OrderDetailInfo.tsx` | `OrderDetailInfo` | Thong tin order va verification |
| `components/admin/order/OrderDispatchItem.tsx` | `OrderDispatchItem` | Item order de dispatch |
| `components/admin/order/order-form/*` | form sections | Tach form order: location, cargo, recipient, deadline, category |

### Admin Tracking Components

| File | Component | De lam gi |
|---|---|---|
| `components/admin/tracking/TrackingHeader.tsx` | `TrackingHeader` | Header/search/list xe tracking |
| `components/admin/tracking/SelectedVehicleCard.tsx` | `SelectedVehicleCard` | Card xe duoc chon, thong tin driver, trip order, call/detail |
| `components/admin/tracking/ProofDetailsModal.tsx` | `ProofDetailsModal` | Modal xem verification/proof theo order |
| `components/admin/tracking/LightboxModal.tsx` | `LightboxModal` | Xem anh proof toan man hinh |
| `components/admin/tracking/trackingUtils.ts` | `formatTime`, `normalizePlate`, `getStatusColor` | Ham tien ich tracking |

### Profile Components

| File | Component | De lam gi |
|---|---|---|
| `components/profile/ProfileHeader.tsx` | `ProfileHeader` | Header profile + avatar |
| `components/profile/ProfileStats.tsx` | `ProfileStats` | KPI card cua driver |
| `components/profile/AccountInfo.tsx` | `AccountInfo` | Thong tin tai khoan |
| `components/profile/SettingsSection.tsx` | `SettingsSection` | Duty status, security |
| `components/profile/PasswordModal.tsx` | `PasswordModal` | Modal doi mat khau |
| `components/profile/DriverKpiModal.tsx` | `DriverKpiModal` | Modal chi tiet KPI |
| `components/profile/MissionHistory.tsx` | `MissionHistory` | Lich su mission trong profile |

### UI Components Chung

| File | Component | De lam gi |
|---|---|---|
| `components/ui/ConnectionStatus.tsx` | `ConnectionStatus` | Hien socket online/offline |
| `components/ui/NetworkBanner.tsx` | `NetworkBanner` | Banner mat mang |
| `components/ui/SosButton.tsx` | `SosButton` | Nut SOS gui incident |
| `components/ui/ExpandableToast.tsx` | `toastConfig` | Toast co the mo rong |
| `components/ui/StatCard.tsx` | `StatCard` | Card statistic chung |
| `components/ui/ProfileInfoItem.tsx` | `ProfileInfoItem` | Row info profile |
| `components/ui/SettingsItem.tsx` | `SettingsItem` | Row setting |
| `components/ui/StyledText.tsx` | `MonoText` | Text monospace mau Expo |
| `components/ui/Themed.tsx` | `Text`, `View`, `useThemeColor` | Themed components mau Expo |

## 6. Khoi `utils/` Va `types/`

| File | Ham/type | De lam gi | Ai dung |
|---|---|---|---|
| `types/trip.ts` | `TripStatus`, `OrderStatus`, `Order`, `Trip` | Dinh nghia data trip/order | Stores, hooks, components |
| `utils/geo.ts` | `parsePoint` | Doc toa do GeoJSON/WKT/WKB/direct object | Trip/fleet tracking |
| `utils/geo.ts` | `parseLineString` | Doc route GeoJSON LineString | Trip route |
| `utils/geo.ts` | `getRoute` | Goi OSRM lay duong di | `useMapRoute` |
| `utils/geo.ts` | `calculateDistance` | Tinh khoang cach bang Haversine | Geofence pickup/delivery |
| `utils/error.ts` | `formatError` | Bien loi backend/network thanh message de hieu | Stores/hooks |
| `utils/error.ts` | `getFetchErrorMessage` | Doc response loi fetch | `authFetch` callers |
| `utils/order.ts` | `getCategoryLabel` | Ten hang hoa | Order UI |
| `utils/order.ts` | `getPriorityLabel` | Ten muc uu tien | Order UI |
| `utils/order.ts` | `getPriorityColor` | Mau priority | Order UI |
| `utils/order.ts` | `formatCountdown` | Dem nguoc deadline | Order cards |

## 7. Khoi Test

| File | Test cai gi |
|---|---|
| `__tests__/FleetMarker.test.tsx` | FleetMarker render, mau status, rotation heading |
| `__tests__/geo.test.ts` | parsePoint doc GeoJSON, lat/lng object, WKT, WKB, invalid |
| `__tests__/smoke.test.tsx` | React Native render basic |
| `components/__tests__/StyledText-test.js` | Snapshot StyledText mau Expo |

## 8. Cac Chuoi Gan Ket Quan Trong

### Man login gan voi store auth

```text
LoginScreen
  -> useAuthFlow.handleLogin()
  -> POST /auth/login
  -> useAuthStore.setAuth(user, accessToken, refreshToken)
  -> router.replace('/(tabs)')
```

### Man map gan voi trip/action/verification

```text
ActiveTripMap
  -> useMapFlow
      -> useTripStore.activeTrip
      -> useHardwareLocation
      -> useMapRoute
      -> useMapCamera
      -> useTripActions
  -> MissionDashboard hien data
  -> MissionPanel hien nut action
  -> VerificationModal hien khi can proof
```

### Verification gan voi backend va hardware

```text
VerificationModal
  -> useVerification
      -> neu co hardware: POST /tracking/active-order
      -> nghe socket order:verified
      -> polling GET /orders/:id/verifications
      -> upload cargo photo /upload?folder=orders
      -> submit proof hoac update cargo photo
```

### Admin dispatch gan voi backend suggest

```text
DispatchCenterScreen
  -> useOrderStore.fetchOrders({status: pending})
  -> useFleetStore.fetchVehicles()
  -> useFleetStore.fetchSuggestions(orderId)
  -> useOrderStore.assignOrder(orderId, vehicleId, driverId)
```

### Admin tracking gan voi socket GPS

```text
AdminTrackingScreen
  -> useFleetTrackingStore.fetchLiveLocations()
  -> useFleetTrackingStore.startTracking()
  -> socket gps:update
  -> updateVehicleLocation()
  -> FleetMarker rerender tren map
```
