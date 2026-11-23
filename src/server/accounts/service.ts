import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { type Actor, assertRole } from "@/server/auth/roles";
import { BusinessError, NotFoundError } from "@/server/errors";
import {
  createAdminSchema,
  type CreateAdminInput,
  createTeacherSchema,
  type CreateTeacherInput,
  registerSchema,
  type RegisterInput,
  setUserStatusSchema,
  updateSalarySchema,
} from "@/server/accounts/schemas";

const DUPLICATE_EMAIL = "Email này đã được dùng cho một tài khoản khác.";

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function ensureEmailFree(email: string) {
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new BusinessError(DUPLICATE_EMAIL);
}

/** US-01: khách tự đăng ký tài khoản học viên — 1 dòng `user` + 1 dòng `student` trong cùng transaction (BR-02). */
export async function registerStudent(input: RegisterInput) {
  const data = registerSchema.parse(input);
  await ensureEmailFree(data.email);
  const hashedPwd = await hashPassword(data.password);
  try {
    return await db.user.create({
      data: { email: data.email, name: data.name, hashedPwd, role: "STUDENT", student: { create: {} } },
      select: { id: true, email: true, name: true, role: true },
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new BusinessError(DUPLICATE_EMAIL);
    throw error;
  }
}

/** US-05: Admin tạo tài khoản giảng viên (`user` + `teacher` có hệ số lương). */
export async function createTeacher(actor: Actor | null, input: CreateTeacherInput) {
  assertRole(actor, "ADMIN");
  const data = createTeacherSchema.parse(input);
  await ensureEmailFree(data.email);
  const hashedPwd = await hashPassword(data.password);
  try {
    return await db.user.create({
      data: {
        email: data.email,
        name: data.name,
        hashedPwd,
        role: "TEACHER",
        teacher: { create: { salaryCoefficient: new Prisma.Decimal(data.salaryCoefficient) } },
      },
      select: { id: true, email: true, name: true, role: true },
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new BusinessError(DUPLICATE_EMAIL);
    throw error;
  }
}

/** US-05, BR-04: Admin tạo tài khoản Admin khác (`user` + `admin`). */
export async function createAdmin(actor: Actor | null, input: CreateAdminInput) {
  assertRole(actor, "ADMIN");
  const data = createAdminSchema.parse(input);
  await ensureEmailFree(data.email);
  const hashedPwd = await hashPassword(data.password);
  try {
    return await db.user.create({
      data: { email: data.email, name: data.name, hashedPwd, role: "ADMIN", admin: { create: {} } },
      select: { id: true, email: true, name: true, role: true },
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new BusinessError(DUPLICATE_EMAIL);
    throw error;
  }
}

/** US-05: sửa hệ số lương của giảng viên. */
export async function updateSalaryCoefficient(
  actor: Actor | null,
  input: { userId: number | string; salaryCoefficient: string },
) {
  assertRole(actor, "ADMIN");
  const data = updateSalarySchema.parse(input);
  const teacher = await db.teacher.findUnique({ where: { userId: data.userId }, select: { userId: true } });
  if (!teacher) throw new NotFoundError("Không tìm thấy giảng viên.");
  return db.teacher.update({
    where: { userId: data.userId },
    data: { salaryCoefficient: new Prisma.Decimal(data.salaryCoefficient) },
  });
}

/** US-05: khoá / mở khoá tài khoản. Admin không tự khoá chính mình. */
export async function setUserStatus(actor: Actor | null, input: { userId: number | string; status: string }) {
  assertRole(actor, "ADMIN");
  const data = setUserStatusSchema.parse(input);
  if (data.userId === actor.id && data.status === "LOCKED") {
    throw new BusinessError("Bạn không thể tự khoá tài khoản của mình.");
  }
  const user = await db.user.findUnique({ where: { id: data.userId }, select: { id: true } });
  if (!user) throw new NotFoundError("Không tìm thấy tài khoản.");
  return db.user.update({
    where: { id: data.userId },
    data: { status: data.status },
    select: { id: true, status: true },
  });
}
