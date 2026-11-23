import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { homePathFor } from "@/server/auth/roles";
import { getActor } from "@/server/auth/session";

export const metadata: Metadata = { title: "Không có quyền truy cập" };

/** Trang 403 (US-03): người dùng đăng nhập nhưng vào khu vực của vai trò khác. */
export default async function ForbiddenPage() {
  const actor = await getActor();
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <p className="text-5xl font-bold text-neutral-300">403</p>
      <h1 className="text-xl font-semibold">Bạn không có quyền truy cập trang này</h1>
      <p className="text-sm text-neutral-600">Trang này dành cho vai trò khác. Hãy quay về trang của bạn.</p>
      <Link href={actor ? homePathFor(actor.role) : "/"} className={buttonVariants()}>
        {actor ? "Về trang của tôi" : "Về trang chủ"}
      </Link>
    </main>
  );
}
