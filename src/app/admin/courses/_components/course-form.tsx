"use client";

import { useActionState } from "react";

import { SelectField, TextAreaField, TextField } from "@/components/form-field";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import type { ActionState } from "@/server/action-state";

type Initial = { name: string; description: string; status: string; dateEnd: string };

/** US-07: form tạo / sửa môn học. */
export function CourseForm({
  action,
  initial,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  initial?: Initial;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, {});
  const value = (key: keyof Initial) => state.values?.[key] ?? initial?.[key] ?? "";
  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2" noValidate>
      <TextField
        name="name"
        label="Tên môn học"
        required
        defaultValue={value("name")}
        errors={state.fieldErrors?.name}
        className="md:col-span-2"
      />
      <TextAreaField
        name="description"
        label="Mô tả"
        rows={4}
        defaultValue={value("description")}
        errors={state.fieldErrors?.description}
        className="md:col-span-2"
      />
      <SelectField
        name="status"
        label="Trạng thái"
        defaultValue={value("status") || "DRAFT"}
        errors={state.fieldErrors?.status}
        key={value("status")}
      >
        <option value="DRAFT">Nháp — chưa hiện cho học viên</option>
        <option value="PUBLISHED">Đang mở — hiện trong danh mục</option>
        <option value="ARCHIVED">Ngừng — ẩn, không mở lớp mới</option>
      </SelectField>
      <TextField
        name="dateEnd"
        label="Ngừng mở lớp mới từ ngày"
        type="date"
        defaultValue={value("dateEnd")}
        hint="Để trống nếu không giới hạn."
        errors={state.fieldErrors?.dateEnd}
      />
      <div className="grid gap-2 md:col-span-2">
        <FormMessage state={state} />
        <SubmitButton className="justify-self-start">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
