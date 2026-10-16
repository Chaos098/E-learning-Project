# Thiết kế cơ sở dữ liệu — E-Learning Platform

> Bản gốc (source of truth) là [`schema.dbml`](schema.dbml). File này dùng để đọc nhanh và giải thích **vì sao** thiết kế như vậy.
> Khi sửa schema: sửa `schema.dbml` trước, rồi cập nhật sơ đồ ở đây.

## Cách xem sơ đồ

| Muốn làm gì | Cách làm |
|---|---|
| Xem nhanh trên máy | Mở file này trên GitHub, hoặc VS Code + extension *Markdown Preview Mermaid Support* |
| Lấy ảnh đưa vào báo cáo | Paste `schema.dbml` vào [dbdiagram.io](https://dbdiagram.io) → Export PNG/PDF |
| Sinh SQL tạo bảng | dbdiagram.io → Export → PostgreSQL |

## Quy ước chung

- **CSDL:** PostgreSQL (dữ liệu có nhiều quan hệ và cần ràng buộc chặt → hợp với SQL hơn MongoDB).
- **Khoá chính:** `uuid` — URL kiểu `/courses/3f2a…` không đoán được id kế tiếp.
- **Tên bảng:** `snake_case`, số nhiều. **Tiền:** `decimal`, không dùng `float`.
- Mọi bảng đều có `created_at`, `updated_at` — **đã lược bớt trong các sơ đồ bên dưới cho gọn** (xem đủ trong `schema.dbml`).

---

## 1. Sơ đồ tổng quan (chỉ thể hiện quan hệ)

```mermaid
erDiagram
    users ||--o{ courses : "tạo (GV)"
    categories |o--o{ categories : "danh mục cha"
    categories |o--o{ courses : "phân loại"
    courses ||--o{ sections : "gồm chương"
    sections ||--o{ lessons : "gồm bài"
    courses ||--o{ questions : "kho câu hỏi"
    questions ||--|{ question_options : "có đáp án"
    courses ||--o{ quizzes : "có đề"
    lessons |o--o| quizzes : "quiz của bài"
    quizzes ||--o{ quiz_questions : "chọn câu"
    questions ||--o{ quiz_questions : "được chọn"
    lessons ||--o| assignments : "bài tập"
    users ||--o{ enrollments : "đăng ký (SV)"
    courses ||--o{ enrollments : "có học viên"
    enrollments ||--o{ lesson_progress : "tiến độ"
    lessons ||--o{ lesson_progress : "được học"
    enrollments ||--o{ quiz_attempts : "làm bài"
    quizzes ||--o{ quiz_attempts : "lượt làm"
    quiz_attempts ||--o{ attempt_answers : "câu trả lời"
    questions ||--o{ attempt_answers : "được trả lời"
    enrollments ||--o{ submissions : "nộp bài"
    assignments ||--o{ submissions : "bài nộp"
    enrollments ||--o| reviews : "đánh giá"
    users ||--o{ orders : "mua (SV)"
    orders ||--|{ order_items : "gồm"
    courses ||--o{ order_items : "được mua"
    order_items |o--o| enrollments : "kích hoạt"
    orders ||--o{ payments : "thanh toán"
    users ||--o{ conversations : "là GV"
    users ||--o{ conversations : "là SV"
    conversations ||--o{ messages : "chứa"
    users ||--o{ messages : "gửi"
    users ||--o{ notifications : "nhận"
```

**Đọc ký hiệu:** `||` = đúng 1 · `|o` = 0 hoặc 1 · `o{` = 0 hoặc nhiều · `|{` = 1 hoặc nhiều.
Ví dụ `users ||--o{ courses`: mỗi khoá học có đúng 1 giảng viên, một giảng viên có 0..n khoá học.

---

## 2. Chi tiết theo nhóm

### 2.1 Người dùng & nội dung khoá học

```mermaid
erDiagram
    users ||--o{ courses : "tạo (GV)"
    categories |o--o{ categories : "danh mục cha"
    categories |o--o{ courses : "phân loại"
    courses ||--o{ sections : "gồm chương"
    sections ||--o{ lessons : "gồm bài"

    users {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar full_name
        varchar avatar_url
        enum role "STUDENT / TEACHER / ADMIN"
        text bio "hồ sơ GV"
        boolean is_active
    }
    categories {
        uuid id PK
        uuid parent_id FK "null = danh mục gốc"
        varchar name
        varchar slug UK
    }
    courses {
        uuid id PK
        uuid teacher_id FK "GV sở hữu khoá"
        uuid category_id FK
        varchar title
        varchar slug UK
        varchar summary
        text description
        varchar thumbnail_url
        decimal price "0 = miễn phí"
        enum level "BEGINNER / INTERMEDIATE / ADVANCED"
        enum status "DRAFT / PUBLISHED / ARCHIVED"
        timestamptz published_at
    }
    sections {
        uuid id PK
        uuid course_id FK
        varchar title
        int position "thứ tự chương"
    }
    lessons {
        uuid id PK
        uuid section_id FK
        varchar title
        enum type "VIDEO / ARTICLE / QUIZ / ASSIGNMENT"
        text content "bài đọc"
        varchar video_url "link Cloudinary / S3 / YouTube"
        int duration_seconds
        int position "thứ tự bài"
        boolean is_preview "cho xem thử"
    }
```

### 2.2 Ngân hàng câu hỏi & bài kiểm tra

```mermaid
erDiagram
    courses ||--o{ questions : "kho câu hỏi"
    questions ||--|{ question_options : "có đáp án"
    courses ||--o{ quizzes : "có đề"
    lessons |o--o| quizzes : "quiz của bài"
    quizzes ||--o{ quiz_questions : "chọn câu"
    questions ||--o{ quiz_questions : "được chọn"
    quizzes ||--o{ quiz_attempts : "lượt làm"
    enrollments ||--o{ quiz_attempts : "làm bài"
    quiz_attempts ||--o{ attempt_answers : "câu trả lời"
    questions ||--o{ attempt_answers : "được trả lời"

    questions {
        uuid id PK
        uuid course_id FK
        enum type "SINGLE_CHOICE / MULTIPLE_CHOICE / TRUE_FALSE"
        text content
        enum difficulty "EASY / MEDIUM / HARD"
        text explanation "giải thích đáp án"
        timestamptz deleted_at "xoá mềm"
    }
    question_options {
        uuid id PK
        uuid question_id FK
        text content
        boolean is_correct
        int position
    }
    quizzes {
        uuid id PK
        uuid course_id FK
        uuid lesson_id FK, UK "null nếu là đề giữa kì / cuối kì"
        enum type "LESSON_QUIZ / MIDTERM / FINAL"
        varchar title
        int time_limit_minutes
        decimal pass_score
        int max_attempts
        boolean shuffle_questions
        timestamptz open_at
        timestamptz close_at
        enum status "DRAFT / PUBLISHED"
    }
    quiz_questions {
        uuid quiz_id PK, FK
        uuid question_id PK, FK
        int position
        decimal points "điểm câu này trong đề này"
    }
    quiz_attempts {
        uuid id PK
        uuid quiz_id FK
        uuid enrollment_id FK
        int attempt_no "lần làm thứ mấy"
        enum status "IN_PROGRESS / SUBMITTED"
        timestamptz started_at
        timestamptz submitted_at
        decimal score
        boolean is_passed
    }
    attempt_answers {
        uuid id PK
        uuid attempt_id FK
        uuid question_id FK
        jsonb selected_option_ids "mảng id đáp án đã chọn"
        boolean is_correct
        decimal points_earned
    }
```

### 2.3 Đăng ký, tiến độ & bài tập thực hành

```mermaid
erDiagram
    users ||--o{ enrollments : "đăng ký (SV)"
    courses ||--o{ enrollments : "có học viên"
    enrollments ||--o{ lesson_progress : "tiến độ"
    lessons ||--o{ lesson_progress : "được học"
    lessons ||--o| assignments : "bài tập"
    assignments ||--o{ submissions : "bài nộp"
    enrollments ||--o{ submissions : "nộp bài"
    enrollments ||--o| reviews : "đánh giá"

    enrollments {
        uuid id PK
        uuid student_id FK "UNIQUE (student_id, course_id)"
        uuid course_id FK
        uuid order_item_id FK, UK "null nếu khoá miễn phí"
        enum status "ACTIVE / COMPLETED / CANCELLED"
        decimal progress_percent "cache, tính từ lesson_progress"
        timestamptz enrolled_at
        timestamptz completed_at
        timestamptz last_accessed_at
    }
    lesson_progress {
        uuid id PK
        uuid enrollment_id FK "UNIQUE (enrollment_id, lesson_id)"
        uuid lesson_id FK
        enum status "IN_PROGRESS / COMPLETED"
        int last_position_seconds "xem tiếp video"
        timestamptz completed_at
    }
    assignments {
        uuid id PK
        uuid lesson_id FK, UK
        text instructions
        varchar attachment_url "file đề / starter code"
        decimal max_score
    }
    submissions {
        uuid id PK
        uuid assignment_id FK
        uuid enrollment_id FK
        text content "text hoặc link GitHub"
        varchar file_url
        enum status "SUBMITTED / GRADED"
        decimal score
        text feedback "nhận xét của GV"
        timestamptz submitted_at
        timestamptz graded_at
    }
    reviews {
        uuid id PK
        uuid enrollment_id FK, UK
        smallint rating "1 đến 5"
        text comment
    }
```

### 2.4 Bán khoá học

```mermaid
erDiagram
    users ||--o{ orders : "mua (SV)"
    orders ||--|{ order_items : "gồm"
    courses ||--o{ order_items : "được mua"
    order_items |o--o| enrollments : "kích hoạt"
    orders ||--o{ payments : "thanh toán"

    orders {
        uuid id PK
        uuid student_id FK
        varchar order_code UK "gửi sang cổng thanh toán"
        decimal total_amount
        enum status "PENDING / PAID / FAILED / CANCELLED / REFUNDED"
        timestamptz paid_at
    }
    order_items {
        uuid id PK
        uuid order_id FK
        uuid course_id FK
        decimal price "giá tại thời điểm mua"
    }
    payments {
        uuid id PK
        uuid order_id FK
        enum provider "VNPAY / MOMO / BANK_TRANSFER"
        varchar provider_txn_id UK
        decimal amount
        enum status "PENDING / SUCCESS / FAILED"
        jsonb raw_response "payload IPN để đối soát"
    }
```

### 2.5 Chat & thông báo

```mermaid
erDiagram
    users ||--o{ conversations : "là GV"
    users ||--o{ conversations : "là SV"
    conversations ||--o{ messages : "chứa"
    users ||--o{ messages : "gửi"
    users ||--o{ notifications : "nhận"

    conversations {
        uuid id PK
        uuid teacher_id FK "UNIQUE (teacher_id, student_id)"
        uuid student_id FK
        timestamptz last_message_at
    }
    messages {
        uuid id PK
        uuid conversation_id FK
        uuid sender_id FK
        text content
        varchar attachment_url
        timestamptz read_at
        timestamptz created_at
    }
    notifications {
        uuid id PK
        uuid user_id FK
        varchar type "NEW_MESSAGE / ASSIGNMENT_GRADED / ..."
        varchar title
        text body
        varchar link
        timestamptz read_at
    }
```

---

## 3. Các quyết định thiết kế quan trọng

### 3.1 `enrollments` là trung tâm của mọi hoạt động học

Tiến độ (`lesson_progress`), lượt làm bài (`quiz_attempts`), bài nộp (`submissions`) và đánh giá (`reviews`) đều gắn với `enrollment_id`, **không** gắn trực tiếp với `student_id`. Lợi ích:

- Không thể có tiến độ / bài làm cho một khoá mà SV chưa đăng ký — ràng buộc nằm ngay trong khoá ngoại.
- Mọi thứ của "SV X trong khoá Y" nằm dưới một dòng `enrollments` → truy vấn tiến độ đơn giản.
- Kiểm tra quyền của GV chỉ cần một phép JOIN `enrollments → courses.teacher_id`.

### 3.2 Quy tắc "GV chỉ thấy SV và khoá học của chính mình"

Quy tắc này **không** cần bảng riêng — nó được đảm bảo bằng cách *mọi truy vấn phía GV đều lọc theo `courses.teacher_id`*, với `teacher_id` lấy từ JWT của người đang đăng nhập (không bao giờ lấy từ query string hay body do client gửi lên).

```sql
-- (1) Danh sách SV đã đăng ký ít nhất 1 khoá của GV đang đăng nhập
SELECT u.id, u.full_name, u.email, COUNT(e.id) AS so_khoa_da_dang_ky
FROM enrollments e
JOIN courses c ON c.id = e.course_id
JOIN users   u ON u.id = e.student_id
WHERE c.teacher_id = :currentTeacherId
GROUP BY u.id, u.full_name, u.email;

-- (2) Các khoá CỦA GV NÀY mà một SV đã đăng ký
--     (khoá của GV khác không bao giờ lọt vào kết quả)
SELECT c.id, c.title, e.progress_percent, e.enrolled_at
FROM enrollments e
JOIN courses c ON c.id = e.course_id
WHERE e.student_id = :studentId
  AND c.teacher_id = :currentTeacherId;
```

Ở API: nếu GV gọi `GET /api/teacher/students/:studentId` mà SV đó không học khoá nào của GV → trả **404** (không trả 403, để không lộ việc SV đó có tồn tại).

### 3.3 Tách kho câu hỏi khỏi đề thi

- `questions` là **kho** câu hỏi của một khoá. `quizzes` là **đề**. Bảng trung gian `quiz_questions` (N–N) cho phép một câu hỏi dùng lại ở nhiều đề (vd: vừa ở quiz chương 2, vừa ở đề cuối kì).
- Điểm của câu hỏi (`points`) đặt ở `quiz_questions`, vì cùng một câu có thể có trọng số khác nhau ở các đề khác nhau.
- Một bảng `quizzes` phục vụ cả 3 loại: quiz sau bài học (`lesson_id` có giá trị), đề giữa kì và đề cuối kì (`lesson_id = null`), phân biệt bằng cột `type`.

### 3.4 Giữ nguyên dữ liệu lịch sử

- `order_items.price` lưu giá **tại thời điểm mua** — GV đổi giá sau đó không làm sai hoá đơn cũ.
- `questions.deleted_at` (xoá mềm): câu hỏi đã có trong bài làm của SV thì không được xoá cứng, nếu không bài làm cũ sẽ bị hỏng. Nên chặn luôn việc sửa đáp án đúng của câu hỏi đã có người làm.
- Khoá học đã có người mua thì chuyển `status = ARCHIVED`, không xoá.

### 3.5 Tiến độ học tập

`progress_percent` trong `enrollments` là giá trị **cache** (phi chuẩn hoá có chủ đích) để trang "Khoá học của tôi" không phải đếm lại mỗi lần tải. Nguồn dữ liệu gốc vẫn là `lesson_progress`. Mỗi khi SV hoàn thành một bài, tính lại:

```sql
UPDATE enrollments e
SET progress_percent = COALESCE((
    SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE lp.status = 'COMPLETED') / NULLIF(COUNT(*), 0), 2)
    FROM lessons l
    JOIN sections s ON s.id = l.section_id
    LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.enrollment_id = e.id
    WHERE s.course_id = e.course_id
), 0)
WHERE e.id = :enrollmentId;
```

### 3.6 Chat

- Mỗi cặp (GV, SV) có đúng **một** hội thoại (`UNIQUE (teacher_id, student_id)`), giống Messenger — SV học 3 khoá của cùng một GV vẫn chỉ có một khung chat.
- Chỉ được tạo hội thoại khi SV có ít nhất một `enrollment` (không bị huỷ) trong khoá của GV đó — kiểm tra ở tầng service trước khi `INSERT`.
- Lịch sử tin nhắn lấy qua REST (`GET /conversations/:id/messages?before=…`), tin nhắn realtime đi qua Socket.IO.

---

## 4. User story → bảng dữ liệu

| User story | Bảng liên quan |
|---|---|
| GV tạo khoá học, chương, bài, thêm video | `courses`, `sections`, `lessons` |
| GV tạo kho câu hỏi trắc nghiệm | `questions`, `question_options` |
| GV tạo quiz cho bài học, đề giữa kì / cuối kì | `quizzes`, `quiz_questions` |
| GV tạo bài tập thực hành, chấm và nhận xét | `assignments`, `submissions` |
| GV xem danh sách SV đã đăng ký khoá của mình | `enrollments` JOIN `courses` (lọc theo `teacher_id`) |
| GV và SV nhắn tin | `conversations`, `messages` |
| SV mua / đăng ký khoá học | `orders`, `order_items`, `payments`, `enrollments` |
| SV theo dõi tiến độ tất cả khoá đã đăng ký | `enrollments.progress_percent`, `lesson_progress` |
| SV làm bài kiểm tra, xem điểm | `quiz_attempts`, `attempt_answers` |
| *(bổ sung)* SV tìm khoá theo danh mục | `categories` |
| *(bổ sung)* SV đánh giá khoá học | `reviews` |
| *(bổ sung)* Thông báo khi có tin nhắn / được chấm bài | `notifications` |

## 5. Cố ý chưa đưa vào (để giai đoạn sau)

- **Xác thực nâng cao:** `refresh_tokens`, `password_resets`, xác minh email.
- **Giỏ hàng:** giữ ở frontend (localStorage) cho đến khi cần đồng bộ nhiều thiết bị.
- **Mã giảm giá:** `coupons`, `coupon_usages`.
- **Chứng chỉ hoàn thành:** `certificates`.
- **Sinh đề ngẫu nhiên từ kho** (vd: lấy 20 câu ngẫu nhiên, 30% câu khó): bảng `quiz_rules`.
- **Hỏi đáp dưới mỗi bài học:** `lesson_comments`.
- **Doanh thu / chia tiền cho GV** và vai trò **ADMIN** duyệt khoá học.
