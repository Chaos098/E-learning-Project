import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    // Nạp .env để test tích hợp kết nối được CSDL Docker (npm run db:up).
    setupFiles: ["./vitest.setup.ts"],
    // Test tích hợp dùng chung một CSDL; mỗi file tự tạo và dọn dữ liệu của mình.
    fileParallelism: false,
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "e2e", ".next", "src/generated"],
  },
});
