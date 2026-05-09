# Changelog

## [2026-05-09]
### Changed
- Cấu hình TypeORM sử dụng biến môi trường `DB_SYNCHRONIZE` thay vì mặc định `synchronize: true` trong môi trường development.
- Cập nhật `AppModule` để hỗ trợ bật/tắt đồng bộ Schema linh hoạt.

### Fixed
- Lỗi `QueryFailedError: column "email" of relation "users" contains null values` khiến API không thể khởi động khi kết nối với Database có sẵn dữ liệu.


## [2026-05-07]
### Added
- Unit tests cho `DispatchService` (`src/dispatch/dispatch.service.spec.ts`).
- E2E tests cho `OrdersController` (`test/orders.e2e-spec.ts`).

### Changed
- Refactor `DispatchService.assignBulkOrders`:
    - Thêm logic deduplicate order IDs.
    - Sử dụng `In()` để fetch đơn hàng theo batch.
    - Sử dụng `manager.save()` theo mảng để tối ưu hóa lưu dữ liệu.
- Cập nhật `OrdersService` để validate địa chỉ nhận và giao không được trùng nhau.

### Fixed
- Lỗi `DataTypeNotSupportedError` trong `User` entity khi chạy trên Postgres.

## [2026-05-08]
### Added
- Dự án đạt 33/33 tests PASS sau khi refactor.
- Tích hợp project-wide Enums vào toàn bộ hệ thống test.

### Changed
- Refactor `reports.service.spec.ts`: Thay thế chuỗi `'small'` bằng `VehicleType.SMALL`.
- Refactor `kpi.service.spec.ts`: Thay thế chuỗi `'speed_violation'` và `'incident'` bằng `AlertType`.
- Refactor `alerts.service.spec.ts`: Chuẩn hóa case-sensitivity cho `AlertType.SPEED_VIOLATION`.
- Refactor `trips.service.spec.ts`: Thay thế các vai trò `'admin'` và `'driver'` bằng `UserRole`.

### Fixed
- Lỗi không nhất quán giữa test data và Enum definition (case-sensitivity).
