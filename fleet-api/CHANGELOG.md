# Changelog

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
- Lỗi logic validation tọa độ trong `OrdersService`.
