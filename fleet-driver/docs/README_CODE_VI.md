# Huong Dan Doc Code Fleet Driver App

Tai lieu nay duoc viet cho nguoi khong biet code. Muc tieu la giup ban hieu app nay dang lam gi, code chia thanh nhung khoi nao, moi khoi co nhiem vu gi, va cac khoi noi voi nhau nhu the nao.

## Doc Theo Thu Tu Nay

1. `README_CODE_VI.md` file nay: doc de hieu buc tranh tong quan.
2. `APP_ARCHITECTURE_VI.md`: doc de hieu brain, luong du lieu, API, socket, state.
3. `MODULE_CODE_GUIDE_VI.md`: doc de hieu tung folder, tung file chinh, tung ham/action quan trong.
4. `FUNCTION_INDEX_VI.md`: bang tra cuu nhanh tat ca file, so dong, export/function/component co trong file.

## App Nay La Gi

Day la app Expo React Native cho he thong quan ly van tai/giao hang. App co 2 nhom nguoi dung:

- Driver: tai xe nhan chuyen, xem ban do, lay hang, giao hang, gui bang chung, SOS.
- Admin: dieu phoi don, xem dashboard, xem xe tren ban do, quan ly tai xe/xe/don hang, xem bao cao.

## Cach Hieu Don Gian

Hay tuong tuong app nhu mot cong ty van tai:

- `app/` la cac phong man hinh: man login, man trip, man map, man admin.
- `components/` la cac manh giao dien nho: nut bam, card xe, modal, form.
- `hooks/` la cac bo dieu khien: bam nut thi lam gi, map di theo xe ra sao, verification chay ra sao.
- `store/` la bo nho cua app: dang dang nhap ai, trip nao dang chay, don nao dang co, xe nao dang o dau.
- `lib/` la ha tang: goi API co token, socket realtime, hang doi offline, background location.
- `utils/` la do nghe: tinh khoang cach, doc toa do, format loi.
- `types/` la dinh nghia hinh dang du lieu: trip co field nao, order co field nao.

## So Lieu Tong Quan Source

| Khoi | So file | So dong | Noi dung |
|---|---:|---:|---|
| `app/` | 34 | 5310 | Cac man hinh va router |
| `components/` | 110 | 9687 | UI component nho tai su dung |
| `hooks/` | 14 | 1593 | Logic dieu khien man hinh |
| `store/` | 7 | 1270 | State + API actions bang Zustand |
| `lib/` | 4 | 502 | API auth, socket, offline queue, background task |
| `types/` | 1 | 59 | Kieu du lieu Trip/Order |
| `utils/` | 3 | 217 | Ham tien ich |
| `__tests__/` | 3 | 159 | Test |

Tong source TypeScript/TSX da kiem tra: 176 file, 18,797 dong.

## Tu Dien Code Sieu Ngan

| Tu | Nghia de hieu |
|---|---|
| Component | Mot cuc giao dien. Vi du: card hien thi xe, nut SOS, form tao don. |
| Screen | Mot man hinh nguyen trang. Trong Expo Router, file trong `app/` thuong la screen. |
| Hook | Mot ham bat dau bang `use...`, dung de gom logic: lay data, bam nut, xu ly map. |
| Store | Bo nho dung chung cua app. App nay dung Zustand. |
| API | Duong goi len backend/server. Vi du `/trips/my`, `/orders`. |
| Socket | Ket noi realtime. Server gui vi tri xe, trip moi, canh bao ngay lap tuc. |
| Props | Du lieu truyen tu cha xuong component con. |
| State | Du lieu dang nam trong man hinh hoac store tai thoi diem hien tai. |
| Token | Ve vao cong de goi API sau khi dang nhap. |
| Refresh token | Ve du phong de xin token moi khi token cu het han. |
| Geofence | Kiem tra tai xe co o gan diem lay/giao hang hay khong. |

## Luong Nguoi Dung Driver

1. Mo app.
2. Neu chua login, app dua ve `/login`.
3. Login thanh cong, app luu user/token vao `useAuthStore`.
4. Driver vao tab Trips, app goi `fetchTrips()`.
5. Khi co trip moi, socket nhan `trip:assigned`, app hien toast va refresh trip.
6. Driver accept trip.
7. Driver vao map.
8. Map lay vi tri xe tu IoT hardware qua socket `trip:location`, khong day GPS dien thoai len server.
9. Den diem lay/giao, app dung GPS dien thoai de kiem tra trong 200m.
10. Verification mo modal: van tay, hardware/camera, anh hang hoa.
11. Gui verification len backend.
12. Khi hoan tat tat ca order, trip duoc complete.

## Luong Nguoi Dung Admin

1. Admin login.
2. App tu redirect sang Admin Dashboard.
3. Admin co the xem:
   - Dashboard KPI.
   - Tracking realtime xe.
   - Orders.
   - Fleet: tai xe, xe, van tay.
   - Dispatch: goi backend lay goi y xe phu hop va assign don.
   - Reports: KPI, fuel, utilization, trips.

## Brain Thuc Su Nam O Dau

Brain frontend nam o 5 cum file:

| Brain | File | Lam gi |
|---|---|---|
| Auth brain | `store/useAuthStore.ts`, `lib/authFetch.ts` | Luu dang nhap, token, refresh token, logout |
| Trip brain | `store/useTripStore.ts` | Lay trip, accept/reject, doi status trip/order, verification |
| Map/mission brain | `hooks/map/useMapFlow.ts`, `hooks/map/useTripActions.ts` | Chon order hien tai, chon diem den, geofence, bam action |
| Realtime brain | `lib/socket.ts`, `store/useFleetTrackingStore.ts` | Socket, reconnect, nhan GPS xe, sync offline GPS neu co |
| Verification brain | `components/trip/verification/useVerification.ts` | Van tay, hardware verification, polling fallback, upload anh hang |

## Ghi Chu Quan Trong

- Frontend khong chua thuat toan dieu phoi xe that su. Frontend goi backend `/dispatch/suggest/:orderId` de lay goi y.
- App dang theo huong IoT strict mode: vi tri tracking lay tu thiet bi tren xe, khong lay GPS dien thoai de upload server.
- GPS dien thoai van dung de kiem tra khoang cach tai thoi diem bam lay/giao hang.
- Co mot typo dang chu y trong `app/trip/[id].tsx`: `fillAll:` gan nhu chac la `finally` viet sai. TypeScript van pass vi JavaScript cho phep label, nhung nen sua.

## Lenh Kiem Tra Da Chay

```powershell
cmd /c npx.cmd tsc --noEmit --pretty false
cmd /c npm.cmd test -- --runInBand --coverage=false
```

Ket qua luc lap tai lieu: TypeScript pass, 4 test suites pass, 11 tests pass.
