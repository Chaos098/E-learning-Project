import type { ClassStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { type Actor, assertRole } from "@/server/auth/roles";
import { activeStudentCounts } from "@/server/classes/counts";
import { NotFoundError } from "@/server/errors";

export const ADMIN_CLASSES_PAGE_SIZE = 20;

const classListSelect = {
  id: true,
  name: true,
  status: true,
  tuitionFee: true,
  depositAmount: true,
  minStudents: true,
  maxStudents: true,
  startDate: true,
  endDate: true,
  course: { select: { id: true, name: true } },
  teacher: { select: { userId: true, user: { select: { name: true } } } },
} as const;

export async function adminListClasses(
  actor: Actor | null,
  filter: { status?: ClassStatus; courseId?: number; page?: number } = {},
) {
  assertRole(actor, "ADMIN");
  const page = Math.max(1, filter.page ?? 1);
  const where = {
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.courseId ? { courseId: filter.courseId } : {}),
  };
  const [total, classes] = await Promise.all([
    db.class.count({ where }),
    db.class.findMany({
      where,
      orderBy: [{ startDate: "desc" }, { id: "desc" }],
      skip: (page - 1) * ADMIN_CLASSES_PAGE_SIZE,
      take: ADMIN_CLASSES_PAGE_SIZE,
      select: classListSelect,
    }),
  ]);
  const counts = await activeStudentCounts(classes.map((item) => item.id));
  return {
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_CLASSES_PAGE_SIZE)),
    classes: classes.map((item) => ({ ...item, studentCount: counts.get(item.id) ?? 0 })),
  };
}

export async function adminGetClass(actor: Actor | null, classId: number) {
  assertRole(actor, "ADMIN");
  const item = await db.class.findUnique({
    where: { id: classId },
    include: {
      course: { select: { id: true, name: true, dateEnd: true } },
      teacher: { select: { userId: true, user: { select: { name: true, email: true } } } },
      admin: { select: { user: { select: { name: true } } } },
      exam: true,
    },
  });
  if (!item) throw new NotFoundError("Không tìm thấy lớp học.");
  const counts = await activeStudentCounts([item.id]);
  return { ...item, studentCount: counts.get(item.id) ?? 0 };
}

/** Giảng viên đang hoạt động, dùng cho ô chọn khi mở lớp / đổi giảng viên. */
export async function listActiveTeachers(actor: Actor | null) {
  assertRole(actor, "ADMIN");
  const teachers = await db.teacher.findMany({
    where: { user: { status: "ACTIVE" } },
    orderBy: { user: { name: "asc" } },
    select: { userId: true, user: { select: { name: true, email: true } } },
  });
  return teachers.map((teacher) => ({
    id: teacher.userId,
    name: teacher.user.name,
    email: teacher.user.email,
  }));
}

/** Môn học còn mở lớp được (chưa `ARCHIVED`). */
export async function listCoursesForNewClass(actor: Actor | null) {
  assertRole(actor, "ADMIN");
  return db.course.findMany({
    where: { status: { not: "ARCHIVED" } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, status: true, dateEnd: true },
  });
}

/** US-13: các lớp được phân công cho giảng viên đang đăng nhập (BR-20). */
export async function teacherListClasses(actor: Actor | null) {
  assertRole(actor, "TEACHER");
  const classes = await db.class.findMany({
    where: { teacherId: actor.id },
    orderBy: [{ startDate: "desc" }, { id: "desc" }],
    select: classListSelect,
  });
  const counts = await activeStudentCounts(classes.map((item) => item.id));
  return classes.map((item) => ({ ...item, studentCount: counts.get(item.id) ?? 0 }));
}

/**
 * US-13: chi tiết một lớp của giảng viên. Lớp không thuộc giảng viên thì báo không tìm thấy (BR-20).
 * Danh sách học viên kèm trạng thái đăng ký / thanh toán có từ Sprint 2, khi có bảng `study` và `enrollment`.
 */
export async function teacherGetClass(actor: Actor | null, classId: number) {
  assertRole(actor, "TEACHER");
  const item = await db.class.findFirst({
    where: { id: classId, teacherId: actor.id },
    include: {
      course: {
        select: {
          id: true,
          name: true,
          sections: {
            orderBy: { orderNo: "asc" },
            select: { id: true, name: true, orderNo: true, _count: { select: { lessons: true } } },
          },
        },
      },
      exam: { select: { status: true } },
    },
  });
  if (!item) throw new NotFoundError("Không tìm thấy lớp học.");
  const counts = await activeStudentCounts([item.id]);
  const students: {
    id: number;
    name: string;
    email: string;
    enrollmentStatus: string;
    paymentStatus: string;
  }[] = [];
  return { ...item, studentCount: counts.get(item.id) ?? 0, students };
}

/** Số liệu cho trang tổng quan của Admin. */
export async function adminOverview(actor: Actor | null) {
  assertRole(actor, "ADMIN");
  const [roles, courses, upcoming, ongoing] = await Promise.all([
    db.user.groupBy({ by: ["role"], _count: { _all: true } }),
    db.course.groupBy({ by: ["status"], _count: { _all: true } }),
    db.class.count({ where: { status: "UPCOMING" } }),
    db.class.count({ where: { status: "ONGOING" } }),
  ]);
  const roleCount = (role: string) => roles.find((item) => item.role === role)?._count._all ?? 0;
  const courseCount = (status: string) => courses.find((item) => item.status === status)?._count._all ?? 0;
  return {
    admins: roleCount("ADMIN"),
    teachers: roleCount("TEACHER"),
    students: roleCount("STUDENT"),
    publishedCourses: courseCount("PUBLISHED"),
    draftCourses: courseCount("DRAFT"),
    upcomingClasses: upcoming,
    ongoingClasses: ongoing,
  };
}
