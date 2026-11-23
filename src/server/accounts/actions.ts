"use server";

import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";

import { type ActionState, formToObject, toActionState } from "@/server/action-state";
import { loginSchema } from "@/server/accounts/schemas";
import {
  createAdmin,
  createTeacher,
  registerStudent,
  setUserStatus,
  updateSalaryCoefficient,
} from "@/server/accounts/service";
import { authenticate } from "@/server/auth/authenticate";
import { signIn, signOut } from "@/server/auth/config";
import { safeCallbackPath } from "@/server/auth/roles";
import { requireActor } from "@/server/auth/session";

const INVALID_LOGIN = "Email hoặc mật khẩu không đúng.";

/** US-02: đăng nhập, chuyển về trang chủ theo vai trò (hoặc trang đang muốn vào nếu đúng vai trò). */
export async function loginAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const values = formToObject(formData);
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return toActionState(parsed.error, values);

  const result = await authenticate(parsed.data.email, parsed.data.password);
  if (result.status === "invalid")
    return { ok: false, message: INVALID_LOGIN, values: { email: values.email ?? "" } };
  if (result.status === "locked") {
    return {
      ok: false,
      message: "Tài khoản đã bị khoá. Vui lòng liên hệ quản trị viên.",
      values: { email: values.email ?? "" },
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: safeCallbackPath(values.callbackUrl, result.user.role),
    });
  } catch (error) {
    if (error instanceof AuthError)
      return { ok: false, message: INVALID_LOGIN, values: { email: values.email ?? "" } };
    throw error; // chuyển trang thành công cũng là một "lỗi" redirect của Next, phải ném lại
  }
  return {};
}

/** US-01: khách đăng ký tài khoản học viên rồi được đăng nhập luôn. */
export async function registerAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const values = formToObject(formData);
  try {
    await registerStudent({
      name: values.name ?? "",
      email: values.email ?? "",
      password: values.password ?? "",
      confirmPassword: values.confirmPassword ?? "",
    });
  } catch (error) {
    return toActionState(error, values);
  }
  try {
    await signIn("credentials", {
      email: values.email?.trim().toLowerCase(),
      password: values.password,
      redirectTo: "/student",
    });
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, message: "Đăng ký thành công, hãy đăng nhập lại." };
    throw error;
  }
  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

// ---------- Admin quản lý tài khoản (US-05) ----------

export async function createTeacherAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireActor("ADMIN");
  const values = formToObject(formData);
  try {
    const user = await createTeacher(actor, {
      name: values.name ?? "",
      email: values.email ?? "",
      password: values.password ?? "",
      salaryCoefficient: values.salaryCoefficient ?? "",
    });
    revalidatePath("/admin/users");
    return { ok: true, message: `Đã tạo tài khoản giảng viên ${user.email}.` };
  } catch (error) {
    return toActionState(error, values);
  }
}

export async function createAdminAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireActor("ADMIN");
  const values = formToObject(formData);
  try {
    const user = await createAdmin(actor, {
      name: values.name ?? "",
      email: values.email ?? "",
      password: values.password ?? "",
    });
    revalidatePath("/admin/users");
    return { ok: true, message: `Đã tạo tài khoản Admin ${user.email}.` };
  } catch (error) {
    return toActionState(error, values);
  }
}

export async function updateSalaryAction(
  userId: number,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireActor("ADMIN");
  try {
    await updateSalaryCoefficient(actor, {
      userId,
      salaryCoefficient: String(formData.get("salaryCoefficient") ?? ""),
    });
    revalidatePath("/admin/users");
    return { ok: true, message: "Đã lưu." };
  } catch (error) {
    return toActionState(error);
  }
}

export async function setUserStatusAction(userId: number, status: "ACTIVE" | "LOCKED"): Promise<ActionState> {
  const actor = await requireActor("ADMIN");
  try {
    await setUserStatus(actor, { userId, status });
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (error) {
    return toActionState(error);
  }
}
