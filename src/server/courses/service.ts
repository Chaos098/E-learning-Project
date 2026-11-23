import { db } from "@/lib/db";
import { type Actor, assertRole } from "@/server/auth/roles";
import {
  courseSchema,
  type CourseInput,
  idSchema,
  lessonSchema,
  type LessonInput,
  moveSchema,
  sectionSchema,
  type SectionInput,
} from "@/server/courses/schemas";
import { BusinessError, NotFoundError } from "@/server/errors";
import { deleteUpload, saveUpload, validateUpload } from "@/server/files/storage";

type Direction = "up" | "down";

// ---------- Môn học (US-07) ----------

/** US-07: Admin tạo môn học; ghi `admin_id` người tạo, `course_date_created` tự ghi. */
export async function createCourse(actor: Actor | null, input: CourseInput) {
  assertRole(actor, "ADMIN");
  const data = courseSchema.parse(input);
  return db.course.create({
    data: {
      adminId: actor.id,
      name: data.name,
      description: data.description,
      status: data.status,
      dateEnd: data.dateEnd,
    },
  });
}

/** US-07: sửa môn học; "ẩn" là chuyển `ARCHIVED` — không xoá hẳn (BR-19). */
export async function updateCourse(actor: Actor | null, courseId: number | string, input: CourseInput) {
  assertRole(actor, "ADMIN");
  const id = idSchema.parse(courseId);
  const data = courseSchema.parse(input);
  await getCourseOrThrow(id);
  return db.course.update({
    where: { id },
    data: { name: data.name, description: data.description, status: data.status, dateEnd: data.dateEnd },
  });
}

async function getCourseOrThrow(id: number) {
  const course = await db.course.findUnique({ where: { id }, select: { id: true } });
  if (!course) throw new NotFoundError("Không tìm thấy môn học.");
  return course;
}

// ---------- Chương (US-08) ----------

/** US-08: thêm chương vào cuối môn học. */
export async function createSection(actor: Actor | null, courseId: number | string, input: SectionInput) {
  assertRole(actor, "ADMIN");
  const id = idSchema.parse(courseId);
  const data = sectionSchema.parse(input);
  await getCourseOrThrow(id);
  return db.$transaction(async (tx) => {
    const last = await tx.section.aggregate({ where: { courseId: id }, _max: { orderNo: true } });
    return tx.section.create({
      data: {
        courseId: id,
        name: data.name,
        description: data.description,
        orderNo: (last._max.orderNo ?? 0) + 1,
      },
    });
  });
}

export async function updateSection(actor: Actor | null, sectionId: number | string, input: SectionInput) {
  assertRole(actor, "ADMIN");
  const id = idSchema.parse(sectionId);
  const data = sectionSchema.parse(input);
  const section = await db.section.findUnique({ where: { id }, select: { id: true } });
  if (!section) throw new NotFoundError("Không tìm thấy chương.");
  return db.section.update({ where: { id }, data: { name: data.name, description: data.description } });
}

/** Xoá chương rỗng rồi đánh số lại các chương còn lại. Chương còn bài học thì phải xoá bài trước. */
export async function deleteSection(actor: Actor | null, sectionId: number | string) {
  assertRole(actor, "ADMIN");
  const id = idSchema.parse(sectionId);
  const section = await db.section.findUnique({
    where: { id },
    select: { id: true, courseId: true, _count: { select: { lessons: true } } },
  });
  if (!section) throw new NotFoundError("Không tìm thấy chương.");
  if (section._count.lessons > 0)
    throw new BusinessError("Chương còn bài học. Hãy xoá các bài học trong chương trước.");
  await db.$transaction(async (tx) => {
    await tx.section.delete({ where: { id } });
    const rest = await tx.section.findMany({
      where: { courseId: section.courseId },
      orderBy: { orderNo: "asc" },
      select: { id: true },
    });
    for (const [index, item] of rest.entries()) {
      await tx.section.update({ where: { id: item.id }, data: { orderNo: index + 1 } });
    }
  });
}

/** US-08: đổi thứ tự chương bằng cách đổi chỗ với chương liền trước / liền sau. */
export async function moveSection(actor: Actor | null, input: { id: number | string; direction: Direction }) {
  assertRole(actor, "ADMIN");
  const data = moveSchema.parse(input);
  await db.$transaction(async (tx) => {
    const section = await tx.section.findUnique({ where: { id: data.id } });
    if (!section) throw new NotFoundError("Không tìm thấy chương.");
    const neighbor = await tx.section.findFirst({
      where: {
        courseId: section.courseId,
        orderNo: data.direction === "up" ? { lt: section.orderNo } : { gt: section.orderNo },
      },
      orderBy: { orderNo: data.direction === "up" ? "desc" : "asc" },
    });
    if (!neighbor) return;
    await tx.section.update({ where: { id: section.id }, data: { orderNo: neighbor.orderNo } });
    await tx.section.update({ where: { id: neighbor.id }, data: { orderNo: section.orderNo } });
  });
}

// ---------- Bài học (US-09) ----------

/** US-09: thêm bài học vào cuối chương; có thể kết hợp video, văn bản và file đính kèm. */
export async function createLesson(
  actor: Actor | null,
  sectionId: number | string,
  input: LessonInput,
  attachment?: File | null,
) {
  assertRole(actor, "ADMIN");
  const id = idSchema.parse(sectionId);
  const data = lessonSchema.parse(input);
  const section = await db.section.findUnique({ where: { id }, select: { id: true } });
  if (!section) throw new NotFoundError("Không tìm thấy chương.");
  const hasFile = attachment && attachment.size > 0;
  if (hasFile) validateUpload(attachment);
  const attachmentUrl = hasFile ? await saveUpload("lessons", attachment) : null;
  try {
    return await db.$transaction(async (tx) => {
      const last = await tx.lesson.aggregate({ where: { sectionId: id }, _max: { orderNo: true } });
      return tx.lesson.create({
        data: {
          sectionId: id,
          title: data.title,
          description: data.description,
          videoUrl: data.videoUrl,
          content: data.content,
          attachmentUrl,
          orderNo: (last._max.orderNo ?? 0) + 1,
        },
      });
    });
  } catch (error) {
    await deleteUpload(attachmentUrl);
    throw error;
  }
}

/**
 * US-09: sửa bài học. Có file mới thì thay file cũ; `removeAttachment` để bỏ file đính kèm.
 */
export async function updateLesson(
  actor: Actor | null,
  lessonId: number | string,
  input: LessonInput,
  options: { attachment?: File | null; removeAttachment?: boolean } = {},
) {
  assertRole(actor, "ADMIN");
  const id = idSchema.parse(lessonId);
  const data = lessonSchema.parse(input);
  const lesson = await db.lesson.findUnique({ where: { id }, select: { id: true, attachmentUrl: true } });
  if (!lesson) throw new NotFoundError("Không tìm thấy bài học.");

  const hasFile = options.attachment && options.attachment.size > 0;
  if (hasFile) validateUpload(options.attachment!);
  const newAttachment = hasFile ? await saveUpload("lessons", options.attachment!) : null;
  const attachmentUrl = newAttachment ?? (options.removeAttachment ? null : lesson.attachmentUrl);

  try {
    const updated = await db.lesson.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        videoUrl: data.videoUrl,
        content: data.content,
        attachmentUrl,
      },
    });
    if (lesson.attachmentUrl && lesson.attachmentUrl !== attachmentUrl)
      await deleteUpload(lesson.attachmentUrl);
    return updated;
  } catch (error) {
    await deleteUpload(newAttachment);
    throw error;
  }
}

/** Xoá bài học (cùng file đính kèm) rồi đánh số lại các bài còn lại trong chương. */
export async function deleteLesson(actor: Actor | null, lessonId: number | string) {
  assertRole(actor, "ADMIN");
  const id = idSchema.parse(lessonId);
  const lesson = await db.lesson.findUnique({
    where: { id },
    select: { id: true, sectionId: true, attachmentUrl: true },
  });
  if (!lesson) throw new NotFoundError("Không tìm thấy bài học.");
  await db.$transaction(async (tx) => {
    await tx.lesson.delete({ where: { id } });
    const rest = await tx.lesson.findMany({
      where: { sectionId: lesson.sectionId },
      orderBy: { orderNo: "asc" },
      select: { id: true },
    });
    for (const [index, item] of rest.entries()) {
      await tx.lesson.update({ where: { id: item.id }, data: { orderNo: index + 1 } });
    }
  });
  await deleteUpload(lesson.attachmentUrl);
}

/** US-09: đổi thứ tự bài học trong chương. */
export async function moveLesson(actor: Actor | null, input: { id: number | string; direction: Direction }) {
  assertRole(actor, "ADMIN");
  const data = moveSchema.parse(input);
  await db.$transaction(async (tx) => {
    const lesson = await tx.lesson.findUnique({ where: { id: data.id } });
    if (!lesson) throw new NotFoundError("Không tìm thấy bài học.");
    const neighbor = await tx.lesson.findFirst({
      where: {
        sectionId: lesson.sectionId,
        orderNo: data.direction === "up" ? { lt: lesson.orderNo } : { gt: lesson.orderNo },
      },
      orderBy: { orderNo: data.direction === "up" ? "desc" : "asc" },
    });
    if (!neighbor) return;
    await tx.lesson.update({ where: { id: lesson.id }, data: { orderNo: neighbor.orderNo } });
    await tx.lesson.update({ where: { id: neighbor.id }, data: { orderNo: lesson.orderNo } });
  });
}
