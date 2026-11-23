import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { requireActor } from "@/server/auth/session";

export const metadata: Metadata = { title: "Môn học của tôi" };

/** Trang chủ học viên. Danh sách lớp đã đăng ký và tiến độ học có từ Sprint 2 (US-23, US-24). */
export default async function StudentHomePage() {
  const actor = await requireActor("STUDENT");
  return (
    <>
      <PageHeader title="Môn học của tôi" description={`Xin chào, ${actor.name}.`} />
      <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center">
        <p className="text-neutral-600">Bạn chưa đăng ký lớp nào.</p>
        <Link href="/courses" className={buttonVariants({ className: "mt-4" })}>
          Xem danh mục môn học
        </Link>
      </div>
    </>
  );
}
