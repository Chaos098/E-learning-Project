// Hàm tạo dữ liệu cho test tích hợp. Mỗi bộ test tạo dữ liệu riêng (email có hậu tố ngẫu nhiên)
// và gọi cleanup() ở afterAll để không ảnh hưởng dữ liệu mẫu hay bộ test khác.
import { randomUUID } from "node:crypto";

import { Prisma, type UserRole } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import type { Actor } from "@/server/auth/roles";

export const TEST_PASSWORD = "matkhau-test-123";

export class TestData {
  readonly tag = randomUUID().slice(0, 8);
  private userIds: number[] = [];
  private courseIds: number[] = [];
  private hashed?: string;

  email(prefix: string) {
    return `${prefix}.${this.tag}@test.local`;
  }

  trackUser(id: number) {
    this.userIds.push(id);
  }

  trackCourse(id: number) {
    this.courseIds.push(id);
  }

  async user(
    role: UserRole,
    options: { status?: "ACTIVE" | "LOCKED"; coefficient?: string } = {},
  ): Promise<Actor> {
    this.hashed ??= await hashPassword(TEST_PASSWORD);
    const email = this.email(`${role.toLowerCase()}-${this.userIds.length + 1}`);
    const user = await db.user.create({
      data: {
        email,
        name: `${role} ${this.tag}`,
        hashedPwd: this.hashed,
        role,
        status: options.status ?? "ACTIVE",
        ...(role === "ADMIN" ? { admin: { create: {} } } : {}),
        ...(role === "TEACHER"
          ? { teacher: { create: { salaryCoefficient: new Prisma.Decimal(options.coefficient ?? "1.00") } } }
          : {}),
        ...(role === "STUDENT" ? { student: { create: {} } } : {}),
      },
    });
    this.trackUser(user.id);
    return { id: user.id, role: user.role, name: user.name, email: user.email };
  }

  async course(adminId: number, status: "DRAFT" | "PUBLISHED" | "ARCHIVED" = "PUBLISHED", name?: string) {
    const course = await db.course.create({
      data: { adminId, name: name ?? `Môn test ${this.tag} ${this.courseIds.length + 1}`, status },
    });
    this.trackCourse(course.id);
    return course;
  }

  async cleanup() {
    const classFilter = {
      OR: [
        { courseId: { in: this.courseIds } },
        { teacherId: { in: this.userIds } },
        { adminId: { in: this.userIds } },
      ],
    };
    await db.exam.deleteMany({ where: { class: classFilter } });
    await db.class.deleteMany({ where: classFilter });
    await db.course.deleteMany({
      where: { OR: [{ id: { in: this.courseIds } }, { adminId: { in: this.userIds } }] },
    });
    await db.user.deleteMany({
      where: { OR: [{ id: { in: this.userIds } }, { email: { endsWith: `.${this.tag}@test.local` } }] },
    });
  }
}

/** Ngày dạng "yyyy-MM-dd" cách hôm nay `days` ngày (giờ server). */
export function dateFromToday(days: number, now = new Date()): string {
  const base = new Date(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(now) + "T00:00:00Z",
  );
  return new Date(base.getTime() + days * 86_400_000).toISOString().slice(0, 10);
}
