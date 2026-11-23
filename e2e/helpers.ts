import { expect, type Locator, type Page } from "@playwright/test";

/** Mật khẩu chung của tài khoản mẫu trong prisma/seed.ts (chỉ dùng trên máy cá nhân). */
export const DEMO_PASSWORD = "matkhau123";

export const ACCOUNTS = {
  admin: "admin@elearning.local",
  teacher: "gv.tranb@elearning.local",
  student: "hv01@elearning.local",
} as const;

export function uniqueSuffix() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export async function login(page: Page, email: string, password = DEMO_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu").fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
}

/** Trên điện thoại menu thu vào nút ☰; mở nó ra trước khi tìm mục menu. */
export async function openMenu(page: Page) {
  const toggle = page.getByLabel("Mở menu");
  if (await toggle.isVisible()) await toggle.click();
}

/** Danh sách mục menu đang hiển thị. */
export async function menuItems(page: Page) {
  await openMenu(page);
  const nav = page.getByRole("navigation", { name: "Menu" }).filter({ visible: true });
  await expect(nav).toBeVisible();
  return nav.getByRole("link").allTextContents();
}

/** Thông báo lỗi của form (không lẫn với vùng thông báo chuyển trang của Next, cũng có role="alert"). */
export function formAlert(page: Page | Locator) {
  return page.locator('p[role="alert"]');
}

/** Mở một khối <details> (bấm vào summary sẽ đóng lại nếu nó đang mở sẵn). */
export async function openDetails(details: Locator) {
  await details.evaluate((element) => {
    (element as HTMLDetailsElement).open = true;
  });
}

export async function logout(page: Page) {
  await openMenu(page);
  await page.getByRole("button", { name: "Đăng xuất" }).filter({ visible: true }).click();
  await expect(page).toHaveURL("/");
}
