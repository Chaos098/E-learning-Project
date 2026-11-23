"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/server/action-state";

/** Sửa hệ số lương ngay trên dòng của giảng viên (US-05). */
export function SalaryForm({
  action,
  value,
  teacherName,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  value: number;
  teacherName: string;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="flex flex-wrap items-center justify-end gap-1 md:justify-start">
      <Input
        name="salaryCoefficient"
        defaultValue={value.toFixed(2)}
        inputMode="decimal"
        aria-label={`Hệ số lương của ${teacherName}`}
        className="h-7 w-20"
      />
      <SubmitButton size="sm" variant="outline" pendingText="…">
        Lưu
      </SubmitButton>
      {state.message ? (
        <span
          role={state.ok ? "status" : "alert"}
          className={state.ok ? "text-xs text-green-700" : "w-full text-xs text-red-700"}
        >
          {state.ok ? "✓ " : "⚠ "}
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
