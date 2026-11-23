"use client";

import { useActionState } from "react";

import { SelectField } from "@/components/form-field";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import type { ActionState } from "@/server/action-state";

/** FR-3.2: đổi giảng viên cho lớp đang học. */
export function ChangeTeacherForm({
  action,
  teachers,
  currentTeacherId,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  teachers: { id: number; label: string }[];
  currentTeacherId: number;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="grid gap-3">
      <SelectField
        name="teacherId"
        label="Giảng viên"
        defaultValue={String(currentTeacherId)}
        id="change-teacher"
      >
        {teachers.map((teacher) => (
          <option key={teacher.id} value={teacher.id}>
            {teacher.label}
          </option>
        ))}
      </SelectField>
      <FormMessage state={state} />
      <SubmitButton size="sm" className="justify-self-start">
        Đổi giảng viên
      </SubmitButton>
    </form>
  );
}
