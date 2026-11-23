import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { checkDatabase } from "@/lib/health";
import { listPublishedCourses } from "@/server/courses/queries";

// Trang đọc CSDL nên luôn render theo từng request.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [database, catalog] = await Promise.all([checkDatabase(), listPublishedCourses({ page: 1 })]);
  const latest = catalog.courses.slice(0, 3);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-12">
      <section className="max-w-2xl">
        <p className="text-sm font-medium text-neutral-500">Trung tâm đào tạo trực tuyến</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">E-Learning</h1>
        <p className="mt-3 text-neutral-600">
          Chọn môn học, đăng ký lớp do giảng viên đứng lớp, học bài theo chương, làm quiz và thi cuối kỳ ngay
          trên trình duyệt.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/courses" className={buttonVariants({ size: "lg" })}>
            Xem danh mục môn học
          </Link>
          <Link href="/register" className={buttonVariants({ size: "lg", variant: "outline" })}>
            Đăng ký học viên
          </Link>
        </div>
      </section>

      {latest.length > 0 ? (
        <section aria-labelledby="latest-heading">
          <h2 id="latest-heading" className="text-lg font-semibold">
            Môn học mới
          </h2>
          <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((course) => (
              <li key={course.id} className="rounded-lg border border-neutral-200 p-4">
                <Link href={`/courses/${course.id}`} className="font-medium hover:underline">
                  {course.name}
                </Link>
                <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{course.description}</p>
                <p className="mt-2 text-xs text-neutral-500">
                  {course.openClassCount > 0 ? `${course.openClassCount} lớp đang mở` : "Chưa có lớp"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="status-heading" className="max-w-md rounded-lg border border-neutral-200 p-4">
        <h2 id="status-heading" className="text-sm font-semibold text-neutral-700">
          Trạng thái hệ thống
        </h2>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-neutral-500">Ứng dụng</dt>
          <dd data-testid="app-status" className="font-medium text-green-700">
            Đang chạy
          </dd>
          <dt className="text-neutral-500">Cơ sở dữ liệu</dt>
          {database.ok ? (
            <dd data-testid="db-status" className="font-medium text-green-700">
              Đã kết nối (PostgreSQL {database.version})
            </dd>
          ) : (
            <dd data-testid="db-status" className="font-medium text-red-700">
              Chưa kết nối được — hãy chạy <code>npm run db:up</code>
            </dd>
          )}
        </dl>
      </section>
    </main>
  );
}
