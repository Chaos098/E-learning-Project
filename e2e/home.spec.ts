import { expect, test } from "@playwright/test";

test("trang chủ hiển thị và kết nối được CSDL", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "E-Learning" })).toBeVisible();
  await expect(page.getByTestId("app-status")).toHaveText("Đang chạy");
  await expect(page.getByTestId("db-status")).toContainText("Đã kết nối");
});

test("API kiểm tra sức khoẻ trả về ok", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ app: "ok", database: "ok" });
});
