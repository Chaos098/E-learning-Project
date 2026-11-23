import "server-only";

import { redirect } from "next/navigation";

import type { UserRole } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { auth } from "@/server/auth/config";
import type { Actor } from "@/server/auth/roles";

/**
 * Người dùng hiện tại, đọc lại từ CSDL ở mỗi request.
 * Trả về null nếu chưa đăng nhập, tài khoản không còn hoặc đã bị khoá.
 */
export async function getActor(): Promise<Actor | null> {
  const session = await auth();
  const uid = session?.user?.uid;
  if (typeof uid !== "number") return null;
  const user = await db.user.findUnique({
    where: { id: uid },
    select: { id: true, role: true, name: true, email: true, status: true },
  });
  if (!user || user.status !== "ACTIVE") return null;
  return { id: user.id, role: user.role, name: user.name, email: user.email };
}

/**
 * Dùng ở đầu trang và server action (US-03): chưa đăng nhập thì về /login,
 * sai vai trò thì về trang 403.
 */
export async function requireActor(...roles: UserRole[]): Promise<Actor> {
  const actor = await getActor();
  if (!actor) redirect("/login");
  if (roles.length > 0 && !roles.includes(actor.role)) redirect("/403");
  return actor;
}
