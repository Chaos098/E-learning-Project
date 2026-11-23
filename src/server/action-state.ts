import { z } from "zod";

import { BusinessError } from "@/server/errors";

/** Kết quả trả về cho form dùng `useActionState`. */
export type ActionState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Dữ liệu vừa nhập, trả lại để form không bị xoá trắng khi báo lỗi. */
  values?: Record<string, string>;
};

export const initialActionState: ActionState = {};

/** Đổi lỗi thành thông báo cho form; lỗi không lường trước thì ghi log và báo câu chung. */
export function toActionState(error: unknown, values?: Record<string, string>): ActionState {
  const state = toErrorState(error);
  if (values) {
    // Không trả mật khẩu về trình duyệt.
    const safe = Object.fromEntries(Object.entries(values).filter(([key]) => !/password/i.test(key)));
    return { ...state, values: safe };
  }
  return state;
}

function toErrorState(error: unknown): ActionState {
  if (error instanceof z.ZodError) {
    return {
      ok: false,
      message: "Dữ liệu chưa hợp lệ, vui lòng kiểm tra lại.",
      fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[] | undefined>,
    };
  }
  if (error instanceof BusinessError) {
    return { ok: false, message: error.message };
  }
  console.error(error);
  return { ok: false, message: "Đã có lỗi xảy ra, vui lòng thử lại." };
}

/** Lấy các trường chữ của FormData thành object để đưa vào Zod. */
export function formToObject(formData: FormData): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$ACTION")) result[key] = value;
  }
  return result;
}
