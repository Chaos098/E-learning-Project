"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/** Mục menu bên trái; mục đang mở được tô đậm và có `aria-current`. */
export function NavLink({
  href,
  children,
  exact,
}: {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "block rounded-md px-3 py-2 text-sm",
        active ? "bg-neutral-900 font-medium text-white" : "text-neutral-700 hover:bg-neutral-100",
      )}
    >
      {children}
    </Link>
  );
}
