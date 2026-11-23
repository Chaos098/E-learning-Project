// @vitest-environment node
// Test tích hợp — cần CSDL Docker đang chạy (npm run db:up).
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { listUsers } from "@/server/accounts/queries";
import {
  createAdmin,
  createTeacher,
  registerStudent,
  setUserStatus,
  updateSalaryCoefficient,
} from "@/server/accounts/service";
import { authenticate } from "@/server/auth/authenticate";
import type { Actor } from "@/server/auth/roles";
import { BusinessError, ForbiddenError } from "@/server/errors";
import { TEST_PASSWORD, TestData } from "@/test/factories";

const data = new TestData();
let admin: Actor;
let teacher: Actor;
let student: Actor;

beforeAll(async () => {
  admin = await data.user("ADMIN");
  teacher = await data.user("TEACHER", { coefficient: "1.50" });
  student = await data.user("STUDENT");
});

afterAll(async () => {
  await data.cleanup();
});

describe("US-01: khách đăng ký tài khoản học viên", () => {
  it("tạo 1 dòng user (STUDENT, ACTIVE) và 1 dòng student cùng user_id; mật khẩu chỉ lưu dạng băm", async () => {
    const email = data.email("dangky");
    const created = await registerStudent({
      name: "Học viên mới",
      email: email.toUpperCase(),
      password: "matkhau123",
      confirmPassword: "matkhau123",
    });
    data.trackUser(created.id);

    const user = await db.user.findUniqueOrThrow({
      where: { id: created.id },
      include: { student: true, teacher: true, admin: true },
    });
    expect(user.email).toBe(email);
    expect(user.role).toBe("STUDENT");
    expect(user.status).toBe("ACTIVE");
    expect(user.student?.userId).toBe(user.id);
    expect(user.teacher).toBeNull();
    expect(user.admin).toBeNull();
    expect(user.hashedPwd).not.toContain("matkhau123");
    expect(user.hashedPwd).toMatch(/^\$2[aby]\$/);
    expect(await verifyPassword("matkhau123", user.hashedPwd)).toBe(true);
  });

  it("BR-03: email không được trùng (kể cả khác hoa thường)", async () => {
    await expect(
      registerStudent({
        name: "Trùng",
        email: student.email.toUpperCase(),
        password: "matkhau123",
        confirmPassword: "matkhau123",
      }),
    ).rejects.toThrow(/đã được dùng/);
  });
});

describe("US-02: đăng nhập", () => {
  it("đúng email và mật khẩu thì đăng nhập được, trả về vai trò", async () => {
    const result = await authenticate(` ${teacher.email.toUpperCase()} `, TEST_PASSWORD);
    expect(result).toEqual({
      status: "ok",
      user: expect.objectContaining({ id: teacher.id, role: "TEACHER" }),
    });
  });

  it("sai mật khẩu và email không tồn tại cho cùng một kết quả chung", async () => {
    expect(await authenticate(teacher.email, "sai-mat-khau")).toEqual({ status: "invalid" });
    expect(await authenticate(data.email("khong-ton-tai"), TEST_PASSWORD)).toEqual({ status: "invalid" });
  });

  it("tài khoản LOCKED không đăng nhập được", async () => {
    const locked = await data.user("STUDENT", { status: "LOCKED" });
    expect(await authenticate(locked.email, TEST_PASSWORD)).toEqual({ status: "locked" });
  });
});

describe("US-05: Admin quản lý tài khoản", () => {
  it("tạo giảng viên: user TEACHER + teacher có hệ số lương", async () => {
    const created = await createTeacher(admin, {
      name: "GV mới",
      email: data.email("gvmoi"),
      password: "matkhau123",
      salaryCoefficient: "1,75",
    });
    data.trackUser(created.id);
    const row = await db.teacher.findUniqueOrThrow({ where: { userId: created.id } });
    expect(created.role).toBe("TEACHER");
    expect(row.salaryCoefficient.toNumber()).toBe(1.75);
  });

  it("BR-04: tạo tài khoản Admin khác", async () => {
    const created = await createAdmin(admin, {
      name: "Admin 2",
      email: data.email("admin2"),
      password: "matkhau123",
    });
    data.trackUser(created.id);
    expect(await db.admin.findUnique({ where: { userId: created.id } })).not.toBeNull();
  });

  it("US-03: giảng viên và học viên không tạo được tài khoản", async () => {
    const input = { name: "X", email: data.email("x"), password: "matkhau123", salaryCoefficient: "1" };
    await expect(createTeacher(teacher, input)).rejects.toThrow(ForbiddenError);
    await expect(createAdmin(student, input)).rejects.toThrow(ForbiddenError);
    await expect(createTeacher(null, input)).rejects.toThrow(ForbiddenError);
  });

  it("sửa hệ số lương của giảng viên; tài khoản không phải giảng viên thì báo lỗi", async () => {
    await updateSalaryCoefficient(admin, { userId: teacher.id, salaryCoefficient: "2.25" });
    const row = await db.teacher.findUniqueOrThrow({ where: { userId: teacher.id } });
    expect(row.salaryCoefficient.toNumber()).toBe(2.25);
    await expect(
      updateSalaryCoefficient(admin, { userId: student.id, salaryCoefficient: "2" }),
    ).rejects.toThrow(BusinessError);
    await expect(
      updateSalaryCoefficient(teacher, { userId: teacher.id, salaryCoefficient: "9" }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("khoá rồi mở khoá tài khoản; Admin không tự khoá mình", async () => {
    const target = await data.user("STUDENT");
    await setUserStatus(admin, { userId: target.id, status: "LOCKED" });
    expect(await authenticate(target.email, TEST_PASSWORD)).toEqual({ status: "locked" });
    await setUserStatus(admin, { userId: target.id, status: "ACTIVE" });
    expect((await authenticate(target.email, TEST_PASSWORD)).status).toBe("ok");
    await expect(setUserStatus(admin, { userId: admin.id, status: "LOCKED" })).rejects.toThrow(/tự khoá/);
  });

  it("danh sách lọc theo vai trò và tìm theo email", async () => {
    const teachers = await listUsers(admin, { role: "TEACHER", q: data.tag });
    expect(teachers.users.length).toBeGreaterThan(0);
    expect(teachers.users.every((user) => user.role === "TEACHER")).toBe(true);
    expect(teachers.users.find((user) => user.id === teacher.id)?.salaryCoefficient).toBeTypeOf("number");
    await expect(listUsers(student)).rejects.toThrow(ForbiddenError);
  });
});
