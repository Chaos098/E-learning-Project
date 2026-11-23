import type { UserRole } from "@/generated/prisma/client";
import { ForbiddenError } from "@/server/errors";

/** Người đang thao tác, lấy từ phiên đăng nhập đã kiểm tra với CSDL. */
export type Actor = { id: number; role: UserRole; name: string; email: string };

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  TEACHER: "Giảng viên",
  STUDENT: "Học viên",
};

/** Trang chủ của từng vai trò sau khi đăng nhập (FR-1.5). */
export function homePathFor(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "TEACHER":
      return "/teacher";
    case "STUDENT":
      return "/student";
  }
}

/** Vai trò bắt buộc của một đường dẫn; `null` nếu là trang công khai. */
export function requiredRoleForPath(pathname: string): UserRole | null {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "ADMIN";
  if (pathname === "/teacher" || pathname.startsWith("/teacher/")) return "TEACHER";
  if (pathname === "/student" || pathname.startsWith("/student/")) return "STUDENT";
  return null;
}

/** Ném ForbiddenError nếu người thao tác không thuộc một trong các vai trò cho phép. */
export function assertRole(actor: Actor | null, ...roles: UserRole[]): asserts actor is Actor {
  if (!actor || !roles.includes(actor.role)) {
    throw new ForbiddenError();
  }
}

/**
 * Chỉ chấp nhận đường dẫn nội bộ ("/courses/1"), chặn chuyển hướng ra trang ngoài
 * ("//evil.com", "https://…") và chặn đường dẫn của vai trò khác.
 */
export function safeCallbackPath(callbackUrl: string | null | undefined, role: UserRole): string {
  const fallback = homePathFor(role);
  if (
    !callbackUrl ||
    !callbackUrl.startsWith("/") ||
    callbackUrl.startsWith("//") ||
    callbackUrl.includes("\\")
  ) {
    return fallback;
  }
  const pathname = callbackUrl.split(/[?#]/)[0] ?? "/";
  if (pathname === "/login" || pathname === "/register") return fallback;
  const required = requiredRoleForPath(pathname);
  if (required && required !== role) return fallback;
  return callbackUrl;
}
