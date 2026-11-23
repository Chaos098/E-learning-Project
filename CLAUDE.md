@AGENTS.md

# E-Learning — quy ước cho Claude Code

Đồ án môn CNPM: ứng dụng web học trực tuyến cho trung tâm đào tạo. **Hạn nộp 06/12/2026.** Claude Code viết toàn bộ code; nhóm 4 người review và chạy thử. Trả lời và viết tài liệu bằng **tiếng Việt**.

## Đọc trước khi làm

1. [PLAN.md](PLAN.md) — sprint hiện tại, backlog, việc `T-x.y`, Definition of Done.
2. [docs/requirement.md](docs/requirement.md) — tài liệu yêu cầu người dùng (URD): yêu cầu người dùng (`UR-xx`), user story (`US-xx`, mục 6), chức năng hệ thống (`FR-m.n`, mục 7), quy tắc nghiệp vụ (`BR-xx`), yêu cầu phi chức năng (`NFR-xx`), kịch bản nghiệm thu (`AT-xx`). Câu trả lời của PO ở Phụ lục A có giá trị cao nhất.
3. [docs/architecture.md](docs/architecture.md) — cấu trúc hệ thống: các tầng, phân hệ, cấu trúc thư mục, quy tắc phụ thuộc. Cập nhật file này cuối mỗi sprint (đổi ⬜ thành ✅, sửa phần thiết kế đã thay đổi).
4. [docs/database/data-dictionary.md](docs/database/data-dictionary.md) — kiểu dữ liệu, ràng buộc, chỉ mục của 27 bảng.
5. [docs/ui/wireframes.md](docs/ui/wireframes.md) — sơ đồ màn hình và bố cục.
6. [docs/sprint-reports.md](docs/sprint-reports.md) — nhật ký sprint: việc tồn đang mở, thiếu sót và lỗi đã mắc ở các sprint trước.

Nguồn chuẩn của CSDL là `So_do_CSDL.drawio` (ERD v1.1). Đổi CSDL thì sửa **cùng lúc**: sơ đồ, từ điển dữ liệu, `prisma/schema.prisma` và migration. File `.drawio` là XML thường, sửa bằng script; PO hay mở file này trong draw.io nên phải nhắc PO đóng và mở lại sau khi sửa.

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm run up` | Chuẩn bị môi trường (`.env`, CSDL Docker, Prisma, migration) rồi chạy dev server |
| `npm run dev` | Dev server ở http://localhost:3000 |
| `npm run check` | Lint + typecheck + kiểm tra format + unit test — **chạy trước mỗi commit** |
| `npm run test` / `npm run test:e2e` | Vitest / Playwright (tự bật dev server ở cổng 3100, cần CSDL đang chạy) |
| `npm run db:up` / `db:down` | Bật / tắt PostgreSQL (Docker, cổng 5440) |
| `npm run db:migrate` | Tạo và áp migration khi sửa `schema.prisma` |
| `npm run db:seed` | Nạp dữ liệu mẫu |
| `npm run format` | Prettier |

## Công nghệ và điểm cần nhớ

- **Next.js 16** (App Router, thư mục `src/`). Bản này khác nhiều so với các bản cũ: đọc `node_modules/next/dist/docs/` trước khi dùng một API. Middleware nay gọi là **proxy** (`src/proxy.ts`). Kiểu `PageProps` / `LayoutProps` là kiểu toàn cục do `next typegen` sinh ra.
- **Không bật Cache Components** (`next.config.ts`): trang đọc phiên đăng nhập hoặc CSDL thì render theo từng request; trang chỉ đọc CSDL mà không đọc cookie phải có `export const dynamic = "force-dynamic"`.
- **Prisma 7**: client sinh vào `src/generated/prisma` (không commit), import từ `@/generated/prisma/client`, kết nối qua `@prisma/adapter-pg`. Chỉ dùng instance `db` trong `src/lib/db.ts`. Cấu hình ở `prisma.config.ts`.
- **Tailwind CSS 4 + shadcn/ui** (`npx shadcn@latest add <tên>`), **Zod 4** để kiểm tra dữ liệu ở cả form và server, **Auth.js** cho đăng nhập (từ Sprint 1), **Stripe chế độ test** (từ Sprint 2).

## Cấu trúc thư mục

```text
src/app/            route, layout, trang; route nhóm theo vai trò: (public), admin/, teacher/, student/
src/components/     component dùng chung; components/ui/ là của shadcn
src/server/         nghiệp vụ phía server theo từng epic (services, truy vấn, server action)
src/lib/            tiện ích không phụ thuộc nghiệp vụ (db, format, validation)
prisma/             schema.prisma, migrations/, seed.ts
e2e/                kịch bản Playwright
docs/               requirement, database, ui, report
uploads/            file người dùng tải lên (không commit)
```

## Quy tắc code

- TypeScript strict, không dùng `any`. Giao diện và thông báo lỗi bằng tiếng Việt; tên biến, hàm, commit bằng tiếng Anh.
- **Kiểm tra quyền ở server** trong mọi server action và route handler (US-03, BR-20); không tin dữ liệu từ trình duyệt.
- Thao tác ghi nhiều bảng (kích hoạt đơn, nộp bài, chấm điểm, tính lương, huỷ lớp hoàn tiền) chạy trong **transaction** (NFR-03).
- Thời gian lấy theo giờ server (BR-25). Không gửi đáp án đúng về trình duyệt khi học viên đang làm bài (BR-24).
- Tiền là số nguyên VND; hiển thị bằng `formatVnd` trong `src/lib/format.ts`.
- Không xoá hẳn dữ liệu đã có lịch sử; dùng trạng thái (BR-19).
- Mỗi tiêu chí chấp nhận và quy tắc nghiệp vụ có test Vitest; mỗi luồng chính có kịch bản Playwright. Giao diện phải dùng được trên điện thoại.
- Không đưa khoá bí mật vào mã nguồn; biến môi trường mới phải thêm vào `.env.example`.

## Quy trình

1. PO giao việc theo user story hoặc sprint. **Planner** chia việc và cập nhật PLAN.md; **Coder** viết code; **Tester** viết và chạy Vitest; **E2E** viết và chạy Playwright (4 agent trong `.claude/agents/`).
2. Mỗi user story một nhánh `feature/us-xx-ten-ngan`; commit theo Conventional Commits bằng tiếng Anh, ví dụ `feat(enrollment): create enrollment with multiple classes`.
3. Xong việc: `npm run check` và E2E liên quan phải pass, tick `[x]` và cập nhật trạng thái, số SP trong PLAN.md.
4. Chỉ commit, push hoặc merge vào `main` khi PO yêu cầu.
5. **Kết thúc mỗi sprint, trước khi bắt đầu sprint kế tiếp:** viết báo cáo sprint vào [docs/sprint-reports.md](docs/sprint-reports.md) theo mẫu ở cuối file đó — đã hoàn thành, chưa thực hiện, thiếu sót, lỗi đã mắc — và cập nhật bảng việc tồn. Chưa có báo cáo của sprint trước thì chưa làm sprint sau.
