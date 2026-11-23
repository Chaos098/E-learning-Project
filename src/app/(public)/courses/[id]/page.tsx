import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatVnd } from "@/lib/format";
import { idParam } from "@/lib/params";
import { getActor } from "@/server/auth/session";
import { getPublishedCourseDetail } from "@/server/courses/queries";

export async function generateMetadata({ params }: PageProps<"/courses/[id]">): Promise<Metadata> {
  const id = idParam((await params).id);
  const course = id ? await getPublishedCourseDetail(id) : null;
  return { title: course?.name ?? "Môn học" };
}

/** US-11: chi tiết môn học — mô tả, chương và tên bài học (khoá nội dung), các lớp đang nhận đăng ký. */
export default async function CourseDetailPage({ params }: PageProps<"/courses/[id]">) {
  const id = idParam((await params).id);
  const course = id ? await getPublishedCourseDetail(id) : null;
  if (!course) notFound();
  const actor = await getActor();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <nav aria-label="Đường dẫn" className="mb-3 text-sm text-neutral-500">
        <Link href="/courses" className="hover:underline">
          Danh mục môn học
        </Link>{" "}
        / <span className="text-neutral-800">{course.name}</span>
      </nav>
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{course.name}</h1>
      {course.description ? (
        <p className="mt-2 max-w-3xl whitespace-pre-line text-neutral-700">{course.description}</p>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_420px]">
        <section aria-labelledby="content-heading" className="rounded-lg border border-neutral-200 p-4">
          <h2 id="content-heading" className="font-semibold">
            Nội dung môn học
          </h2>
          {course.sections.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-600">Môn học chưa có chương nào.</p>
          ) : (
            <ol className="mt-3 grid gap-4">
              {course.sections.map((section) => (
                <li key={section.id}>
                  <h3 className="text-sm font-medium">
                    Chương {section.orderNo}: {section.name}
                  </h3>
                  <ul className="mt-1 grid gap-1 pl-4">
                    {section.lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        className="flex items-center justify-between gap-2 text-sm text-neutral-700"
                      >
                        <span>
                          Bài {section.orderNo}.{lesson.orderNo}: {lesson.title}
                        </span>
                        <span aria-label="Chưa được mở quyền xem" title="Đăng ký lớp để xem nội dung">
                          🔒
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section aria-labelledby="classes-heading" className="rounded-lg border border-neutral-200 p-4">
          <h2 id="classes-heading" className="font-semibold">
            Lớp đang nhận đăng ký
          </h2>
          {course.classes.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-600">Hiện chưa có lớp nào nhận đăng ký.</p>
          ) : (
            <ul className="mt-3 grid gap-3" aria-label="Lớp đang nhận đăng ký">
              {course.classes.map((item) => (
                <li
                  key={item.id}
                  className="rounded-md border border-neutral-200 p-3 text-sm"
                  data-testid="open-class"
                >
                  <p className="font-medium">
                    {item.name} · GV {item.teacherName}
                  </p>
                  <p className="text-neutral-600">
                    Khai giảng {formatDate(item.startDate)} · Kết thúc {formatDate(item.endDate)}
                  </p>
                  <p className="text-neutral-600">
                    Học phí {formatVnd(item.tuitionFee)} · Cọc {formatVnd(item.depositAmount)}
                  </p>
                  <p className={item.seatsLeft > 0 ? "text-neutral-600" : "font-medium text-red-700"}>
                    {item.seatsLeft > 0 ? `Còn ${item.seatsLeft} / ${item.maxStudents} chỗ` : "Hết chỗ"}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {course.classes.length > 0 ? (
            actor ? (
              <p className="mt-4 rounded-md bg-neutral-50 p-3 text-sm text-neutral-600">
                Chức năng đăng ký lớp trực tuyến đang được hoàn thiện.
              </p>
            ) : (
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(`/courses/${course.id}`)}`}
                className={buttonVariants({ className: "mt-4 w-full" })}
              >
                Đăng nhập để đăng ký
              </Link>
            )
          ) : null}
        </section>
      </div>
    </main>
  );
}
