import type { UserRole } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { type Actor, assertRole } from "@/server/auth/roles";

export const USERS_PAGE_SIZE = 20;

/** US-05, FR-1.8: danh sách tài khoản, lọc theo vai trò, tìm theo tên hoặc email. */
export async function listUsers(
  actor: Actor | null,
  filter: { role?: UserRole; q?: string; page?: number } = {},
) {
  assertRole(actor, "ADMIN");
  const page = Math.max(1, filter.page ?? 1);
  const q = filter.q?.trim();
  const where = {
    ...(filter.role ? { role: filter.role } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q.toLowerCase() } },
          ],
        }
      : {}),
  };
  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { name: "asc" }],
      skip: (page - 1) * USERS_PAGE_SIZE,
      take: USERS_PAGE_SIZE,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        dateCreated: true,
        teacher: { select: { salaryCoefficient: true } },
      },
    }),
  ]);
  return {
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / USERS_PAGE_SIZE)),
    users: users.map((user) => ({
      ...user,
      salaryCoefficient: user.teacher ? user.teacher.salaryCoefficient.toNumber() : null,
    })),
  };
}
