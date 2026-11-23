import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/app-shell";
import { DataTable, DataTableBody, DataTableHead, EmptyRow, Td, Th, Tr } from "@/components/data-table";
import { Pagination } from "@/components/pagination";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatVnd } from "@/lib/format";
import { enumParam, pageParam } from "@/lib/params";
import { cn } from "@/lib/utils";
import { requireActor } from "@/server/auth/session";
import { adminListClasses } from "@/server/classes/queries";

export const metadata: Metadata = { title: "Lớp học" };

const STATUSES = ["UPCOMING", "ONGOING", "FINISHED", "CANCELLED"] as const;
const FILTER_LABELS = {
  UPCOMING: "Nhận đăng ký",
  ONGOING: "Đang học",
  FINISHED: "Đã kết thúc",
  CANCELLED: "Đã huỷ",
};

export default async function AdminClassesPage({ searchParams }: PageProps<"/admin/classes">) {
  const actor = await requireActor("ADMIN");
  const params = await searchParams;
  const status = enumParam(params.status, STATUSES);
  const { classes, total, page, pageCount } = await adminListClasses(actor, {
    status,
    page: pageParam(params.page),
  });

  return (
    <>
      <PageHeader
        title="Lớp học"
        description={`${total} lớp`}
        actions={
          <Link href="/admin/classes/new" className={buttonVariants()}>
            + Mở lớp
          </Link>
        }
      />
      <nav aria-label="Lọc theo trạng thái" className="mb-4 flex flex-wrap gap-1">
        {[undefined, ...STATUSES].map((value) => (
          <Link
            key={value ?? "all"}
            href={value ? `/admin/classes?status=${value}` : "/admin/classes"}
            aria-current={status === value ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              status === value
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 hover:bg-neutral-100",
            )}
          >
            {value ? FILTER_LABELS[value] : "Tất cả"}
          </Link>
        ))}
      </nav>

      <DataTable aria-label="Danh sách lớp học">
        <DataTableHead>
          <Th>Lớp</Th>
          <Th>Môn học</Th>
          <Th>Giảng viên</Th>
          <Th>Thời gian</Th>
          <Th>Sĩ số</Th>
          <Th>Học phí / cọc</Th>
          <Th>Trạng thái</Th>
        </DataTableHead>
        <DataTableBody>
          {classes.length === 0 ? <EmptyRow colSpan={7}>Chưa có lớp nào.</EmptyRow> : null}
          {classes.map((item) => (
            <Tr key={item.id}>
              <Td label="Lớp">
                <Link
                  href={`/admin/classes/${item.id}`}
                  className="font-medium underline-offset-2 hover:underline"
                >
                  {item.name}
                </Link>
              </Td>
              <Td label="Môn học">{item.course.name}</Td>
              <Td label="Giảng viên">{item.teacher.user.name}</Td>
              <Td label="Thời gian">
                {formatDate(item.startDate)} – {formatDate(item.endDate)}
              </Td>
              <Td label="Sĩ số">
                {item.studentCount} / {item.maxStudents}
                <span className="block text-xs text-neutral-500">tối thiểu {item.minStudents}</span>
              </Td>
              <Td label="Học phí / cọc">
                {formatVnd(item.tuitionFee)}
                <span className="block text-xs text-neutral-500">cọc {formatVnd(item.depositAmount)}</span>
              </Td>
              <Td label="Trạng thái">
                <StatusBadge status={item.status} />
              </Td>
            </Tr>
          ))}
        </DataTableBody>
      </DataTable>
      <div className="mt-6">
        <Pagination page={page} pageCount={pageCount} basePath="/admin/classes" params={{ status }} />
      </div>
    </>
  );
}
