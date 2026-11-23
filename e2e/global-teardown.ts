import { execSync } from "node:child_process";

/** Dọn dữ liệu do E2E tạo ra; chạy bằng tsx vì Prisma Client là module ESM. */
export default function globalTeardown() {
  execSync("npx tsx scripts/e2e-cleanup.ts", { stdio: "inherit" });
}
