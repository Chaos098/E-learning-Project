# Báo cáo sprint — E-Learning

> Trước ngày 23/11/2026 file này tên là `docs/CLAUDE.md`. Đổi tên để không trùng với `CLAUDE.md` ở gốc project — file quy tắc mà Claude Code tự nạp — và để nhật ký không bị Claude Code tự nạp như chỉ dẫn.

File này ghi lại **kết quả thật** của từng sprint: việc đã xong, việc chưa làm, thiếu sót và lỗi đã mắc. Claude Code đọc file này trước khi bắt đầu một sprint để không lặp lại lỗi cũ và không bỏ sót việc tồn.

## Quy định

- **Khi nào viết:** ngay sau khi kết thúc một sprint và **trước khi** bắt đầu sprint kế tiếp. Chưa có báo cáo của sprint trước thì chưa được làm sprint sau.
- **Ai viết:** Claude Code (vai trò Planner), PO đọc và bổ sung.
- **Viết gì:** theo đúng 6 mục của mẫu ở cuối file. Chỉ ghi điều đã kiểm chứng; điều chưa kiểm chứng phải ghi rõ là chưa kiểm chứng. Không tô hồng: việc làm dở ghi là làm dở.
- **Thứ tự:** sprint mới nhất nằm trên cùng. Không sửa nội dung báo cáo cũ, chỉ cập nhật cột "Trạng thái" của bảng việc tồn khi việc đó được xử lý.
- Kế hoạch và tiến độ theo số liệu nằm ở [PLAN.md](../PLAN.md); yêu cầu nằm ở [requirement.md](requirement.md) (URD). File này không lặp lại hai tài liệu đó.

## Việc tồn đang mở (gom từ mọi sprint)

| Mã | Việc tồn | Từ sprint | Cần xử lý trước | Trạng thái |
|---|---|---|---|---|
| TD-01 | Bật CI: chuyển `.github/workflows-pending/ci.yml` vào `.github/workflows/` sau khi PO cấp quyền `workflow` cho token GitHub | S0 | Càng sớm càng tốt | 🔄 23/11: đã có token (`docs/secrets/`, không commit), `ci.yml` đã chuyển vào `.github/workflows/`; chờ PO cho push và xem CI chạy |
| TD-02 | PO điền khoá Stripe test vào `.env` (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`) | S0 | Sprint 2 | ⬜ Chờ PO |
| TD-03 | Ứng dụng chưa chạy trong Docker: hiện chỉ CSDL chạy bằng Docker Compose, ứng dụng chạy bằng `npm`. NFR-09 yêu cầu cả hệ thống chạy bằng Docker Compose | S0 | Sprint 6 | ⬜ |
| TD-04 | ERD chưa có chỗ lưu 3 tham số lương (lương cơ bản, phụ cấp lớp, đơn giá học viên) | S0 | Sprint 4 (US-45) | ⬜ |
| TD-05 | Chưa có thành viên nhóm nào review Sprint 0 (Definition of Done yêu cầu) | S0 | Trước khi merge Sprint 1 | ⬜ Chờ nhóm |
| TD-06 | `npm audit` báo 7 lỗ hổng mức trung bình trong thư viện phụ thuộc, chưa xem xét | S0 | Sprint 6 | ⬜ |
| TD-07 | Lịch đang trễ: Sprint 1 dự kiến 15 – 17/11 nhưng tới 16/11 chưa bắt đầu | S0 | Ngay | ✅ 23/11: PO dời hạn nộp sang 06/12/2026, giữ đủ 195 SP; lịch mới S1 23 – 25/11 → S6 05 – 06/12 trong PLAN.md |

---

## Sprint 0 — Khởi động (16/10 – 14/11/2026)

Báo cáo viết ngày 16/11/2026. Commit cuối của sprint: `fed17ef`.

### 1. Kết quả so với mục tiêu

**Mục tiêu:** chốt yêu cầu, sơ đồ CSDL và công nghệ; dựng xong khung project chạy được.
**Kết quả:** đạt 14 / 15 việc. Yêu cầu, ERD và khung project đã xong; CI đã viết nhưng chưa bật.

**Demo cuối sprint** ("chạy một lệnh là có trang chủ + CSDL; 4 agent gọi được"):

| Hạng mục | Kết quả | Cách kiểm chứng |
|---|---|---|
| Trang chủ + CSDL bằng một lệnh | Đạt trên máy của Claude Code | `npm run setup` chạy được; 4 kịch bản Playwright pass, trang chủ báo "Đã kết nối" |
| PO tự chạy `npm run up` | **Chưa có kết quả** | PO nói sẽ chạy thử ngày 14/11 nhưng chưa báo lại |
| 4 agent gọi được | Đạt một phần | 4 agent đã được nạp vào phiên làm việc; **chưa gọi thử agent nào** làm việc thật |

### 2. Đã hoàn thành

| Việc | Sản phẩm |
|---|---|
| T-0.1 → T-0.7 Chốt yêu cầu | `docs/requirement.md` v1.1 (50 user story, 25 quy tắc nghiệp vụ, 9 yêu cầu phi chức năng); PO trả lời hết Q-01 → Q-38 và xác nhận G-1 → G-5 |
| T-0.6 Sơ đồ CSDL | `So_do_CSDL.drawio` — ERD v1.1, 27 bảng |
| T-0.8 Từ điển dữ liệu | `docs/database/data-dictionary.md`: kiểu dữ liệu, ràng buộc, chỉ mục, 18 kiểu enum, thứ tự tạo bảng theo sprint |
| T-0.9 Quy ước | `CLAUDE.md`, `README.md`, `.gitignore` |
| T-0.10 Agent | `.claude/agents/`: `planner`, `coder`, `tester`, `e2e` |
| T-0.11 Khung project | Next.js 16.4 + TypeScript + Tailwind CSS 4 + shadcn/ui; ESLint, Prettier; Vitest (5 test); Playwright (4 kịch bản, máy tính và điện thoại) |
| T-0.12 CSDL | Docker Compose cho PostgreSQL 17 (cổng 5440), Prisma 7 + `@prisma/adapter-pg`, `.env.example`, lệnh `npm run up` |
| T-0.14 Wireframe | `docs/ui/wireframes.md`: sơ đồ màn hình và bố cục cho 3 vai trò |
| T-0.15 Lưu trữ | 4 commit trên `main`, đã push lên GitHub |

Kết quả kiểm tra tại commit `fed17ef`: `npm run check` pass (lint, typecheck, format, 5 unit test); `npm run build` thành công; `npm run test:e2e` 4 / 4 pass.

### 3. Chưa thực hiện

| Việc | Lý do | Xử lý |
|---|---|---|
| T-0.13 Bật CI trên GitHub Actions | GitHub từ chối push vào `.github/workflows/` vì token của PO thiếu quyền `workflow` | TD-01 |
| Chạy ứng dụng trong Docker | Sprint 0 chỉ đưa CSDL vào Docker; chưa viết `Dockerfile` cho ứng dụng | TD-03 |
| Cài Auth.js, Stripe | Chủ ý để tới sprint dùng tới (S1, S2) | Theo PLAN.md |
| Model Prisma, migration, dữ liệu mẫu | `schema.prisma` chưa có model nào, `prisma/seed.ts` còn rỗng — đúng kế hoạch (T-1.1, T-1.2) | Sprint 1 |
| Nhóm review Sprint 0 | Chưa ai review | TD-05 |

### 4. Thiếu sót

- **Wireframe chỉ là bản phác bằng ký tự**, chưa có thiết kế trực quan, chưa được PO hay nhóm duyệt. Bố cục thật có thể khác khi code.
- **Thư viện shadcn/ui mới có một component** (`button`); các component khác thêm dần khi cần.
- **Từ điển dữ liệu có hai chỗ tự quyết định ngoài ERD**: tiền lưu bằng `INTEGER` (đồng), khoá chính là `INTEGER` tự tăng. PO chưa xác nhận hai lựa chọn này.
- **Thiếu chỗ lưu tham số lương** trong ERD (TD-04).
- **Chưa đo hiệu năng** (NFR-06) và chưa kiểm tra giao diện trên điện thoại thật, mới chạy cấu hình giả lập của Playwright.
- **Mục 9 của PLAN.md** (Review & Retrospective) của S0 do Claude Code tự điền, chưa có ý kiến của nhóm.

### 5. Lỗi đã mắc và cách tránh

| Lỗi | Hậu quả | Cách tránh từ nay |
|---|---|---|
| Báo "đã commit và push" trước khi kiểm tra kết quả lệnh: lệnh commit bị dừng giữa chừng do một bước `grep` trả mã lỗi | Phải sửa lại ngay trong cùng lượt; suýt báo sai cho PO | Sau mỗi commit / push luôn đọc `git log` và `git status` rồi mới báo; không nối lệnh kiểm tra có thể trả mã lỗi vào trước lệnh commit |
| Sửa `So_do_CSDL.drawio` khi PO đang mở file trong draw.io | draw.io lưu đè, mất toàn bộ thay đổi ERD v1.1, phải áp lại | Nhắc PO đóng file trước khi sửa; sau khi sửa kiểm tra lại nội dung file ngay trước khi commit |
| Dùng `npm install` / `npm uninstall` nhiều lần trên cùng `node_modules` | Hai lần mất thư viện gốc của Vitest (lỗi optional dependency của npm), phải xoá `node_modules` và `package-lock.json` để cài lại | Khi Vitest báo "Cannot find native binding": xoá `node_modules` + `package-lock.json` rồi `npm install`; thêm bớt thư viện xong chạy lại `npm run test` |
| Chọn cổng CSDL mà không kiểm tra máy của PO | Hai lần khởi động CSDL thất bại (cổng 5432 và 5433 đã có chương trình khác dùng) | Kiểm tra cổng trống trước khi chọn; project dùng cổng 5440 |
| Đưa file CI vào commit mà không biết token thiếu quyền | Push bị từ chối, phải sửa commit | Đã ghi vào bộ nhớ: không commit file vào `.github/workflows/` cho tới khi TD-01 xong |
| Ước lượng lịch quá lạc quan | Sprint 0 dự kiến xong 08/11, thực tế 14/11; Sprint 1 đã trễ 1 ngày khi viết báo cáo này | Mốc ngày trong PLAN.md là trần; báo ngay cho PO khi một sprint không kịp, đề xuất bỏ story Could / Should |
| Dùng công cụ sinh mã mà không lường trước file thừa: `prisma init` tự tạo thư mục `.agents/`, `.windsurf/`, `.claude/skills/` | Phải dọn tay | Sau khi chạy công cụ khởi tạo, xem `git status` trước khi làm tiếp |

### 6. Lưu ý cho Sprint 1

- **Next.js 16 khác các bản cũ**: middleware nay là `src/proxy.ts`; kiểu `PageProps` / `LayoutProps` là kiểu toàn cục do `next typegen` sinh ra; đọc `node_modules/next/dist/docs/` trước khi dùng API. Project **không bật Cache Components**.
- **Prisma 7**: bắt buộc dùng driver adapter, client sinh vào `src/generated/prisma`; cấu hình ở `prisma.config.ts`. Prisma 8 mới ở bản RC — không nâng cấp trong đồ án này.
- **Docker Desktop thường không chạy sẵn** trên máy PO: bật bằng `open -a Docker` rồi mới `npm run db:up`.
- **Auth.js với Next.js 16** là phần chưa thử: đọc hướng dẫn `authentication.md` trong tài liệu của Next trước khi cài, kiểm tra bản Auth.js tương thích.
- Sprint 1 gồm 12 user story (43 SP) trong 3 ngày và đã trễ: làm theo thứ tự schema → đăng nhập và phân quyền → môn học → lớp học; nếu không kịp thì báo PO ngay.

---

## Mẫu báo cáo sprint

```markdown
## Sprint N — Tên sprint (ngày bắt đầu – ngày kết thúc)

Báo cáo viết ngày …. Commit cuối của sprint: `…`.

### 1. Kết quả so với mục tiêu
Mục tiêu, kết quả (x / y user story, a / b SP), bảng demo cuối sprint: hạng mục · kết quả · cách kiểm chứng.

### 2. Đã hoàn thành
Bảng: user story hoặc việc · sản phẩm · test / kịch bản E2E tương ứng. Kèm kết quả `npm run check`, `npm run build`, `npm run test:e2e`.

### 3. Chưa thực hiện
Bảng: việc · lý do · xử lý (mã TD hoặc sprint sẽ làm).

### 4. Thiếu sót
Tiêu chí chấp nhận chỉ đạt một phần, phần chưa kiểm chứng, khác biệt so với requirement / wireframe / ERD.

### 5. Lỗi đã mắc và cách tránh
Bảng: lỗi · hậu quả · cách tránh từ nay. Gồm cả lỗi trong sản phẩm (bug) và lỗi trong cách làm.

### 6. Lưu ý cho sprint sau
Điều cần biết trước khi làm sprint kế tiếp. Cập nhật bảng "Việc tồn đang mở" ở đầu file.
```
