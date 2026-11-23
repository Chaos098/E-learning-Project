import { expect, test } from "@playwright/test";

import { ACCOUNTS, formAlert, login, logout, openDetails, uniqueSuffix } from "./helpers";

function dateFromToday(days: number) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
  return new Date(new Date(`${today}T00:00:00Z`).getTime() + days * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Demo cuối Sprint 1: Admin tạo môn học có chương và bài học, mở lớp và giao cho giảng viên;
 * khách thấy lớp đang nhận đăng ký; giảng viên thấy lớp được phân công (US-05, US-07 → US-13, US-29).
 */
test("Admin tạo môn → mở lớp → khách thấy lớp → giảng viên thấy lớp", async ({ page }) => {
  test.setTimeout(120_000);
  const suffix = uniqueSuffix();
  const courseName = `E2E Môn ${suffix}`;
  const className = `E2E-${suffix}`.slice(0, 20);
  const teacherName = `GV E2E ${suffix}`;
  const teacherEmail = `gv-${suffix}@e2e.local`;

  await login(page, ACCOUNTS.admin);
  await expect(page).toHaveURL("/admin");

  // US-05: tạo giảng viên mới
  await page.goto("/admin/users");
  const teacherPanel = page.locator("details", { hasText: "Tạo tài khoản giảng viên" });
  await openDetails(teacherPanel);
  await teacherPanel.getByLabel("Họ tên").fill(teacherName);
  await teacherPanel.getByLabel("Email").fill(teacherEmail);
  await teacherPanel.getByLabel("Mật khẩu ban đầu").fill("matkhau123");
  await teacherPanel.getByLabel("Hệ số lương").fill("1,8");
  await teacherPanel.getByRole("button", { name: "Tạo giảng viên" }).click();
  await expect(teacherPanel.getByRole("status")).toContainText(teacherEmail);

  // US-07: tạo môn học đang mở
  await page.goto("/admin/courses");
  const coursePanel = page.locator("details", { hasText: "Tạo môn học" });
  await openDetails(coursePanel);
  await coursePanel.getByLabel("Tên môn học").fill(courseName);
  await coursePanel.getByLabel("Mô tả").fill("Môn học tạo bởi kịch bản E2E.");
  await coursePanel.getByLabel("Trạng thái").selectOption("PUBLISHED");
  await coursePanel.getByRole("button", { name: "Tạo môn học" }).click();
  await expect(page).toHaveURL(/\/admin\/courses\/\d+$/);
  await expect(page.getByRole("heading", { level: 1, name: courseName })).toBeVisible();

  // US-08: thêm chương
  await page.getByLabel("Tên chương").fill("Làm quen");
  await page.getByRole("button", { name: "Thêm chương" }).click();
  await expect(page.getByRole("heading", { name: "Chương 1: Làm quen" })).toBeVisible();

  // US-09: thêm bài học có video, văn bản và file đính kèm
  await openDetails(page.locator("details", { hasText: "+ Thêm bài học vào chương 1" }));
  await page.getByLabel("Tên bài học").fill("Bài mở đầu");
  await page.getByLabel("Link video (YouTube / Google Drive)").fill("https://www.youtube.com/watch?v=e2e");
  await page.getByLabel("Nội dung văn bản").fill("Nội dung bài mở đầu.");
  await page.getByLabel("File đính kèm").setInputFiles({
    name: "bai-giang.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 E2E"),
  });
  await page.getByRole("button", { name: "Thêm bài học" }).click();
  const lessonLink = page.getByRole("link", { name: /Bài 1\.1: Bài mở đầu/ });
  await expect(lessonLink).toBeVisible();
  await expect(lessonLink).toContainText("video + văn bản + file");
  const lessonId = (await lessonLink.getAttribute("href"))?.split("/").pop();

  // NFR-05: file sai định dạng bị từ chối
  await openDetails(page.locator("details", { hasText: "+ Thêm bài học vào chương 1" }));
  await page.getByLabel("Tên bài học").fill("Bài lỗi");
  await page.getByLabel("File đính kèm").setInputFiles({
    name: "virus.exe",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("MZ"),
  });
  await page.getByRole("button", { name: "Thêm bài học" }).click();
  await expect(formAlert(page).filter({ hasText: "Chỉ nhận file" })).toBeVisible();

  // US-12, US-29: mở lớp, phân công giảng viên mới; đề thi cuối kỳ tự tạo ở trạng thái chưa mở
  await page.goto("/admin/classes/new");
  await page.getByLabel("Môn học").selectOption({ label: courseName });
  await page.getByLabel("Giảng viên").selectOption({ label: `${teacherName} (${teacherEmail})` });
  await page.getByLabel("Tên lớp").fill(className);
  await page.getByLabel("Học phí (đồng)").fill("2.000.000");
  await page.getByLabel("Tiền cọc (đồng)").fill("2.500.000");
  await page.getByLabel("Sĩ số tối thiểu").fill("5");
  await page.getByLabel("Sĩ số tối đa").fill("30");
  await page.getByLabel("Ngày khai giảng").fill(dateFromToday(20));
  await page.getByLabel("Ngày kết thúc").fill(dateFromToday(80));
  await page.getByRole("button", { name: "Mở lớp" }).click();
  await expect(page.getByText("Tiền cọc không được lớn hơn học phí.")).toBeVisible();
  await expect(page.getByLabel("Tên lớp")).toHaveValue(className);

  await page.getByLabel("Tiền cọc (đồng)").fill("500.000");
  await page.getByRole("button", { name: "Mở lớp" }).click();
  await expect(page).toHaveURL(/\/admin\/classes\/\d+$/);
  await expect(page.getByRole("heading", { level: 1, name: `Lớp ${className}` })).toBeVisible();
  await expect(page.getByTestId("class-exam")).toContainText("Chưa mở");

  // Đăng xuất, khách xem danh mục và chi tiết môn học (US-10, US-11)
  await logout(page);
  expect((await page.request.get(`/api/lessons/${lessonId}/attachment`)).status()).toBe(401);

  await page.goto("/courses");
  await page.getByLabel("Tìm theo tên môn học").fill(suffix);
  await page.getByRole("button", { name: "Tìm" }).click();
  await page.getByRole("link", { name: new RegExp(courseName) }).click();
  await expect(page.getByRole("heading", { level: 1, name: courseName })).toBeVisible();
  await expect(page.getByText("Bài 1.1: Bài mở đầu")).toBeVisible();
  await expect(page.getByText("Nội dung bài mở đầu.")).toHaveCount(0);
  const openClass = page.getByTestId("open-class").filter({ hasText: className });
  await expect(openClass).toContainText(`GV ${teacherName}`);
  await expect(openClass).toContainText("2.000.000 ₫");
  await expect(openClass).toContainText("500.000 ₫");
  await expect(openClass).toContainText("Còn 30 / 30 chỗ");
  await expect(page.getByRole("link", { name: "Đăng nhập để đăng ký" })).toBeVisible();

  // US-13: giảng viên thấy lớp được phân công và tải được file bài học của môn mình dạy
  await login(page, teacherEmail);
  await expect(page).toHaveURL("/teacher");
  const myClass = page.getByTestId("teacher-class").filter({ hasText: className });
  await expect(myClass).toContainText(courseName);
  await expect(myClass).toContainText("Sĩ số 0 / 30");
  await myClass.getByRole("link", { name: "Vào lớp" }).click();
  await expect(page.getByRole("heading", { level: 1, name: `Lớp ${className}` })).toBeVisible();
  await expect(page.getByText("Lớp chưa có học viên đăng ký.")).toBeVisible();
  const download = await page.request.get(`/api/lessons/${lessonId}/attachment`);
  expect(download.status()).toBe(200);
  expect(download.headers()["content-type"]).toBe("application/pdf");
});

test("US-05: Admin khoá tài khoản thì người đó không đăng nhập được, mở khoá thì đăng nhập lại được", async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  const email = `khoa-${suffix}@e2e.local`;

  await page.goto("/register");
  await page.getByLabel("Họ tên").fill(`Khoá ${suffix}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("matkhau123");
  await page.getByLabel("Nhập lại mật khẩu").fill("matkhau123");
  await page.getByRole("button", { name: "Đăng ký" }).click();
  await expect(page).toHaveURL("/student");
  await page.context().clearCookies();

  await login(page, ACCOUNTS.admin);
  await expect(page).toHaveURL("/admin");
  await page.goto(`/admin/users?q=${encodeURIComponent(email)}`);
  const row = page.getByTestId(`user-row-${email}`);
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Khoá" }).click();
  await expect(row).toContainText("Đã khoá");
  await page.context().clearCookies();

  await login(page, email);
  await expect(formAlert(page)).toHaveText(/Tài khoản đã bị khoá/);

  await login(page, ACCOUNTS.admin);
  await expect(page).toHaveURL("/admin");
  await page.goto(`/admin/users?q=${encodeURIComponent(email)}`);
  await page.getByTestId(`user-row-${email}`).getByRole("button", { name: "Mở khoá" }).click();
  await expect(page.getByTestId(`user-row-${email}`)).toContainText("Hoạt động");
  await page.context().clearCookies();

  await login(page, email);
  await expect(page).toHaveURL("/student");
});
