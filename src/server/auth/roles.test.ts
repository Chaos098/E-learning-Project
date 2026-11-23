import { describe, expect, it } from "vitest";

import {
  type Actor,
  assertRole,
  homePathFor,
  requiredRoleForPath,
  safeCallbackPath,
} from "@/server/auth/roles";
import { ForbiddenError } from "@/server/errors";

const admin: Actor = { id: 1, role: "ADMIN", name: "A", email: "a@x" };
const student: Actor = { id: 2, role: "STUDENT", name: "S", email: "s@x" };

describe("US-03: phân quyền theo vai trò", () => {
  it("mỗi khu vực thuộc đúng một vai trò, trang khác là công khai", () => {
    expect(requiredRoleForPath("/admin")).toBe("ADMIN");
    expect(requiredRoleForPath("/admin/users")).toBe("ADMIN");
    expect(requiredRoleForPath("/teacher/classes/3")).toBe("TEACHER");
    expect(requiredRoleForPath("/student")).toBe("STUDENT");
    expect(requiredRoleForPath("/courses/1")).toBeNull();
    expect(requiredRoleForPath("/administrator")).toBeNull();
  });

  it("FR-1.5: trang chủ theo vai trò sau khi đăng nhập", () => {
    expect(homePathFor("ADMIN")).toBe("/admin");
    expect(homePathFor("TEACHER")).toBe("/teacher");
    expect(homePathFor("STUDENT")).toBe("/student");
  });

  it("assertRole chặn người chưa đăng nhập và sai vai trò", () => {
    expect(() => assertRole(null, "ADMIN")).toThrow(ForbiddenError);
    expect(() => assertRole(student, "ADMIN")).toThrow(ForbiddenError);
    expect(() => assertRole(admin, "ADMIN")).not.toThrow();
    expect(() => assertRole(student, "ADMIN", "STUDENT")).not.toThrow();
  });
});

describe("US-02: chuyển trang sau khi đăng nhập", () => {
  it("về trang đang muốn vào nếu đúng vai trò", () => {
    expect(safeCallbackPath("/courses/5", "STUDENT")).toBe("/courses/5");
    expect(safeCallbackPath("/admin/users?role=TEACHER", "ADMIN")).toBe("/admin/users?role=TEACHER");
  });

  it("về trang chủ của vai trò khi đường dẫn thuộc vai trò khác, rỗng hoặc trỏ ra ngoài", () => {
    expect(safeCallbackPath("/admin", "STUDENT")).toBe("/student");
    expect(safeCallbackPath(undefined, "TEACHER")).toBe("/teacher");
    expect(safeCallbackPath("https://evil.example", "ADMIN")).toBe("/admin");
    expect(safeCallbackPath("//evil.example", "ADMIN")).toBe("/admin");
    expect(safeCallbackPath("/\\evil.example", "ADMIN")).toBe("/admin");
    expect(safeCallbackPath("/login", "ADMIN")).toBe("/admin");
  });
});
