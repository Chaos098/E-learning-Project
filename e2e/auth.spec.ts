import { expect, test } from "@playwright/test";

import { ACCOUNTS, formAlert, login, logout, menuItems, uniqueSuffix } from "./helpers";

test.describe("US-02, US-03: đăng nhập theo 3 vai trò", () => {
  const cases = [
    {
      role: "Admin",
      email: ACCOUNTS.admin,
      home: "/admin",
      menu: ["Tổng quan", "Tài khoản", "Môn học", "Lớp học"],
    },
    { role: "Giảng viên", email: ACCOUNTS.teacher, home: "/teacher", menu: ["Lớp của tôi"] },
    {
      role: "Học viên",
      email: ACCOUNTS.student,
      home: "/student",
      menu: ["Môn học của tôi", "Danh mục môn học"],
    },
  ];

  for (const item of cases) {
    test(`${item.role} đăng nhập, về đúng trang chủ và thấy menu riêng`, async ({ page }) => {
      await login(page, item.email);
      await expect(page).toHaveURL(item.home);
      expect(await menuItems(page)).toEqual(item.menu);
    });
  }

  test("sai mật khẩu báo lỗi chung, không cho biết email có tồn tại", async ({ page }) => {
    await login(page, ACCOUNTS.admin, "sai-mat-khau");
    await expect(formAlert(page)).toHaveText(/Email hoặc mật khẩu không đúng/);
    await login(page, "khong-ton-tai@e2e.local", "sai-mat-khau");
    await expect(formAlert(page)).toHaveText(/Email hoặc mật khẩu không đúng/);
  });

  test("khách vào khu vực Admin bị chuyển về đăng nhập, đăng nhập xong quay lại đúng trang", async ({
    page,
  }) => {
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fadmin%2Fusers/);
    await page.getByLabel("Email").fill(ACCOUNTS.admin);
    await page.getByLabel("Mật khẩu").fill("matkhau123");
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    await expect(page).toHaveURL("/admin/users");
  });

  test("học viên vào khu vực Admin và giảng viên thấy trang 403", async ({ page }) => {
    await login(page, ACCOUNTS.student);
    await expect(page).toHaveURL("/student");
    const response = await page.goto("/admin");
    expect(response?.status()).toBe(403);
    await expect(page.getByRole("heading", { name: "Bạn không có quyền truy cập trang này" })).toBeVisible();
    expect((await page.goto("/teacher"))?.status()).toBe(403);
  });

  test("đăng xuất rồi không vào lại được khu vực riêng", async ({ page }) => {
    await login(page, ACCOUNTS.teacher);
    await expect(page).toHaveURL("/teacher");
    await logout(page);
    await page.goto("/teacher");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("US-01: khách đăng ký tài khoản học viên", () => {
  test("đăng ký thành công thì vào thẳng trang học viên; email trùng bị báo lỗi", async ({ page }) => {
    const email = `hv-${uniqueSuffix()}@e2e.local`;
    await page.goto("/register");
    await page.getByLabel("Họ tên").fill("Học viên E2E");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mật khẩu", { exact: true }).fill("matkhau123");
    await page.getByLabel("Nhập lại mật khẩu").fill("matkhau123");
    await page.getByRole("button", { name: "Đăng ký" }).click();
    await expect(page).toHaveURL("/student");
    await expect(page.getByTestId("current-user")).toHaveText("Học viên E2E");

    await logout(page);
    await page.goto("/register");
    await page.getByLabel("Họ tên").fill("Trùng email");
    await page.getByLabel("Email").fill(email.toUpperCase());
    await page.getByLabel("Mật khẩu", { exact: true }).fill("matkhau123");
    await page.getByLabel("Nhập lại mật khẩu").fill("matkhau123");
    await page.getByRole("button", { name: "Đăng ký" }).click();
    await expect(formAlert(page)).toHaveText(/đã được dùng/);
    await expect(page.getByLabel("Họ tên")).toHaveValue("Trùng email");
  });
});
