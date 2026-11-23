import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { homePathFor } from "@/server/auth/roles";
import { getActor } from "@/server/auth/session";

/** Thanh đầu trang công khai (wireframe mục 3). */
export async function SiteHeader() {
  const actor = await getActor();
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="font-bold tracking-tight">
          E-Learning
        </Link>
        <nav aria-label="Chính" className="flex-1">
          <Link href="/courses" className="text-sm text-neutral-700 hover:text-neutral-950">
            Môn học
          </Link>
        </nav>
        {actor ? (
          <Link href={homePathFor(actor.role)} className={buttonVariants({ size: "sm" })}>
            Vào trang của tôi
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Đăng nhập
            </Link>
            <Link href="/register" className={buttonVariants({ size: "sm" })}>
              Đăng ký
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
