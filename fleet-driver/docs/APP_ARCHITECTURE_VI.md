# Kien Truc App Va Cach Cac Khoi Gan Voi Nhau

File nay giai thich app theo lop. Neu ban khong biet code, hay doc nhu mot so do van hanh.

## 1. Cong Nghe Chinh

| Cong nghe | Dung de lam gi |
|---|---|
| Expo / React Native | Lam app mobile Android/iOS va web dev preview |
| Expo Router | Bien file trong `app/` thanh duong man hinh |
| Zustand | Luu bo nho app: user, trip, order, fleet |
| Fetch/Axios | Goi API backend |
| Socket.io client | Nhan realtime: vi tri xe, trip moi, canh bao, van tay |
| Expo Location / Task Manager | Lay vi tri dien thoai va background task |
| React Native Maps | Ban do mobile |
| NativeWind/Tailwind | Viet style UI bang className |
| Jest | Test |

## 2. So Do Lop Tong Quat

```text
Nguoi dung bam man hinh
        |
        v
app/ screen
        |
        v
hooks/ logic dieu khien
        |
        v
store/ bo nho + action
        |
        +--> lib/authFetch.ts  --> Backend REST API
        |
        +--> lib/socket.ts     --> Backend Socket realtime
        |
        +--> utils/            --> Tinh khoang cach, parse toa do, format loi
        |
        v
components/ hien thi giao dien
```

Cach doc: man hinh trong `app/` khong nen chua qua nhieu logic. No thuong lay logic tu `hooks/` hoac `store/`, sau do dua data vao `components/` de hien thi.

## 3. Router Va Man Hinh

Expo Router dung cau truc file lam duong dan.

| File | Duong dan man hinh | Ai dung | Nhiem vu |
|---|---|---|---|
| `app/_layout.tsx` | root | Tat ca | Nap font, guard login, socket global, Toast, Stack router |
| `app/login.tsx` | `/login` | Tat ca | Dang nhap / quen mat khau |
| `app/(tabs)/_layout.tsx` | tab layout | Tat ca da login | Hien tab khac nhau theo role driver/admin |
| `app/(tabs)/index.tsx` | Driver Trips | Driver | Danh sach active/pending trip |
| `app/(tabs)/map.tsx` | Driver Map | Driver | Ban do chuyen dang chay |
| `app/(tabs)/history.tsx` | Driver History | Driver | Lich su trip |
| `app/(tabs)/profile.tsx` | Profile | Driver/Admin | Ho so, doi mat khau, trang thai duty |
| `app/trip/[id].tsx` | Trip detail | Driver/Admin | Chi tiet mot chuyen |
| `app/camera.tsx` | Camera proof | Driver | Chup anh bang chung |
| `app/signature.tsx` | Signature | Driver | Khach ky xac nhan giao hang |
| `app/(tabs)/admin-dashboard.tsx` | Admin dashboard | Admin | KPI va activity |
| `app/(tabs)/admin-tracking.tsx` | Admin tracking | Admin | Theo doi xe realtime |
| `app/(tabs)/admin-orders.tsx` | Admin orders | Admin | Quan ly don hang |
| `app/(tabs)/admin-fleet.tsx` | Admin fleet | Admin | Quan ly tai xe/xe |
| `app/admin/dispatch/index.tsx` | Dispatch center | Admin | Chon don, chon xe, assign |
| `app/admin/orders/create.tsx` | Create order | Admin | Tao don moi |
| `app/admin/orders/[id].tsx` | Order detail | Admin | Chi tiet/sua/huy/assign don |
| `app/admin/fleet/drivers/[id].tsx` | Driver detail | Admin | Chi tiet/sua/xoa tai xe, van tay, KPI |
| `app/admin/fleet/vehicles/[id].tsx` | Vehicle detail | Admin | Chi tiet/sua/xoa xe |
| `app/admin/reports/*.tsx` | Reports | Admin | Bao cao KPI, fuel, trip, utilization |
| `app/admin/trips.tsx` | Admin trip history | Admin | Lich su trip admin |

## 4. Role Guard: Driver Va Admin Tach Nhau Nhu The Nao

File `app/(tabs)/_layout.tsx` doc role cua user:

```text
Neu user.role la ADMIN:
  hien tab admin-dashboard, admin-tracking, admin-orders, admin-fleet, profile
  an tab index/map/history cua driver

Neu user.role la driver:
  hien tab index/map/history/profile
  an tab admin
```

File `app/_layout.tsx` lam guard dang nhap:

```text
Neu chua authenticated va khong o login:
  router.replace('/login')

Neu da authenticated ma dang o login:
  router.replace('/(tabs)')
```

## 5. Store La Bo Nho App

App co 7 store chinh.

| Store | So action chinh | Luu cai gi | Goi API nao |
|---|---:|---|---|
| `useAuthStore` | 4 | user, token, refreshToken, isAuthenticated | Khong goi API truc tiep |
| `useDashboardStore` | 1 | KPI dashboard, vehicles, orders, alerts, trips | `/vehicles`, `/orders`, `/alerts`, `/trips` |
| `useFleetStore` | 12 | drivers, vehicles, suggestions | `/drivers`, `/vehicles`, `/dispatch/suggest`, fingerprint endpoints |
| `useFleetTrackingStore` | 4 | vehicles realtime tren map admin | `/tracking/live`, socket `gps:update` |
| `useOrderStore` | 7 | danh sach orders, create/update/delete/assign | `/orders`, `/dispatch/assign` |
| `useReportStore` | 4 | report data | `/reports/*` |
| `useTripStore` | 10 | activeTrip, pendingTrips, tripHistory, socket status | `/trips/my`, `/trips/:id/status`, `/orders/:id/status`, verification endpoints |

## 6. Chi Tiet Store Actions

### `useAuthStore`

| Action | De lam gi |
|---|---|
| `setAuth(user, token, refreshToken)` | Luu user/token sau login |
| `updateUser(partialUser)` | Cap nhat mot phan user, vi du avatar/fingerprint |
| `updateTokens(token, refreshToken)` | Cap nhat token sau refresh |
| `logout()` | Xoa user/token va ve trang thai chua dang nhap |

### `useTripStore`

| Action | De lam gi |
|---|---|
| `setActiveTrip(trip)` | Gan trip dang chay vao bo nho |
| `setSocketConnected(connected)` | Luu trang thai socket online/offline |
| `fetchTrips(filters?)` | Goi `/trips/my`, chia thanh active/pending/history |
| `acceptTrip(id)` | Doi trip sang `accepted` |
| `rejectTrip(id)` | Doi trip sang `cancelled` |
| `updateTripStatus(id, status)` | PATCH status cua trip |
| `updateOrderStatus(id, status, options?)` | PATCH status cua order, kem anh/chu ky/toa do neu co |
| `submitOrderVerification(orderId, data)` | Gui bang chung verification |
| `updateCargoPhoto(orderId, step, cargoPhotoUrl)` | Cap nhat anh hang hoa cho verification da tao tu hardware |
| `fetchTripDetails(id)` | Lay trip detail va verifications |

### `useOrderStore`

| Action | De lam gi |
|---|---|
| `fetchOrders(params?)` | Lay danh sach don |
| `createOrder(orderData)` | Tao don moi, bien toa do thanh pickupLat/pickupLng |
| `updateOrder(id, orderData)` | Sua don hoac sua status |
| `deleteOrder(id)` | Xoa don |
| `assignOrder(orderId, vehicleId, driverId)` | Goi `/dispatch/assign`, backend chi can orderId + vehicleId |
| `getOrderById(id)` | Tim order trong bo nho hien tai |
| `fetchOrderById(id)` | Lay chi tiet order tu backend |

### `useFleetStore`

| Action | De lam gi |
|---|---|
| `fetchDrivers()` | Lay danh sach tai xe |
| `fetchVehicles()` | Lay danh sach xe |
| `fetchSuggestions(orderId)` | Lay goi y dieu phoi tu backend |
| `createDriver(data)` | Tao tai xe |
| `createVehicle(data)` | Tao xe |
| `updateDriver(id, data)` | Sua tai xe |
| `updateVehicle(id, data)` | Sua xe |
| `deleteDriver(id)` | Xoa tai xe |
| `deleteVehicle(id)` | Xoa xe |
| `clearFingerprint(id)` | Xoa van tay cua 1 tai xe |
| `clearAllFingerprints()` | Xoa toan bo van tay |
| `assignDriverToVehicle(driverId, vehicleId)` | Gan tai xe vao xe |

## 7. API Auth: `lib/authFetch.ts`

`authFetch(endpoint, options)` la cong goi API an toan:

```text
1. Lay token tu useAuthStore.
2. Gan header Authorization: Bearer token.
3. Goi API.
4. Neu response khong phai 401 thi tra ve response.
5. Neu bi 401, goi refreshAccessToken().
6. Neu refresh thanh cong, goi lai request ban dau voi token moi.
7. Neu refresh fail, logout.
```

`refreshInFlight` dam bao neu nhieu request cung het han token, app chi refresh token mot lan, cac request khac cho ket qua do.

## 8. Socket Realtime: `lib/socket.ts`

Socket ket noi vao namespace:

```text
${EXPO_PUBLIC_SOCKET_URL}/tracking
```

Class `SocketService` co cac ham chinh:

| Ham | De lam gi |
|---|---|
| `connect()` | Tao socket neu co token, reconnect neu mat mang |
| `setupInternalHandlers()` | Lang nghe connect/disconnect/connect_error/reconnect |
| `on(event, callback)` | Dang ky lang nghe event va ghi nho listener de reconnect gan lai |
| `off(event, callback)` | Go listener |
| `emit(event, data)` | Gui event. Neu `gps:update` ma offline thi dua vao offlineQueue |
| `disconnect()` | Ngat socket khi logout |
| `sendSosAlert(...)` | Gui SOS qua socket, hien co fallback ack timeout |
| `syncOfflineData()` | Gui lai GPS points bi queue theo chunk 20 diem |
| `getSocket()` | Lay object socket hien tai |

## 9. Socket Events

### App dang nghe

| Event | File | Y nghia |
|---|---|---|
| `trip:assigned` | `app/_layout.tsx` | Co trip moi gan cho driver |
| `trip:cancelled` | `app/_layout.tsx` | Trip bi huy boi dispatcher |
| `enroll:required` | `app/_layout.tsx` | Can dang ky van tay |
| `enroll:result` | `app/_layout.tsx` | Ket qua dang ky van tay |
| `fingerprint:deleted` | `app/_layout.tsx` | Ket qua xoa van tay 1 tai xe |
| `fingerprint:all_cleared` | `app/_layout.tsx` | Ket qua xoa toan bo van tay |
| `alert:new` | `hooks/admin/useAdminDashboard.ts` | Canh bao moi |
| `trip:status-changed` | `hooks/admin/useAdminDashboard.ts` | Trip doi trang thai |
| `order:verified` | `hooks/admin/useAdminDashboard.ts`, `useVerification.ts` | Don da verify bang hardware/backend |
| `trip:location` | `hooks/map/useHardwareLocation.ts` | Vi tri xe trong trip tu hardware |
| `gps:update` | `store/useFleetTrackingStore.ts` | Vi tri xe realtime cho admin tracking |

### App dang gui

| Event | File | Y nghia |
|---|---|---|
| `subscribe:trip` | `useHardwareLocation.ts` | Vao room cua trip de nghe vi tri xe |
| `trip:status_change` | `useTripActions.ts` | Bao server/client khac trip doi status |
| `order:status_change` | `useTripActions.ts` | Bao order doi status |
| `gps:update` | `useLocationTracking.ts`, `backgroundTasks.ts` | Da comment bypass trong IoT strict mode |
| `gps:batch_update` | `socket.ts` | Dong bo GPS offline queue |
| `sos:alert` | `socket.ts` | Gui canh bao khan cap qua socket |

## 10. Driver Mission Flow Chi Tiet

```text
Driver vao Trips Screen
  -> app/(tabs)/index.tsx
  -> useTripStore.fetchTrips()
  -> Backend /trips/my
  -> store chia ket qua thanh activeTrip, pendingTrips, tripHistory

Driver bam Accept
  -> acceptTrip(id)
  -> updateTripStatus(id, accepted)
  -> fetchTrips lai
  -> router sang /(tabs)/map

Driver vao Map
  -> app/(tabs)/map.tsx
  -> useMapFlow()
  -> useHardwareLocation() nghe socket trip:location
  -> useMapRoute() tinh duong OSRM
  -> useMapCamera() dieu khien camera map
  -> useTripActions() xu ly nut lay/giao/checkpoint/complete
```

## 11. Pickup/Delivery Verification Flow

```text
Driver bam lay hang/giao hang
  -> useTripActions kiem tra co location khong
  -> calculateDistance() tinh khoang cach den pickup/delivery
  -> Neu > 200m: chan va bao loi
  -> Neu <= 200m: mo VerificationModal

VerificationModal
  -> useVerification reset state
  -> Neu co hardware: goi /tracking/active-order va doi hardware verify
  -> Lang nghe socket order:verified
  -> Dong thoi polling /orders/:id/verifications moi 3 giay
  -> Neu verify thanh cong: chuyen sang buoc chup anh hang hoa
  -> Upload anh hang len /upload?folder=orders
  -> Submit proof
```

## 12. Admin Dispatch Flow

```text
Admin vao Dispatch Center
  -> fetchOrders({ status: pending })
  -> fetchVehicles()
  -> Admin chon 1 order
  -> fetchSuggestions(orderId) goi /dispatch/suggest/:orderId
  -> Frontend hien xe duoc suggest + xe con lai
  -> Frontend check canh bao:
       - xe co du tai trong khong
       - bang lai tai xe het han chua
  -> Admin bam Confirm
  -> useOrderStore.assignOrder(orderId, vehicleId, driverId)
  -> Backend /dispatch/assign nhan orderId + vehicleId
```

Luu y: `driverId` duoc truyen vao action de check local, nhung payload gui backend khong gui driverId vi backend DTO khong cho phep.

## 13. Admin Tracking Flow

```text
Admin vao admin-tracking
  -> useFleetTrackingStore.fetchLiveLocations()
  -> GET /tracking/live lay snapshot ban dau
  -> startTracking() dang ky socket gps:update
  -> Moi lan co gps:update:
       updateVehicleLocation(data)
       cap nhat vehicles[vehicleId]
       map rerender marker
  -> Admin bam xe:
       fetch /trips/:tripId
       fetch /trips/:tripId/verifications
       hien order markers + proof modal
```

## 14. Environment Variables

| Bien | Dung de lam gi |
|---|---|
| `EXPO_PUBLIC_API_URL` | Base URL REST API, vi du `http://localhost:3001/api` |
| `EXPO_PUBLIC_SOCKET_URL` | Base URL socket, vi du `http://localhost:3001` |
| `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` | Token Mapbox geocoding/search dia chi |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps key cho Android config |

## 15. Cac Diem Can Can Than

| Diem | Vi sao can than |
|---|---|
| `app/trip/[id].tsx` co `fillAll:` | Gan nhu typo cua `finally`. Nen sua de code ro nghia. |
| Admin trips goi `/trips/my` | Neu admin can xem tat ca trip, endpoint nay co the sai. |
| Fallback API URL khong dong nhat | Co file dung `3000/api`, co file dung `3001/api`, co file dung `3000` khong `/api`. Nen thong nhat qua env. |
| `Reset code: ... (Demo)` | Khong nen hien reset code trong production. |
| SOS hardcode `911` | Neu deploy Viet Nam nen doi so khan cap theo yeu cau. |
| Delivery verification | Frontend emit delivered nhung can xac minh backend co tu cap nhat order status khong. |
