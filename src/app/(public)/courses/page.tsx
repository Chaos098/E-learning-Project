import type { Metadata } from "next";
import Link from "next/link";

import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { firstParam, pageParam } from "@/lib/params";
import { listPublishedCourses } from "@/server/courses/queries";

export const metadata: Metadata = { title: "Danh mục môn học" };
export const dynamic = "force-dynamic";

/** US-10: danh mục môn học đang mở, tìm theo tên, phân trang. */
export default async function CatalogPage({ searchParams }: PageProps<"/courses">) {
  const params = await searchParams;
  const q = firstParam(params.q)?.trim() ?? "";
  const { courses, page, pageCount, total } = await listPublishedCourses({ q, page: pageParam(params.page) });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh mục môn học</h1>
          <p className="mt-1 text-sm text-neutral-600">{total} môn học đang mở</p>
        </div>
        <form role="search" className="flex w-full gap-2 sm:w-auto">
          <label htmlFor="catalog-search" className="sr-only">
            Tìm theo tên môn học
          </label>
          <Input
            id="catalog-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Tìm theo tên…"
            className="sm:w-64"
          />
          <Button type="submit" variant="outline">
            Tìm
          </Button>
        </form>
      </div>

      {courses.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-600">
          {q ? `Không có môn học nào khớp với “${q}”.` : "Chưa có môn học nào được mở."}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Danh sách môn học">
          {courses.map((course) => (
            <li key={course.id}>
              <Link
                href={`/courses/${course.id}`}
                className="flex h-full flex-col rounded-lg border border-neutral-200 p-4 transition hover:border-neutral-400 hover:shadow-sm"
              >
                <h2 className="font-semibold">{course.name}</h2>
                <p className="mt-1 line-clamp-3 flex-1 text-sm text-neutral-600">{course.description}</p>
                <p className="mt-3 text-xs text-neutral-500">
                  {course.sectionCount} chương ·{" "}
                  {course.openClassCount > 0 ? `${course.openClassCount} lớp đang mở` : "Chưa có lớp"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <Pagination page={page} pageCount={pageCount} basePath="/courses" params={{ q: q || undefined }} />
      </div>
    </main>
  );
}
