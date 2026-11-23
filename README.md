# E-Learning

Ứng dụng web học trực tuyến cho trung tâm đào tạo — đồ án môn Công nghệ phần mềm. Quản trị viên tạo môn học, mở lớp và phân công giảng viên; học viên đăng ký lớp, thanh toán, học bài, làm quiz và thi cuối kỳ; giảng viên soạn câu hỏi, chấm bài và nhận lương.

## Yêu cầu

- [Node.js](https://nodejs.org) 22 trở lên
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (đang chạy)

## Chạy trên máy cá nhân

```bash
npm run up
```

Lệnh này tạo file `.env`, cài thư viện, bật PostgreSQL trong Docker (cổng 5440), áp migration rồi chạy ứng dụng ở http://localhost:3000. Trang chủ hiển thị trạng thái ứng dụng và cơ sở dữ liệu.

Từ lần sau chỉ cần:

```bash
npm run db:up
```

```bash
npm run dev
```

## Lệnh thường dùng

| Lệnh | Việc |
|---|---|
| `npm run check` | Lint, typecheck, kiểm tra format và unit test |
| `npm run test` | Unit test (Vitest) |
| `npm run test:e2e` | Kiểm thử trên trình duyệt (Playwright); lần đầu chạy `npx playwright install chromium` |
| `npm run db:migrate` | Tạo và áp migration sau khi sửa `prisma/schema.prisma` |
| `npm run db:seed` | Nạp dữ liệu mẫu |
| `npm run db:studio` | Xem dữ liệu bằng Prisma Studio |
| `npm run db:down` | Tắt PostgreSQL |

## Công nghệ

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 + shadcn/ui · PostgreSQL 17 · Prisma 7 · Zod · Vitest · Playwright · Stripe (chế độ test)

## Tài liệu

| Tài liệu | Nội dung |
|---|---|
| [PLAN.md](PLAN.md) | Kế hoạch sprint, backlog, tiến độ |
| [docs/requirement.md](docs/requirement.md) | Đặc tả yêu cầu: user story, quy tắc nghiệp vụ |
| [docs/architecture.md](docs/architecture.md) | Cấu trúc hệ thống: thành phần, các tầng, phân hệ, luồng xử lý |
| [So_do_CSDL.drawio](So_do_CSDL.drawio) | Sơ đồ CSDL (ERD v1.1, 27 bảng), mở bằng draw.io |
| [docs/database/data-dictionary.md](docs/database/data-dictionary.md) | Từ điển dữ liệu |
| [docs/ui/wireframes.md](docs/ui/wireframes.md) | Sơ đồ màn hình và wireframe |
| [CLAUDE.md](CLAUDE.md) | Quy ước làm việc với Claude Code |

## Biến môi trường

Xem [.env.example](.env.example). Khoá Stripe chỉ dùng loại test (`sk_test_…`, `pk_test_…`) và chỉ đặt trong `.env`, không commit.
