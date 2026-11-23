import type { CourseStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { type Actor, assertRole } from "@/server/auth/roles";
import { NotFoundError } from "@/server/errors";
import { activeStudentCounts } from "@/server/classes/counts";

export const CATALOG_PAGE_SIZE = 9;
export const ADMIN_COURSES_PAGE_SIZE = 20;

/** US-10, FR-2.5: danh mục môn học `PUBLISHED`, tìm theo tên, phân trang. Trang công khai. */
export async function listPublishedCourses(filter: { q?: string; page?: number } = {}) {
  const page = Math.max(1, filter.page ?? 1);
  const q = filter.q?.trim();
  const where = {
    status: "PUBLISHED" as const,
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
  };
  const [total, courses] = await Promise.all([
    db.course.count({ where }),
    db.course.findMany({
      where,
      orderBy: [{ dateCreated: "desc" }, { id: "desc" }],
      skip: (page - 1) * CATALOG_PAGE_SIZE,
      take: CATALOG_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        description: true,
        _count: { select: { classes: { where: { status: "UPCOMING" } }, sections: true } },
      },
    }),
  ]);
  return {
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE)),
    courses: courses.map((course) => ({
      id: course.id,
      name: course.name,
      description: course.description,
      openClassCount: course._count.classes,
      sectionCount: course._count.sections,
    })),
  };
}

/**
 * US-11, FR-2.6: chi tiết môn học cho khách / học viên.
 * Chỉ trả về tên chương và tên bài học — không trả nội dung, video hay file (chưa được mở quyền).
 */
export async function getPublishedCourseDetail(courseId: number) {
  const course = await db.course.findFirst({
    where: { id: courseId, status: "PUBLISHED" },
    select: {
      id: true,
      name: true,
      description: true,
      sections: {
        orderBy: { orderNo: "asc" },
        select: {
          id: true,
          name: true,
          orderNo: true,
          lessons: { orderBy: { orderNo: "asc" }, select: { id: true, title: true, orderNo: true } },
        },
      },
      classes: {
        where: { status: "UPCOMING" },
        orderBy: [{ startDate: "asc" }, { id: "asc" }],
        select: {
          id: true,
          name: true,
          tuitionFee: true,
          depositAmount: true,
          startDate: true,
          endDate: true,
          maxStudents: true,
          teacher: { select: { user: { select: { name: true } } } },
        },
      },
    },
  });
  if (!course) return null;
  const counts = await activeStudentCounts(course.classes.map((item) => item.id));
  return {
    ...course,
    classes: course.classes.map((item) => ({
      id: item.id,
      name: item.name,
      teacherName: item.teacher.user.name,
      tuitionFee: item.tuitionFee,
      depositAmount: item.depositAmount,
      startDate: item.startDate,
      endDate: item.endDate,
      maxStudents: item.maxStudents,
      seatsLeft: Math.max(0, item.maxStudents - (counts.get(item.id) ?? 0)),
    })),
  };
}

/** Danh sách môn học cho Admin (mọi trạng thái). */
export async function adminListCourses(
  actor: Actor | null,
  filter: { q?: string; status?: CourseStatus; page?: number } = {},
) {
  assertRole(actor, "ADMIN");
  const page = Math.max(1, filter.page ?? 1);
  const q = filter.q?.trim();
  const where = {
    ...(filter.status ? { status: filter.status } : {}),
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
  };
  const [total, courses] = await Promise.all([
    db.course.count({ where }),
    db.course.findMany({
      where,
      orderBy: [{ dateCreated: "desc" }, { id: "desc" }],
      skip: (page - 1) * ADMIN_COURSES_PAGE_SIZE,
      take: ADMIN_COURSES_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        status: true,
        dateCreated: true,
        dateEnd: true,
        _count: { select: { sections: true, classes: true } },
      },
    }),
  ]);
  return { total, page, pageCount: Math.max(1, Math.ceil(total / ADMIN_COURSES_PAGE_SIZE)), courses };
}

/** Môn học kèm toàn bộ chương và bài học để Admin soạn nội dung. */
export async function adminGetCourse(actor: Actor | null, courseId: number) {
  assertRole(actor, "ADMIN");
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      admin: { select: { user: { select: { name: true } } } },
      sections: {
        orderBy: { orderNo: "asc" },
        include: { lessons: { orderBy: { orderNo: "asc" } } },
      },
      _count: { select: { classes: true } },
    },
  });
  if (!course) throw new NotFoundError("Không tìm thấy môn học.");
  return course;
}

export async function adminGetLesson(actor: Actor | null, lessonId: number) {
  assertRole(actor, "ADMIN");
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      section: {
        select: { id: true, name: true, orderNo: true, course: { select: { id: true, name: true } } },
      },
    },
  });
  if (!lesson) throw new NotFoundError("Không tìm thấy bài học.");
  return lesson;
}

/**
 * FR-2.4: ai được tải file đính kèm của bài học.
 * Admin: mọi bài. Giảng viên: bài của môn có lớp mình dạy.
 * Học viên: từ Sprint 2, khi đã được mở quyền vào lớp của môn (BR-10) — hiện chưa có bảng `study` nên chưa cho tải.
 */
export async function canDownloadLessonAttachment(actor: Actor | null, lessonId: number): Promise<boolean> {
  if (!actor) return false;
  if (actor.role === "ADMIN") return true;
  if (actor.role === "TEACHER") {
    const count = await db.class.count({
      where: { teacherId: actor.id, course: { sections: { some: { lessons: { some: { id: lessonId } } } } } },
    });
    return count > 0;
  }
  return false;
}

/** Đường dẫn file đính kèm của bài học nếu người dùng được tải (FR-2.4). */
export async function getLessonAttachmentForDownload(
  actor: Actor | null,
  lessonId: number,
): Promise<{ status: "unauthenticated" | "forbidden" | "missing" } | { status: "ok"; path: string }> {
  if (!actor) return { status: "unauthenticated" };
  if (!(await canDownloadLessonAttachment(actor, lessonId))) return { status: "forbidden" };
  const lesson = await db.lesson.findUnique({ where: { id: lessonId }, select: { attachmentUrl: true } });
  if (!lesson?.attachmentUrl) return { status: "missing" };
  return { status: "ok", path: lesson.attachmentUrl };
}
