"use client";

import { useActionState } from "react";

import type { ActionState } from "@/server/action-state";

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  /** Câu hỏi xác nhận trước khi gửi (thao tác không hoàn tác được). */
  confirmMessage?: string;
  className?: string;
};

/** Form nhỏ cho một thao tác trên một dòng (khoá tài khoản, đổi thứ tự, xoá…), hiện lỗi ngay bên cạnh. */
export function ActionForm({ action, children, confirmMessage, className }: Props) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form
      action={formAction}
      className={className}
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      {children}
      {state.message && !state.ok ? (
        <p role="alert" className="mt-1 text-xs text-red-700">
          ⚠ {state.message}
        </p>
      ) : null}
    </form>
  );
}
