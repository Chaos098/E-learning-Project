import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/action-form";
import { PageHeader } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { formatDate, formatDateTime, toDateInputValue } from "@/lib/format";
import { idParam } from "@/lib/params";
import type { ActionState } from "@/server/action-state";
import { requireActor } from "@/server/auth/session";
import {
  createLessonAction,
  createSectionAction,
  deleteLessonAction,
  deleteSectionAction,
  moveLessonAction,
  moveSectionAction,
  updateCourseAction,
  updateSectionAction,
} from "@/server/courses/actions";
import { adminGetCourse } from "@/server/courses/queries";
import { NotFoundError } from "@/server/errors";
import { maxUploadBytes } from "@/server/files/storage";

import { CourseForm } from "../_components/course-form";
import { LessonForm } from "../_components/lesson-form";
import { SectionForm } from "../_components/section-form";

export const metadata: Metadata = { title: "Soạn môn học" };

function lessonKinds(lesson: {
  videoUrl: string | null;
  content: string | null;
  attachmentUrl: string | null;
}) {
  const kinds = [
    lesson.videoUrl ? "video" : null,
    lesson.content ? "văn bản" : null,
    lesson.attachmentUrl ? "file" : null,
  ];
  return kinds.filter(Boolean).join(" + ") || "chưa có nội dung";
}

function MoveButtons({
  up,
  down,
  label,
}: {
  up: (() => Promise<ActionState>) | null;
  down: (() => Promise<ActionState>) | null;
  label: string;
}) {
  return (
    <>
      {up ? (
        <ActionForm action={up}>
          <SubmitButton size="icon-sm" variant="ghost" aria-label={`Chuyển ${label} lên`} pendingText="…">
            ↑
          </SubmitButton>
        </ActionForm>
      ) : null}
      {down ? (
        <ActionForm action={down}>
          <SubmitButton size="icon-sm" variant="ghost" aria-label={`Chuyển ${label} xuống`} pendingText="…">
            ↓
          </SubmitButton>
        </ActionForm>
      ) : null}
    </>
  );
}

/** US-07, US-08, US-09: Admin sửa môn học, quản lý chương và bài học, sắp xếp thứ tự. */
export default async function AdminCourseDetailPage({ params }: PageProps<"/admin/courses/[id]">) {
  const actor = await requireActor("ADMIN");
  const id = idParam((await params).id);
  if (!id) notFound();
  const course = await adminGetCourse(actor, id).catch((error: unknown) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });
  const maxMb = Math.round(maxUploadBytes() / 1024 / 1024);

  return (
    <>
      <nav aria-label="Đường dẫn" className="mb-2 text-sm text-neutral-500">
        <Link href="/admin/courses" className="hover:underline">
          Môn học
        </Link>{" "}
        / <span className="text-neutral-800">{course.name}</span>
      </nav>
      <PageHeader
        title={course.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={course.status} /> Tạo ngày {formatDateTime(course.dateCreated)} bởi{" "}
            {course.admin.user.name} · {course._count.classes} lớp
            {course.dateEnd ? ` · Ngừng mở lớp từ ${formatDate(course.dateEnd)}` : ""}
          </span>
        }
        actions={
          course.status === "PUBLISHED" ? (
            <Link href={`/courses/${course.id}`} className="text-sm underline">
              Xem trang công khai
            </Link>
          ) : null
        }
      />

      <section aria-labelledby="info-heading" className="mb-8 rounded-lg border border-neutral-200 p-4">
        <h2 id="info-heading" className="mb-4 font-semibold">
          Thông tin môn học
        </h2>
        <CourseForm
          action={updateCourseAction.bind(null, course.id)}
          submitLabel="Lưu môn học"
          initial={{
            name: course.name,
            description: course.description ?? "",
            status: course.status,
            dateEnd: toDateInputValue(course.dateEnd),
          }}
        />
      </section>

      <section aria-labelledby="sections-heading">
        <h2 id="sections-heading" className="mb-3 font-semibold">
          Chương và bài học
        </h2>
        {course.sections.length === 0 ? (
          <p className="mb-4 rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-600">
            Môn học chưa có chương nào. Thêm chương đầu tiên ở bên dưới.
          </p>
        ) : null}

        <ol className="grid gap-4">
          {course.sections.map((section, sIndex) => (
            <li
              key={section.id}
              className="rounded-lg border border-neutral-200 p-4"
              data-testid="section-card"
            >
              <div className="flex flex-wrap items-start gap-2">
                <h3 className="flex-1 font-medium">
                  Chương {section.orderNo}: {section.name}
                </h3>
                <MoveButtons
                  label={`chương ${section.name}`}
                  up={sIndex > 0 ? moveSectionAction.bind(null, course.id, section.id, "up") : null}
                  down={
                    sIndex < course.sections.length - 1
                      ? moveSectionAction.bind(null, course.id, section.id, "down")
                      : null
                  }
                />
                <ActionForm
                  action={deleteSectionAction.bind(null, course.id, section.id)}
                  confirmMessage={`Xoá chương "${section.name}"?`}
                >
                  <SubmitButton size="sm" variant="destructive">
                    Xoá
                  </SubmitButton>
                </ActionForm>
              </div>
              {section.description ? (
                <p className="mt-1 text-sm text-neutral-600">{section.description}</p>
              ) : null}

              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-neutral-700">Sửa chương</summary>
                <div className="mt-2 max-w-xl">
                  <SectionForm
                    idPrefix={`section-${section.id}`}
                    action={updateSectionAction.bind(null, course.id, section.id)}
                    initial={{ name: section.name, description: section.description ?? "" }}
                    submitLabel="Lưu chương"
                  />
                </div>
              </details>

              <ol className="mt-3 grid gap-1 border-t border-neutral-100 pt-3">
                {section.lessons.length === 0 ? (
                  <li className="text-sm text-neutral-500">Chương chưa có bài học.</li>
                ) : null}
                {section.lessons.map((lesson, lIndex) => (
                  <li
                    key={lesson.id}
                    className="flex flex-wrap items-center gap-2 rounded-md px-2 py-1 hover:bg-neutral-50"
                  >
                    <Link
                      href={`/admin/courses/${course.id}/lessons/${lesson.id}`}
                      className="flex-1 text-sm underline-offset-2 hover:underline"
                    >
                      Bài {section.orderNo}.{lesson.orderNo}: {lesson.title}
                      <span className="ml-2 text-xs text-neutral-500">· {lessonKinds(lesson)}</span>
                    </Link>
                    <MoveButtons
                      label={`bài ${lesson.title}`}
                      up={lIndex > 0 ? moveLessonAction.bind(null, course.id, lesson.id, "up") : null}
                      down={
                        lIndex < section.lessons.length - 1
                          ? moveLessonAction.bind(null, course.id, lesson.id, "down")
                          : null
                      }
                    />
                    <ActionForm
                      action={deleteLessonAction.bind(null, course.id, lesson.id)}
                      confirmMessage={`Xoá bài học "${lesson.title}"?`}
                    >
                      <SubmitButton size="xs" variant="destructive">
                        Xoá
                      </SubmitButton>
                    </ActionForm>
                  </li>
                ))}
              </ol>

              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium">
                  + Thêm bài học vào chương {section.orderNo}
                </summary>
                <div className="mt-2 max-w-2xl">
                  <LessonForm
                    idPrefix={`new-lesson-${section.id}`}
                    action={createLessonAction.bind(null, course.id, section.id)}
                    submitLabel="Thêm bài học"
                    maxMb={maxMb}
                  />
                </div>
              </details>
            </li>
          ))}
        </ol>

        <details
          className="mt-4 rounded-lg border border-neutral-200 p-4"
          open={course.sections.length === 0}
        >
          <summary className="cursor-pointer font-medium">+ Thêm chương</summary>
          <div className="mt-3 max-w-xl">
            <SectionForm
              idPrefix="new-section"
              action={createSectionAction.bind(null, course.id)}
              submitLabel="Thêm chương"
            />
          </div>
        </details>
      </section>
    </>
  );
}
