// @vitest-environment node
// Test tích hợp — cần CSDL Docker đang chạy (npm run db:up).
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import type { Actor } from "@/server/auth/roles";
import { teacherGetClass, teacherListClasses } from "@/server/classes/queries";
import { changeTeacher, openClass, updateClass } from "@/server/classes/service";
import { ForbiddenError, NotFoundError } from "@/server/errors";
import { dateFromToday, TestData } from "@/test/factories";

const data = new TestData();
let admin: Actor;
let teacher: Actor;
let otherTeacher: Actor;
let lockedTeacher: Actor;
let student: Actor;
let courseId: number;

function classInput(overrides: Record<string, string> = {}) {
  return {
    courseId: String(courseId),
    teacherId: String(teacher.id),
    name: "PY-01",
    tuitionFee: "2000000",
    depositAmount: "500000",
    minStudents: "5",
    maxStudents: "30",
    startDate: dateFromToday(14),
    endDate: dateFromToday(70),
    ...overrides,
  };
}

beforeAll(async () => {
  admin = await data.user("ADMIN");
  teacher = await data.user("TEACHER");
  otherTeacher = await data.user("TEACHER");
  lockedTeacher = await data.user("TEACHER", { status: "LOCKED" });
  student = await data.user("STUDENT");
  courseId = (await data.course(admin.id, "PUBLISHED")).id;
});

afterAll(async () => {
  await data.cleanup();
});

describe("US-12: Admin mở lớp và phân công giảng viên", () => {
  it("lớp có đủ thông tin, trạng thái UPCOMING, đúng 1 giảng viên, ghi admin mở lớp", async () => {
    const created = await openClass(admin, classInput());
    expect(created).toMatchObject({
      courseId,
      teacherId: teacher.id,
      adminId: admin.id,
      status: "UPCOMING",
      tuitionFee: 2_000_000,
      depositAmount: 500_000,
      minStudents: 5,
      maxStudents: 30,
    });
  });

  it("US-29, BR-12: tự tạo đúng 1 đề thi cuối kỳ DISABLED trong cùng transaction", async () => {
    const created = await openClass(admin, classInput({ name: "PY-02" }));
    const exams = await db.exam.findMany({ where: { classId: created.id } });
    expect(exams).toHaveLength(1);
    expect(exams[0]).toMatchObject({ status: "DISABLED", adminId: admin.id, maxAttempts: 1 });
    // UQ(class_id): không tạo được đề thứ hai cho cùng lớp
    await expect(db.exam.create({ data: { classId: created.id, adminId: admin.id } })).rejects.toThrow();
  });

  it("ngày khai giảng không ở quá khứ (giờ server)", async () => {
    await expect(openClass(admin, classInput({ startDate: dateFromToday(-1) }))).rejects.toThrow(/quá khứ/);
    await expect(openClass(admin, classInput({ startDate: dateFromToday(0) }))).resolves.toBeDefined();
  });

  it("không mở lớp cho môn đã ngừng hoặc sau ngày ngừng mở lớp mới", async () => {
    const archived = await data.course(admin.id, "ARCHIVED");
    await expect(openClass(admin, classInput({ courseId: String(archived.id) }))).rejects.toThrow(/đã ngừng/);

    const ending = await data.course(admin.id, "PUBLISHED");
    await db.course.update({
      where: { id: ending.id },
      data: { dateEnd: new Date(`${dateFromToday(7)}T00:00:00Z`) },
    });
    await expect(openClass(admin, classInput({ courseId: String(ending.id) }))).rejects.toThrow(
      /ngừng mở lớp/,
    );
  });

  it("không phân công giảng viên đang bị khoá; lỗi thì không tạo lớp lẫn đề", async () => {
    const before = await db.class.count({ where: { courseId } });
    await expect(openClass(admin, classInput({ teacherId: String(lockedTeacher.id) }))).rejects.toThrow(
      /khoá/,
    );
    await expect(openClass(admin, classInput({ teacherId: String(student.id) }))).rejects.toThrow(
      /không tồn tại/,
    );
    expect(await db.class.count({ where: { courseId } })).toBe(before);
  });

  it("US-03: chỉ Admin mở được lớp", async () => {
    await expect(openClass(teacher, classInput())).rejects.toThrow(ForbiddenError);
    await expect(openClass(student, classInput())).rejects.toThrow(ForbiddenError);
  });

  it("sửa lớp khi còn UPCOMING; lớp đã huỷ thì không sửa được", async () => {
    const created = await openClass(admin, classInput({ name: "EDIT" }));
    const { courseId: openedCourseId, ...rest } = classInput({ name: "EDIT-2", maxStudents: "40" });
    expect(openedCourseId).toBe(String(courseId));
    const updated = await updateClass(admin, created.id, rest);
    expect(updated).toMatchObject({ name: "EDIT-2", maxStudents: 40 });

    await db.class.update({ where: { id: created.id }, data: { status: "CANCELLED" } });
    await expect(updateClass(admin, created.id, rest)).rejects.toThrow(/đang nhận đăng ký/);
  });

  it("FR-3.2: đổi giảng viên cho lớp chưa kết thúc", async () => {
    const created = await openClass(admin, classInput({ name: "SWAP" }));
    await changeTeacher(admin, { classId: created.id, teacherId: otherTeacher.id });
    expect((await db.class.findUniqueOrThrow({ where: { id: created.id } })).teacherId).toBe(otherTeacher.id);

    await db.class.update({ where: { id: created.id }, data: { status: "FINISHED" } });
    await expect(changeTeacher(admin, { classId: created.id, teacherId: teacher.id })).rejects.toThrow(
      /kết thúc/,
    );
  });
});

describe("US-13: giảng viên xem lớp được phân công", () => {
  it("chỉ thấy lớp của mình (BR-20)", async () => {
    const mine = await openClass(admin, classInput({ name: "MINE", teacherId: String(otherTeacher.id) }));
    const list = await teacherListClasses(otherTeacher);
    expect(list.some((item) => item.id === mine.id)).toBe(true);
    expect(list.every((item) => item.teacher.userId === otherTeacher.id)).toBe(true);

    const detail = await teacherGetClass(otherTeacher, mine.id);
    expect(detail.course.id).toBe(courseId);
    expect(detail.students).toEqual([]);

    await expect(teacherGetClass(teacher, mine.id)).rejects.toThrow(NotFoundError);
    await expect(teacherListClasses(admin)).rejects.toThrow(ForbiddenError);
  });
});
