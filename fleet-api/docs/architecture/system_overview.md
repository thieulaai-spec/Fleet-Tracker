# System Overview

## Architecture
Dự án Fleet-Tracker Backend được xây dựng theo kiến trúc **Monolithic** sử dụng framework **NestJS**.

### Tech Stack
- **Framework:** NestJS 11
- **Language:** TypeScript
- **Database:** PostgreSQL (với PostGIS cho dữ liệu không gian)
- **ORM:** TypeORM
- **Deployment:** Render (PaaS)
- **CI/CD:** GitHub Actions

## Data Flow
1. Client (Admin UI/Driver App) gửi request tới API.
2. API thực hiện logic nghiệp vụ, lưu trữ dữ liệu vào Postgres.
3. Dữ liệu GPS được lưu trữ và xử lý bằng PostGIS.
4. Hệ thống Alerts tự động tính toán dựa trên dữ liệu GPS và Business Rules.

## Deployment Strategy
- **Environment:** Production chạy trong Docker container trên Render.
- **SSL:** Kết nối DB yêu cầu `SSL: true` và `rejectUnauthorized: false`.
- **Migrations:** Chạy tự động trước khi ứng dụng khởi động.
