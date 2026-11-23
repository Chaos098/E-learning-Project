// Dọn dữ liệu do kịch bản E2E tạo ra (tên bắt đầu bằng "E2E", email @e2e.local), giữ nguyên dữ liệu mẫu.
// Được e2e/global-teardown.ts gọi sau khi chạy Playwright; chạy tay: npx tsx scripts/e2e-cleanup.ts
import "dotenv/config";

import { rm } from "node:fs/promises";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const classFilter = { OR: [{ name: { startsWith: "E2E" } }, { course: { name: { startsWith: "E2E" } } }] };
  const lessons = await db.lesson.findMany({
    where: { section: { course: { name: { startsWith: "E2E" } } }, attachmentUrl: { not: null } },
    select: { attachmentUrl: true },
  });
  const uploadRoot = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
  for (const lesson of lessons) {
    const file = path.resolve(uploadRoot, lesson.attachmentUrl!);
    if (file.startsWith(uploadRoot + path.sep)) await rm(file, { force: true });
  }
  await db.exam.deleteMany({ where: { class: classFilter } });
  await db.class.deleteMany({ where: classFilter });
  await db.course.deleteMany({ where: { name: { startsWith: "E2E" } } });
  const users = await db.user.deleteMany({ where: { email: { endsWith: "@e2e.local" } } });
  console.log(`Đã dọn dữ liệu E2E (${users.count} tài khoản).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
