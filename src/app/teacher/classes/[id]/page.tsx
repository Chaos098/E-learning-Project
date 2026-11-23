import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/app-shell";
import { DataTable, DataTableBody, DataTableHead, EmptyRow, Td, Th, Tr } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatVnd } from "@/lib/format";
import { idParam } from "@/lib/params";
import { requireActor } from "@/server/auth/session";
import { teacherGetClass } from "@/server/classes/queries";
import { NotFoundError } from "@/server/errors";

export const metadata: Metadata = { title: "Lớp học" };

/** US-13: chi tiết lớp được phân công và danh sách học viên. Lớp của giảng viên khác trả về 404 (BR-20). */
export default async function TeacherClassPage({ params }: PageProps<"/teacher/classes/[id]">) {
  const actor = await requireActor("TEACHER");
  const id = idParam((await params).id);
  if (!id) notFound();
  const item = await teacherGetClass(actor, id).catch((error: unknown) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });

  return (
    <>
      <nav aria-label="Đường dẫn" className="mb-2 text-sm text-neutral-500">
        <Link href="/teacher" className="hover:underline">
          Lớp của tôi
        </Link>{" "}
        / <span className="text-neutral-800">{item.name}</span>
      </nav>
      <PageHeader
        title={`Lớp ${item.name}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={item.status} /> {item.course.name} · {formatDate(item.startDate)} –{" "}
            {formatDate(item.endDate)}
          </span>
        }
      />

      <dl className="mb-6 grid gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 p-3">
          <dt className="text-neutral-500">Sĩ số</dt>
          <dd className="text-lg font-semibold">
            {item.studentCount} / {item.maxStudents}
          </dd>
          <dd className="text-xs text-neutral-500">tối thiểu {item.minStudents} để mở lớp</dd>
        </div>
        <div className="rounded-lg border border-neutral-200 p-3">
          <dt className="text-neutral-500">Học phí</dt>
          <dd className="text-lg font-semibold">{formatVnd(item.tuitionFee)}</dd>
          <dd className="text-xs text-neutral-500">cọc {formatVnd(item.depositAmount)}</dd>
        </div>
        <div className="rounded-lg border border-neutral-200 p-3">
          <dt className="text-neutral-500">Nội dung môn học</dt>
          <dd className="text-lg font-semibold">{item.course.sections.length} chương</dd>
          <dd className="text-xs text-neutral-500">
            {item.course.sections.reduce((sum, section) => sum + section._count.lessons, 0)} bài học
          </dd>
        </div>
      </dl>

      <section aria-labelledby="students-heading">
        <h2 id="students-heading" className="mb-3 font-semibold">
          Học viên
        </h2>
        <DataTable aria-label="Danh sách học viên">
          <DataTableHead>
            <Th>Học viên</Th>
            <Th>Email</Th>
            <Th>Đăng ký</Th>
            <Th>Thanh toán</Th>
          </DataTableHead>
          <DataTableBody>
            {item.students.length === 0 ? (
              <EmptyRow colSpan={4}>Lớp chưa có học viên đăng ký.</EmptyRow>
            ) : null}
            {item.students.map((student) => (
              <Tr key={student.id}>
                <Td label="Học viên">{student.name}</Td>
                <Td label="Email">{student.email}</Td>
                <Td label="Đăng ký">{student.enrollmentStatus}</Td>
                <Td label="Thanh toán">{student.paymentStatus}</Td>
              </Tr>
            ))}
          </DataTableBody>
        </DataTable>
      </section>
    </>
  );
}
