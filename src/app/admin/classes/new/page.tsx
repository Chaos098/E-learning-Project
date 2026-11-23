import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { firstParam } from "@/lib/params";
import { requireActor } from "@/server/auth/session";
import { openClassAction } from "@/server/classes/actions";
import { listActiveTeachers, listCoursesForNewClass } from "@/server/classes/queries";

import { ClassForm } from "../_components/class-form";

export const metadata: Metadata = { title: "Mở lớp" };

/** US-12: Admin mở lớp cho một môn học và phân công giảng viên. */
export default async function NewClassPage({ searchParams }: PageProps<"/admin/classes/new">) {
  const actor = await requireActor("ADMIN");
  const [courses, teachers] = await Promise.all([listCoursesForNewClass(actor), listActiveTeachers(actor)]);
  const courseId = firstParam((await searchParams).courseId);

  return (
    <>
      <PageHeader
        title="Mở lớp"
        description="Lớp mới ở trạng thái Nhận đăng ký; hệ thống tự tạo đề thi cuối kỳ (chưa mở) cho lớp."
      />
      {courses.length === 0 || teachers.length === 0 ? (
        <div className="max-w-xl rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p>
            {courses.length === 0 ? "Chưa có môn học nào để mở lớp. " : ""}
            {teachers.length === 0 ? "Chưa có giảng viên nào đang hoạt động. " : ""}
          </p>
          <div className="mt-3 flex gap-2">
            {courses.length === 0 ? (
              <Link href="/admin/courses" className={buttonVariants({ size: "sm", variant: "outline" })}>
                Tạo môn học
              </Link>
            ) : null}
            {teachers.length === 0 ? (
              <Link href="/admin/users" className={buttonVariants({ size: "sm", variant: "outline" })}>
                Tạo giảng viên
              </Link>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="max-w-3xl rounded-lg border border-neutral-200 p-4">
          <ClassForm
            action={openClassAction}
            submitLabel="Mở lớp"
            initial={{ courseId: courseId ?? "" }}
            courses={courses.map((course) => ({
              id: course.id,
              label: `${course.name}${course.status === "DRAFT" ? " (nháp)" : ""}${course.dateEnd ? ` · ngừng mở lớp từ ${formatDate(course.dateEnd)}` : ""}`,
            }))}
            teachers={teachers.map((teacher) => ({
              id: teacher.id,
              label: `${teacher.name} (${teacher.email})`,
            }))}
          />
        </div>
      )}
    </>
  );
}
