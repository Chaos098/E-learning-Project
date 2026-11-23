import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/app-shell";
import { idParam } from "@/lib/params";
import { requireActor } from "@/server/auth/session";
import { updateLessonAction } from "@/server/courses/actions";
import { adminGetLesson } from "@/server/courses/queries";
import { NotFoundError } from "@/server/errors";
import { displayFileName, maxUploadBytes } from "@/server/files/storage";

import { LessonForm } from "../../../_components/lesson-form";

export const metadata: Metadata = { title: "Sửa bài học" };

/** US-09: Admin sửa nội dung bài học, thay hoặc bỏ file đính kèm. */
export default async function EditLessonPage({
  params,
}: PageProps<"/admin/courses/[id]/lessons/[lessonId]">) {
  const actor = await requireActor("ADMIN");
  const { id, lessonId } = await params;
  const courseId = idParam(id);
  const lessonIdNumber = idParam(lessonId);
  if (!courseId || !lessonIdNumber) notFound();
  const lesson = await adminGetLesson(actor, lessonIdNumber).catch((error: unknown) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });
  if (lesson.section.course.id !== courseId) notFound();
  const course = lesson.section.course;

  return (
    <>
      <nav aria-label="Đường dẫn" className="mb-2 text-sm text-neutral-500">
        <Link href="/admin/courses" className="hover:underline">
          Môn học
        </Link>{" "}
        /{" "}
        <Link href={`/admin/courses/${course.id}`} className="hover:underline">
          {course.name}
        </Link>{" "}
        / <span className="text-neutral-800">{lesson.title}</span>
      </nav>
      <PageHeader
        title={`Bài ${lesson.section.orderNo}.${lesson.orderNo}: ${lesson.title}`}
        description={`Chương ${lesson.section.orderNo}: ${lesson.section.name}`}
      />
      <div className="max-w-2xl rounded-lg border border-neutral-200 p-4">
        <LessonForm
          idPrefix="lesson"
          action={updateLessonAction.bind(null, course.id, lesson.id)}
          submitLabel="Lưu bài học"
          maxMb={Math.round(maxUploadBytes() / 1024 / 1024)}
          initial={{
            title: lesson.title,
            description: lesson.description ?? "",
            videoUrl: lesson.videoUrl ?? "",
            content: lesson.content ?? "",
          }}
          attachment={
            lesson.attachmentUrl
              ? { name: displayFileName(lesson.attachmentUrl), href: `/api/lessons/${lesson.id}/attachment` }
              : null
          }
        />
      </div>
      <p className="mt-4 text-sm">
        <Link href={`/admin/courses/${course.id}`} className="underline">
          ‹ Quay lại môn học
        </Link>
      </p>
    </>
  );
}
