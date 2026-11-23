import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatDateTime, formatVnd, toDateInputValue } from "@/lib/format";
import { idParam } from "@/lib/params";
import { requireActor } from "@/server/auth/session";
import { changeTeacherAction, updateClassAction } from "@/server/classes/actions";
import { adminGetClass, listActiveTeachers } from "@/server/classes/queries";
import { NotFoundError } from "@/server/errors";

import { ClassForm } from "../_components/class-form";
import { ChangeTeacherForm } from "./change-teacher-form";

export const metadata: Metadata = { title: "Lớp học" };

/** US-12, US-29, FR-3.2: chi tiết lớp, sửa lớp đang nhận đăng ký, đổi giảng viên, đề thi cuối kỳ của lớp. */
export default async function AdminClassDetailPage({ params }: PageProps<"/admin/classes/[id]">) {
  const actor = await requireActor("ADMIN");
  const id = idParam((await params).id);
  if (!id) notFound();
  const [item, teachers] = await Promise.all([
    adminGetClass(actor, id).catch((error: unknown) => {
      if (error instanceof NotFoundError) notFound();
      throw error;
    }),
    listActiveTeachers(actor),
  ]);
  const teacherOptions = teachers.map((teacher) => ({
    id: teacher.id,
    label: `${teacher.name} (${teacher.email})`,
  }));
  const editable = item.status === "UPCOMING";
  const canChangeTeacher = item.status === "UPCOMING" || item.status === "ONGOING";

  return (
    <>
      <nav aria-label="Đường dẫn" className="mb-2 text-sm text-neutral-500">
        <Link href="/admin/classes" className="hover:underline">
          Lớp học
        </Link>{" "}
        / <span className="text-neutral-800">{item.name}</span>
      </nav>
      <PageHeader
        title={`Lớp ${item.name}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={item.status} />
            <Link href={`/admin/courses/${item.course.id}`} className="underline">
              {item.course.name}
            </Link>
            · mở ngày {formatDateTime(item.dateCreated)} bởi {item.admin.user.name}
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section aria-labelledby="class-info-heading" className="rounded-lg border border-neutral-200 p-4">
          <h2 id="class-info-heading" className="mb-4 font-semibold">
            {editable ? "Thông tin lớp" : "Thông tin lớp (chỉ xem)"}
          </h2>
          {editable ? (
            <ClassForm
              action={updateClassAction.bind(null, item.id)}
              teachers={teacherOptions}
              submitLabel="Lưu thông tin lớp"
              initial={{
                teacherId: String(item.teacherId),
                name: item.name,
                tuitionFee: String(item.tuitionFee),
                depositAmount: String(item.depositAmount),
                minStudents: String(item.minStudents),
                maxStudents: String(item.maxStudents),
                startDate: toDateInputValue(item.startDate),
                endDate: toDateInputValue(item.endDate),
              }}
            />
          ) : (
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-neutral-500">Giảng viên</dt>
              <dd>{item.teacher.user.name}</dd>
              <dt className="text-neutral-500">Học phí</dt>
              <dd>{formatVnd(item.tuitionFee)}</dd>
              <dt className="text-neutral-500">Tiền cọc</dt>
              <dd>{formatVnd(item.depositAmount)}</dd>
              <dt className="text-neutral-500">Sĩ số</dt>
              <dd>
                tối thiểu {item.minStudents} · tối đa {item.maxStudents}
              </dd>
              <dt className="text-neutral-500">Thời gian</dt>
              <dd>
                {formatDate(item.startDate)} – {formatDate(item.endDate)}
              </dd>
            </dl>
          )}
        </section>

        <div className="grid content-start gap-6">
          <section
            aria-labelledby="enrolment-heading"
            className="rounded-lg border border-neutral-200 p-4 text-sm"
          >
            <h2 id="enrolment-heading" className="mb-2 font-semibold">
              Sĩ số
            </h2>
            <p>
              <span className="text-2xl font-bold">{item.studentCount}</span> / {item.maxStudents} học viên đã
              cọc hoặc trả đủ
            </p>
            <p className="mt-1 text-neutral-600">
              Cần tối thiểu {item.minStudents} học viên trước ngày khai giảng {formatDate(item.startDate)}.
            </p>
          </section>

          {canChangeTeacher && !editable ? (
            <section aria-labelledby="teacher-heading" className="rounded-lg border border-neutral-200 p-4">
              <h2 id="teacher-heading" className="mb-3 font-semibold">
                Đổi giảng viên
              </h2>
              <ChangeTeacherForm
                action={changeTeacherAction.bind(null, item.id)}
                teachers={teacherOptions}
                currentTeacherId={item.teacherId}
              />
            </section>
          ) : null}

          <section
            aria-labelledby="exam-heading"
            className="rounded-lg border border-neutral-200 p-4 text-sm"
            data-testid="class-exam"
          >
            <h2 id="exam-heading" className="mb-2 font-semibold">
              Đề thi cuối kỳ
            </h2>
            {item.exam ? (
              <>
                <p className="flex items-center gap-2">
                  Trạng thái: <StatusBadge status={item.exam.status} />
                </p>
                <p className="mt-1 text-neutral-600">
                  {item.exam.status === "DISABLED"
                    ? "Đề được tạo sẵn khi mở lớp, học viên chưa thấy. Lên lịch thi và random câu hỏi sẽ có khi có ngân hàng câu hỏi."
                    : (item.exam.name ?? "")}
                </p>
              </>
            ) : (
              <p className="text-red-700">Lớp chưa có đề thi cuối kỳ.</p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
