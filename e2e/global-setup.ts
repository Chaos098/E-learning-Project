import { execSync } from "node:child_process";

/** Đảm bảo CSDL có dữ liệu mẫu (tài khoản demo) trước khi chạy E2E. Seed tự bỏ qua nếu đã có. */
export default function globalSetup() {
  execSync("npx prisma db seed", { stdio: "inherit" });
}
