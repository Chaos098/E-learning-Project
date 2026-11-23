import type { ActionState } from "@/server/action-state";

/** Thông báo chung của form: lỗi (đỏ) hoặc thành công (xanh). Có chữ, không chỉ dựa vào màu (NFR-12). */
export function FormMessage({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return state.ok ? (
    <p
      role="status"
      className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800"
    >
      ✓ {state.message}
    </p>
  ) : (
    <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      ⚠ {state.message}
    </p>
  );
}

/** Lỗi của một ô nhập, gắn với ô bằng `aria-describedby`. */
export function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p id={id} className="text-sm text-red-700">
      {errors[0]}
    </p>
  );
}
