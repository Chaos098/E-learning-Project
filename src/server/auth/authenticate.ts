import type { UserRole } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export type AuthenticateResult =
  | { status: "ok"; user: { id: number; email: string; name: string; role: UserRole } }
  | { status: "invalid" }
  | { status: "locked" };

/**
 * Kiểm tra email + mật khẩu (US-02).
 * Sai email hoặc sai mật khẩu đều trả về "invalid" để không lộ email nào đã tồn tại.
 * Tài khoản LOCKED chỉ bị báo khoá khi đã nhập đúng mật khẩu.
 */
export async function authenticate(email: string, password: string): Promise<AuthenticateResult> {
  const user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) return { status: "invalid" };
  const matches = await verifyPassword(password, user.hashedPwd);
  if (!matches) return { status: "invalid" };
  if (user.status === "LOCKED") return { status: "locked" };
  return { status: "ok", user: { id: user.id, email: user.email, name: user.name, role: user.role } };
}
