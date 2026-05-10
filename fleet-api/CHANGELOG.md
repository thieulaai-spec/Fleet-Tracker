# Changelog

## [2026-05-10]
### Added
- **Dockerization:** Thêm `Dockerfile` (multi-stage), `.dockerignore` và `docker-compose.prod.yml`.
- **Database Migrations:** Thiết lập hệ thống TypeORM migrations, tạo migration đầu tiên `InitialSchema`.
- **Health Checks:** Thêm module `/api/health` dùng `@nestjs/terminus`.
- **CI/CD:** Cấu hình GitHub Actions tự động chạy Lint & Test cho Backend.
- **Railway Support:** Tối ưu Dockerfile để tự động chạy migrations khi deploy lên Railway.

### Changed
- **Security Hardening:** Ép buộc `synchronize: false` và bật `SSL` khi `NODE_ENV=production`.
- **Scripts:** Thêm các lệnh quản lý migration vào `package.json`.

### Fixed
- **SSL Error:** Khắc phục lỗi `SELF_SIGNED_CERT_IN_CHAIN` bằng cách thiết lập `rejectUnauthorized: false` trong `AppModule` và `data-source.ts`.
- **Deployment Entry Point:** Sửa lỗi không tìm thấy module khi khởi động trên Render bằng cách trỏ đúng đường dẫn `dist/src/main`.
- **Migration Conflict:** Giải quyết lỗi `NOT NULL VIOLATION` bằng cách sử dụng `InitialSchema` migration mới trên database sạch.




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
