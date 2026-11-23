import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/app-shell";
import { DataTable, DataTableBody, DataTableHead, EmptyRow, Td, Th, Tr } from "@/components/data-table";
import { Pagination } from "@/components/pagination";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import { enumParam, firstParam, pageParam } from "@/lib/params";
import { cn } from "@/lib/utils";
import { requireActor } from "@/server/auth/session";
import { createCourseAction } from "@/server/courses/actions";
import { adminListCourses } from "@/server/courses/queries";

import { CourseForm } from "./_components/course-form";

export const metadata: Metadata = { title: "Môn học" };

const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const STATUS_FILTER_LABELS = { DRAFT: "Nháp", PUBLISHED: "Đang mở", ARCHIVED: "Ngừng" } as const;

/** US-07: danh sách môn học của Admin và form tạo môn học mới. */
export default async function AdminCoursesPage({ searchParams }: PageProps<"/admin/courses">) {
  const actor = await requireActor("ADMIN");
  const params = await searchParams;
  const status = enumParam(params.status, STATUSES);
  const q = firstParam(params.q)?.trim() ?? "";
  const { courses, total, page, pageCount } = await adminListCourses(actor, {
    status,
    q,
    page: pageParam(params.page),
  });

  return (
    <>
      <PageHeader title="Môn học" description={`${total} môn học`} />

      <details className="mb-6 rounded-lg border border-neutral-200 p-4">
        <summary className="cursor-pointer font-medium">+ Tạo môn học</summary>
        <div className="mt-4">
          <CourseForm action={createCourseAction} submitLabel="Tạo môn học" />
        </div>
      </details>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Lọc theo trạng thái" className="flex flex-wrap gap-1">
          {[undefined, ...STATUSES].map((value) => (
            <Link
              key={value ?? "all"}
              href={value ? `/admin/courses?status=${value}` : "/admin/courses"}
              aria-current={status === value ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                status === value
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 hover:bg-neutral-100",
              )}
            >
              {value ? STATUS_FILTER_LABELS[value] : "Tất cả"}
            </Link>
          ))}
        </nav>
        <form role="search" className="flex gap-2">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <label htmlFor="course-search" className="sr-only">
            Tìm theo tên môn học
          </label>
          <Input
            id="course-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Tên môn học…"
            className="w-52"
          />
          <Button type="submit" variant="outline">
            Tìm
          </Button>
        </form>
      </div>

      <DataTable aria-label="Danh sách môn học">
        <DataTableHead>
          <Th>Tên môn học</Th>
          <Th>Trạng thái</Th>
          <Th>Số chương</Th>
          <Th>Số lớp</Th>
          <Th>Ngày tạo</Th>
          <Th>Ngừng mở lớp</Th>
        </DataTableHead>
        <DataTableBody>
          {courses.length === 0 ? <EmptyRow colSpan={6}>Chưa có môn học nào.</EmptyRow> : null}
          {courses.map((course) => (
            <Tr key={course.id}>
              <Td label="Tên môn học">
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="font-medium underline-offset-2 hover:underline"
                >
                  {course.name}
                </Link>
              </Td>
              <Td label="Trạng thái">
                <StatusBadge status={course.status} />
              </Td>
              <Td label="Số chương">{course._count.sections}</Td>
              <Td label="Số lớp">{course._count.classes}</Td>
              <Td label="Ngày tạo">{formatDate(course.dateCreated)}</Td>
              <Td label="Ngừng mở lớp">{course.dateEnd ? formatDate(course.dateEnd) : "—"}</Td>
            </Tr>
          ))}
        </DataTableBody>
      </DataTable>

      <div className="mt-6">
        <Pagination
          page={page}
          pageCount={pageCount}
          basePath="/admin/courses"
          params={{ status, q: q || undefined }}
        />
      </div>
    </>
  );
}
