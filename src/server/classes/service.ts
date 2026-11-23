import { db } from "@/lib/db";
import { todayDate } from "@/lib/format";
import { type Actor, assertRole } from "@/server/auth/roles";
import {
  changeTeacherSchema,
  openClassSchema,
  type OpenClassInput,
  updateClassSchema,
  type UpdateClassInput,
} from "@/server/classes/schemas";
import { BusinessError, NotFoundError } from "@/server/errors";

type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0];

/** Giảng viên phải tồn tại và đang hoạt động mới được phân công. */
async function assertActiveTeacher(tx: Tx, teacherId: number) {
  const teacher = await tx.teacher.findUnique({
    where: { userId: teacherId },
    select: { user: { select: { status: true } } },
  });
  if (!teacher) throw new BusinessError("Giảng viên không tồn tại.");
  if (teacher.user.status !== "ACTIVE")
    throw new BusinessError("Giảng viên đang bị khoá, hãy chọn người khác.");
}

/**
 * US-12: Admin mở lớp cho một môn học và phân công đúng 1 giảng viên (BR-06).
 * Cùng transaction tạo đề thi cuối kỳ `DISABLED` cho lớp (US-29, BR-12).
 * Ngày khai giảng không được ở quá khứ (giờ server, BR-25) và không sau ngày ngừng mở lớp của môn.
 */
export async function openClass(actor: Actor | null, input: OpenClassInput, now: Date = new Date()) {
  assertRole(actor, "ADMIN");
  const data = openClassSchema.parse(input);
  if (data.startDate.getTime() < todayDate(now).getTime()) {
    throw new BusinessError("Ngày khai giảng không được ở trong quá khứ.");
  }
  return db.$transaction(async (tx) => {
    const course = await tx.course.findUnique({
      where: { id: data.courseId },
      select: { status: true, dateEnd: true },
    });
    if (!course) throw new NotFoundError("Không tìm thấy môn học.");
    if (course.status === "ARCHIVED") throw new BusinessError("Môn học đã ngừng, không mở lớp mới được.");
    if (course.dateEnd && data.startDate.getTime() > course.dateEnd.getTime()) {
      throw new BusinessError("Ngày khai giảng sau ngày ngừng mở lớp mới của môn học.");
    }
    await assertActiveTeacher(tx, data.teacherId);
    return tx.class.create({
      data: {
        courseId: data.courseId,
        teacherId: data.teacherId,
        adminId: actor.id,
        name: data.name,
        tuitionFee: data.tuitionFee,
        depositAmount: data.depositAmount,
        minStudents: data.minStudents,
        maxStudents: data.maxStudents,
        startDate: data.startDate,
        endDate: data.endDate,
        exam: { create: { adminId: actor.id, status: "DISABLED" } },
      },
      include: { exam: true },
    });
  });
}

/** Sửa thông tin lớp: chỉ khi lớp còn `UPCOMING` (đang nhận đăng ký). */
export async function updateClass(
  actor: Actor | null,
  classId: number | string,
  input: UpdateClassInput,
  now: Date = new Date(),
) {
  assertRole(actor, "ADMIN");
  const id = Number(classId);
  const data = updateClassSchema.parse(input);
  return db.$transaction(async (tx) => {
    const current = await tx.class.findUnique({
      where: { id },
      select: { status: true, startDate: true, course: { select: { dateEnd: true } } },
    });
    if (!current) throw new NotFoundError("Không tìm thấy lớp học.");
    if (current.status !== "UPCOMING") throw new BusinessError("Chỉ sửa được lớp đang nhận đăng ký.");
    const startChanged = current.startDate.getTime() !== data.startDate.getTime();
    if (startChanged && data.startDate.getTime() < todayDate(now).getTime()) {
      throw new BusinessError("Ngày khai giảng không được ở trong quá khứ.");
    }
    if (current.course.dateEnd && data.startDate.getTime() > current.course.dateEnd.getTime()) {
      throw new BusinessError("Ngày khai giảng sau ngày ngừng mở lớp mới của môn học.");
    }
    await assertActiveTeacher(tx, data.teacherId);
    return tx.class.update({
      where: { id },
      data: {
        teacherId: data.teacherId,
        name: data.name,
        tuitionFee: data.tuitionFee,
        depositAmount: data.depositAmount,
        minStudents: data.minStudents,
        maxStudents: data.maxStudents,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });
  });
}

/** FR-3.2: đổi giảng viên của lớp chưa kết thúc / chưa huỷ. */
export async function changeTeacher(
  actor: Actor | null,
  input: { classId: number | string; teacherId: number | string },
) {
  assertRole(actor, "ADMIN");
  const data = changeTeacherSchema.parse(input);
  return db.$transaction(async (tx) => {
    const current = await tx.class.findUnique({ where: { id: data.classId }, select: { status: true } });
    if (!current) throw new NotFoundError("Không tìm thấy lớp học.");
    if (current.status === "FINISHED" || current.status === "CANCELLED") {
      throw new BusinessError("Lớp đã kết thúc hoặc đã huỷ, không đổi giảng viên được.");
    }
    await assertActiveTeacher(tx, data.teacherId);
    return tx.class.update({ where: { id: data.classId }, data: { teacherId: data.teacherId } });
  });
}
