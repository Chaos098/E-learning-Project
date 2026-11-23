"use client";

import { useActionState } from "react";

import { TextAreaField, TextField } from "@/components/form-field";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import type { ActionState } from "@/server/action-state";

/** US-08: form thêm / sửa chương. `idPrefix` để mỗi form trên trang có id ô nhập riêng. */
export function SectionForm({
  action,
  initial,
  submitLabel,
  idPrefix,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  initial?: { name: string; description: string };
  submitLabel: string;
  idPrefix: string;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="grid gap-3" noValidate>
      <TextField
        id={`${idPrefix}-name`}
        name="name"
        label="Tên chương"
        required
        defaultValue={state.values?.name ?? initial?.name ?? ""}
        errors={state.fieldErrors?.name}
      />
      <TextAreaField
        id={`${idPrefix}-description`}
        name="description"
        label="Mô tả chương"
        rows={2}
        defaultValue={state.values?.description ?? initial?.description ?? ""}
        errors={state.fieldErrors?.description}
      />
      <FormMessage state={state} />
      <SubmitButton size="sm" className="justify-self-start">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
