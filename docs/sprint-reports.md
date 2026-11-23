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
| TD-01 | Bật CI: chuyển `.github/workflows-pending/ci.yml` vào `.github/workflows/` sau khi PO cấp quyền `workflow` cho token GitHub | S0 | Càng sớm càng tốt | ✅ 23/11: `ci.yml` đã ở `.github/workflows/`, push bằng token mới (`docs/secrets/`, không commit); CI chạy lần đầu ở commit `698b043` pass |
| TD-02 | PO điền khoá Stripe test vào `.env` (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`) | S0 | Sprint 2 | ⬜ Chờ PO |
| TD-03 | Ứng dụng chưa chạy trong Docker: hiện chỉ CSDL chạy bằng Docker Compose, ứng dụng chạy bằng `npm`. NFR-09 yêu cầu cả hệ thống chạy bằng Docker Compose | S0 | Sprint 6 | ⬜ |
| TD-04 | ERD chưa có chỗ lưu 3 tham số lương (lương cơ bản, phụ cấp lớp, đơn giá học viên) | S0 | Sprint 4 (US-45) | ⬜ |
| TD-05 | Chưa có thành viên nhóm nào review Sprint 0 (Definition of Done yêu cầu) | S0 | Trước khi merge Sprint 1 | ⬜ Chờ nhóm |
| TD-06 | `npm audit` báo 7 lỗ hổng mức trung bình trong thư viện phụ thuộc, chưa xem xét | S0 | Sprint 6 | ⬜ 23/11: còn 7 lỗ hổng (4 trung bình, 3 cao) sau khi cài lại thư viện |
| TD-07 | Lịch đang trễ: Sprint 1 dự kiến 15 – 17/11 nhưng tới 16/11 chưa bắt đầu | S0 | Ngay | ✅ 23/11: PO dời hạn nộp sang 06/12/2026, giữ đủ 195 SP; lịch mới S1 23 – 25/11 → S6 05 – 06/12 trong PLAN.md |
| TD-08 | Sprint 1 chưa commit và chưa được nhóm review: toàn bộ thay đổi nằm trên nhánh `feature/sprint-1` (chưa commit), chưa merge vào `main` | S1 | Trước khi bắt đầu Sprint 2 | ⬜ Chờ PO |
| TD-09 | US-13 và US-11 phụ thuộc Sprint 2: giảng viên chưa thấy học viên trong lớp, số chỗ còn lại đang bằng sĩ số tối đa (chưa có bảng `study` / `enrollment`). Chỗ cần sửa: `src/server/classes/counts.ts` và `teacherGetClass` | S1 | Sprint 2 (T-2.1) | ⬜ |
| TD-10 | Học viên chưa tải được file đính kèm bài học (`canDownloadLessonAttachment` trả `false` cho học viên) vì chưa có quyền vào lớp | S1 | Sprint 2 (T-2.5) | ⬜ |

---

## Sprint 1 — Tài khoản, môn học & lớp học (23/11 – 25/11/2026)

Báo cáo viết ngày 23/11/2026, ngay sau khi code xong. Nhánh `feature/sprint-1`, **chưa commit** (chờ PO cho phép, TD-08).

### 1. Kết quả so với mục tiêu

**Mục tiêu:** ba vai trò đăng nhập được; Admin xây xong môn học, mở lớp và phân công giảng viên; khách xem được.
**Kết quả:** code xong 12 / 12 user story, 43 / 43 SP, 11 / 11 việc T-1.x. Trạng thái 👀: chưa được thành viên nhóm review, chưa merge vào `main` nên chưa đạt đủ Definition of Done.

**Demo cuối sprint:**

| Hạng mục | Kết quả | Cách kiểm chứng |
|---|---|---|
| Đăng nhập 3 vai trò, mỗi vai trò thấy menu riêng | Đạt | `e2e/auth.spec.ts` (3 kịch bản × máy tính, điện thoại); Claude Code thử tay bằng tài khoản Admin |
| Admin tạo môn học có chương và bài học | Đạt | `e2e/admin-flow.spec.ts`: tạo môn, chương, bài có video + văn bản + file PDF; file `.exe` bị từ chối |
| Admin mở lớp và giao cho giảng viên | Đạt | Cùng kịch bản: mở lớp, đề thi cuối kỳ tự tạo ở trạng thái "Chưa mở" |
| Khách thấy lớp đang nhận đăng ký | Đạt | Cùng kịch bản: khách tìm môn, xem chi tiết, thấy lớp, giảng viên, học phí, cọc, số chỗ; không thấy nội dung bài học |
| PO / nhóm chạy thử | **Chưa có kết quả** | Chưa ai trong nhóm chạy |

### 2. Đã hoàn thành

| User story / việc | Sản phẩm | Test |
|---|---|---|
| T-1.1 Schema + migration | 9 bảng `user`, `admin`, `teacher`, `student`, `course`, `section`, `lesson`, `classes`, `exam` (cột cơ bản); 9 ràng buộc CHECK viết tay trong migration | Test tích hợp chạy trên CSDL thật |
| T-1.2 Dữ liệu mẫu | `prisma/seed.ts`: 1 Admin, 3 giảng viên, 10 học viên, 4 môn (3 đang mở, 1 nháp), 11 chương, 4 lớp kèm đề thi; chạy lại không bị trùng; `npm run up` tự nạp | Chạy hai lần liên tiếp |
| US-01, US-02 Đăng ký, đăng nhập / đăng xuất | `/register`, `/login`, Auth.js v5; lỗi đăng nhập là câu chung; tài khoản khoá bị chặn; đăng nhập xong về trang theo vai trò hoặc trang đang muốn vào | `accounts/service.test.ts`, `accounts/schemas.test.ts`, `e2e/auth.spec.ts` |
| US-03 Phân quyền | `src/proxy.ts`, trang 403 (mã 403), `requireActor` ở mọi trang và server action, `assertRole` ở mọi service | `auth/roles.test.ts`, phần ForbiddenError trong các test service, `e2e/auth.spec.ts` |
| US-05 Quản lý tài khoản | `/admin/users`: lọc vai trò, tìm kiếm, tạo giảng viên / Admin, sửa hệ số lương, khoá / mở khoá (có hộp xác nhận) | `accounts/service.test.ts`, `e2e/admin-flow.spec.ts` |
| US-07 → US-09 Môn học, chương, bài học | `/admin/courses`, `/admin/courses/[id]`, sửa bài học; đổi thứ tự bằng nút ↑ ↓ (dùng được trên điện thoại) | `courses/service.test.ts` |
| T-1.7 File đính kèm (NFR-05) | `src/server/files/storage.ts`; tối đa 10 MB; pdf, docx, pptx, zip, png, jpg; tải qua `/api/lessons/[id]/attachment` có kiểm tra quyền | `files/storage.test.ts`, `courses/service.test.ts` |
| US-10, US-11 Danh mục và chi tiết | `/courses` (tìm, 9 môn / trang), `/courses/[id]` (không trả nội dung bài học về trình duyệt) | `courses/service.test.ts`, `e2e/admin-flow.spec.ts` |
| US-12, US-29 Mở lớp, đề cuối kỳ | `/admin/classes`, `/admin/classes/new`, `/admin/classes/[id]`: mở lớp và tạo đề `DISABLED` trong một transaction; sửa lớp khi còn nhận đăng ký; đổi giảng viên | `classes/service.test.ts`, `classes/schemas.test.ts` |
| US-13 Giảng viên xem lớp | `/teacher`, `/teacher/classes/[id]`; lớp của giảng viên khác trả 404 | `classes/service.test.ts`, `e2e/admin-flow.spec.ts` |
| T-1.11 Test | 61 test Vitest (8 file, gồm test tích hợp với CSDL); 12 kịch bản Playwright × 2 cấu hình = 24 lượt | — |

Kết quả kiểm tra ngày 23/11 (chưa commit): `npm run check` pass (lint 0 cảnh báo, typecheck, format, 61 / 61 test); `npm run build` thành công; `npm run test:e2e` 24 / 24 pass. CI đã thêm PostgreSQL và bước `prisma migrate deploy` nhưng **chưa chạy trên GitHub** vì chưa push.

### 3. Chưa thực hiện

| Việc | Lý do | Xử lý |
|---|---|---|
| Danh sách học viên trong lớp của giảng viên (US-13), số chỗ còn lại thật (US-11) | Chưa có bảng `study`, `enrollment` | TD-09, Sprint 2 |
| Học viên tải file bài học | Chưa có quyền vào lớp | TD-10, Sprint 2 |
| Nút "Đăng ký lớp" trên trang chi tiết môn học | Thuộc US-17 | Sprint 2; hiện hiện câu "đang được hoàn thiện" cho người đã đăng nhập |
| Nhóm review, merge, PO nghiệm thu | Chưa commit | TD-08 |

### 4. Thiếu sót

- **Thứ tự chương / bài học đổi bằng nút ↑ ↓**, chưa kéo thả như wireframe 7.3 (wireframe cho phép nút ↑ ↓ trên điện thoại; trên máy tính cũng đang dùng nút).
- **Danh mục môn học chưa có ảnh bìa**, mô tả ngắn cắt 3 dòng.
- **Ngày khai giảng được kiểm tra không ở quá khứ**, nhưng chưa có quy định khoảng cách tối thiểu tới ngày khai giảng — chưa hỏi PO.
- **Mở lớp cho môn đang ở trạng thái Nháp được phép** (chỉ chặn môn Ngừng). Requirement không nói rõ, Claude Code tự quyết định; lớp của môn nháp không hiện ở trang công khai.
- **Xoá chương / bài học là xoá hẳn** (FR-2.2, FR-2.3 cho phép xoá). Từ Sprint 2, khi có `lesson_progress`, phải chặn xoá bài đã có người học (BR-19).
- **Chưa thử trên điện thoại thật**, mới chạy cấu hình Pixel 7 của Playwright và xem giao diện ở khung hẹp trong trình duyệt của Claude Code.
- **Auth.js đang là bản beta** (5.0.0-beta.32) — bản duy nhất hỗ trợ Next.js 16.

### 5. Lỗi đã mắc và cách tránh

| Lỗi | Hậu quả | Cách tránh từ nay |
|---|---|---|
| Lỗi trong sản phẩm, do test bắt được: ô tiền nhận "1500.5" rồi bỏ dấu chấm thành 15.005 ₫ | Có thể lưu sai học phí | Chỉ nhận dấu chấm ở vị trí phân cách hàng nghìn; có test cho trường hợp này |
| Lỗi trong sản phẩm, do test bắt được: ngày giờ hiển thị "08:30 23/11/2026" (định dạng `vi-VN` để giờ trước ngày) | Sai NFR-11 | Ghép ngày giờ bằng `formatToParts`; có test |
| Cài thêm thư viện làm mất mục thư viện gốc của rolldown trong `package-lock.json` (lỗi đã gặp ở S0) | Vitest không chạy; CI cũng sẽ hỏng | Sau mỗi lần thêm thư viện chạy ngay `npm run test`; khi lỗi thì xoá `node_modules` + `package-lock.json` rồi cài lại |
| Xoá `node_modules` khi ổ hệ thống của máy PO chỉ còn khoảng 1 GB: lần cài lại hỏng giữa chừng vì bộ nhớ đệm npm (`~/.npm`, 2,6 GB) nằm trên ổ đó | Project tạm thời không có thư viện | Kiểm tra dung lượng trống (`df -h /`) trước khi cài lại; cài với `--cache /Volumes/MySSD/.npm-cache` |
| Tạo thư mục có `[id]` bằng `mkdir` không đặt trong ngoặc kép trên zsh | Lệnh lỗi, phải tạo lại | Luôn đặt đường dẫn route động trong ngoặc kép |
| Kịch bản E2E dùng `getByRole("alert")` trùng với vùng thông báo chuyển trang của Next; bấm lại `<summary>` làm đóng khối đang mở; chuyển trang khi đăng nhập chưa xong | 9 kịch bản thất bại ở lần chạy đầu | Dùng `formAlert()`, `openDetails()`, `logout()` trong `e2e/helpers.ts`; luôn chờ URL sau khi đăng nhập |
| Chạy Playwright khi PO đang mở `npm run dev` | Next 16 không cho chạy hai dev server trong một thư mục | Hỏi hoặc chờ PO tắt dev server trước khi chạy `npm run test:e2e`; đã ghi vào README |

### 6. Lưu ý cho Sprint 2

- **Trước khi làm Sprint 2:** PO cho commit Sprint 1, nhóm review (TD-08); PO điền khoá Stripe test (TD-02).
- Sửa `src/server/classes/counts.ts` để đếm học viên đã cọc / trả đủ từ bảng `study`; bổ sung danh sách học viên trong `teacherGetClass` (TD-09); cho học viên có quyền vào lớp tải file bài học (TD-10).
- Chặn xoá bài học đã có `lesson_progress` (BR-19).
- Mẫu viết service đã thống nhất: service nhận `actor`, gọi `assertRole`, kiểm tra bằng Zod, ghi nhiều bảng trong `db.$transaction`; action chỉ gọi `requireActor` rồi gọi service. Test tích hợp dùng `TestData` trong `src/test/factories.ts`.
- Sprint 2 chỉ có 2 ngày (26 – 27/11) cho 34 SP, phần Stripe có rủi ro (R3): làm nút thanh toán giả lập trước.

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
