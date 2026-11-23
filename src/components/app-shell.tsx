import Link from "next/link";

import { NavLink } from "@/components/nav-link";
import type { UserRole } from "@/generated/prisma/client";
import { logoutAction } from "@/server/accounts/actions";
import { type Actor, ROLE_LABELS } from "@/server/auth/roles";

type NavItem = { href: string; label: string; exact?: boolean };

/** Menu theo vai trò (wireframe mục 3). Mục chưa làm sẽ được thêm ở sprint tương ứng. */
const NAV: Record<UserRole, NavItem[]> = {
  ADMIN: [
    { href: "/admin", label: "Tổng quan", exact: true },
    { href: "/admin/users", label: "Tài khoản" },
    { href: "/admin/courses", label: "Môn học" },
    { href: "/admin/classes", label: "Lớp học" },
  ],
  TEACHER: [{ href: "/teacher", label: "Lớp của tôi" }],
  STUDENT: [
    { href: "/student", label: "Môn học của tôi", exact: true },
    { href: "/courses", label: "Danh mục môn học" },
  ],
};

function NavList({ role }: { role: UserRole }) {
  return (
    <ul className="grid gap-1">
      {NAV[role].map((item) => (
        <li key={item.href}>
          <NavLink href={item.href} exact={item.exact}>
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="w-full rounded-md px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
      >
        Đăng xuất
      </button>
    </form>
  );
}

/** Khung trang sau khi đăng nhập: thanh trên, menu trái (trên điện thoại thu thành nút ☰). */
export function AppShell({ actor, children }: { actor: Actor; children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
        <div className="flex h-14 items-center gap-3 px-4">
          <details className="relative md:hidden">
            <summary
              className="cursor-pointer list-none rounded-md px-2 py-1 text-lg hover:bg-neutral-100"
              aria-label="Mở menu"
            >
              ☰
            </summary>
            <div className="absolute top-10 left-0 w-64 rounded-lg border border-neutral-200 bg-white p-2 shadow-lg">
              <nav aria-label="Menu">
                <NavList role={actor.role} />
              </nav>
              <hr className="my-2 border-neutral-200" />
              <LogoutButton />
            </div>
          </details>
          <Link href="/" className="font-bold tracking-tight">
            E-Learning
          </Link>
          <div className="ml-auto text-right text-sm leading-tight">
            <p className="font-medium" data-testid="current-user">
              {actor.name}
            </p>
            <p className="text-xs text-neutral-500">{ROLE_LABELS[actor.role]}</p>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 border-r border-neutral-200 bg-neutral-50 p-3 md:flex md:flex-col">
          <nav aria-label="Menu" className="flex-1">
            <NavList role={actor.role} />
          </nav>
          <LogoutButton />
        </aside>
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

/** Tiêu đề trang kèm nút chính bên phải. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description ? <div className="mt-1 text-sm text-neutral-600">{description}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
