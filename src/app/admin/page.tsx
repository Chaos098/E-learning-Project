import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/app-shell";
import { requireActor } from "@/server/auth/session";
import { adminOverview } from "@/server/classes/queries";

export const metadata: Metadata = { title: "Tổng quan" };

function StatCard({
  label,
  value,
  detail,
  href,
}: {
  label: string;
  value: number;
  detail?: string;
  href: string;
}) {
  return (
    <Link href={href} className="rounded-lg border border-neutral-200 p-4 hover:border-neutral-400">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {detail ? <p className="mt-1 text-xs text-neutral-500">{detail}</p> : null}
    </Link>
  );
}

export default async function AdminHomePage() {
  const actor = await requireActor("ADMIN");
  const stats = await adminOverview(actor);
  return (
    <>
      <PageHeader title="Tổng quan" description={`Xin chào, ${actor.name}.`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Người dùng"
          value={stats.admins + stats.teachers + stats.students}
          detail={`${stats.admins} Admin · ${stats.teachers} giảng viên · ${stats.students} học viên`}
          href="/admin/users"
        />
        <StatCard
          label="Môn học đang mở"
          value={stats.publishedCourses}
          detail={`${stats.draftCourses} môn đang soạn`}
          href="/admin/courses"
        />
        <StatCard
          label="Lớp nhận đăng ký"
          value={stats.upcomingClasses}
          href="/admin/classes?status=UPCOMING"
        />
        <StatCard label="Lớp đang học" value={stats.ongoingClasses} href="/admin/classes?status=ONGOING" />
      </div>
    </>
  );
}
