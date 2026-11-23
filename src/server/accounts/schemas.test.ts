import { describe, expect, it } from "vitest";

import { createTeacherSchema, registerSchema } from "@/server/accounts/schemas";
import { lessonSchema } from "@/server/courses/schemas";

describe("US-01: dữ liệu đăng ký", () => {
  it("email được chuyển về chữ thường, bỏ khoảng trắng", () => {
    const data = registerSchema.parse({
      name: "  Nguyễn Văn A ",
      email: " A@Example.COM ",
      password: "12345678",
      confirmPassword: "12345678",
    });
    expect(data.email).toBe("a@example.com");
    expect(data.name).toBe("Nguyễn Văn A");
  });

  it("mật khẩu tối thiểu 8 ký tự và phải nhập lại khớp", () => {
    const short = registerSchema.safeParse({
      name: "Ab",
      email: "a@b.vn",
      password: "1234567",
      confirmPassword: "1234567",
    });
    expect(short.success).toBe(false);
    const mismatch = registerSchema.safeParse({
      name: "Ab",
      email: "a@b.vn",
      password: "12345678",
      confirmPassword: "x",
    });
    expect(mismatch.success ? {} : mismatch.error.flatten().fieldErrors.confirmPassword).toBeDefined();
  });
});

describe("US-05: hệ số lương", () => {
  const base = { name: "GV", email: "gv@x.vn", password: "12345678" };
  it("nhận số dương, tối đa 2 chữ số thập phân, cả dấu phẩy", () => {
    expect(createTeacherSchema.parse({ ...base, salaryCoefficient: "1,5" }).salaryCoefficient).toBe(1.5);
    expect(createTeacherSchema.parse({ ...base, salaryCoefficient: "2.25" }).salaryCoefficient).toBe(2.25);
  });
  it("từ chối 0, số âm, quá 2 chữ số thập phân", () => {
    for (const value of ["0", "-1", "1.234", "abc", "100"]) {
      expect(createTeacherSchema.safeParse({ ...base, salaryCoefficient: value }).success).toBe(false);
    }
  });
});

describe("US-09: link video của bài học", () => {
  it("chỉ nhận link https của YouTube hoặc Google Drive", () => {
    expect(lessonSchema.parse({ title: "B", videoUrl: "https://youtu.be/abc" }).videoUrl).toBe(
      "https://youtu.be/abc",
    );
    expect(lessonSchema.parse({ title: "B", videoUrl: "" }).videoUrl).toBeNull();
    expect(lessonSchema.safeParse({ title: "B", videoUrl: "http://youtube.com/x" }).success).toBe(false);
    expect(lessonSchema.safeParse({ title: "B", videoUrl: "https://evil.example/x" }).success).toBe(false);
    expect(lessonSchema.safeParse({ title: "B", videoUrl: "javascript:alert(1)" }).success).toBe(false);
  });
});
