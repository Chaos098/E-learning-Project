// Chuẩn bị môi trường chạy trên máy cá nhân: file .env, CSDL trong Docker, Prisma Client, migration.
import { execSync } from "node:child_process";
import { copyFileSync, existsSync, readdirSync } from "node:fs";

function run(command) {
  console.log(`\n> ${command}`);
  execSync(command, { stdio: "inherit" });
}

if (!existsSync(".env")) {
  copyFileSync(".env.example", ".env");
  console.log("Đã tạo file .env từ .env.example");
}

if (!existsSync("node_modules")) {
  run("npm install");
}

try {
  run("docker compose up -d --wait db");
} catch {
  console.error("\nKhông khởi động được CSDL. Hãy mở Docker Desktop rồi chạy lại lệnh này.");
  process.exit(1);
}

run("npx prisma generate");

const hasMigrations =
  existsSync("prisma/migrations") && readdirSync("prisma/migrations").some((name) => !name.startsWith("."));
if (hasMigrations) {
  run("npx prisma migrate deploy");
} else {
  console.log("\nChưa có migration nào — bỏ qua bước cập nhật CSDL.");
}

console.log("\nMôi trường đã sẵn sàng. Mở http://localhost:3000 sau khi chạy `npm run dev`.");
