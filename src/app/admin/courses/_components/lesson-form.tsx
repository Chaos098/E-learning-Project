"use client";

import { useActionState } from "react";

import { TextAreaField, TextField } from "@/components/form-field";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import type { ActionState } from "@/server/action-state";

type Initial = { title: string; description: string; videoUrl: string; content: string };

/** US-09: form thêm / sửa bài học — kết hợp được link video, văn bản và file đính kèm. */
export function LessonForm({
  action,
  initial,
  submitLabel,
  idPrefix,
  attachment,
  maxMb,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  initial?: Initial;
  submitLabel: string;
  idPrefix: string;
  /** File đang đính kèm (khi sửa): tên hiển thị và đường dẫn tải về. */
  attachment?: { name: string; href: string } | null;
  maxMb: number;
}) {
  const [state, formAction] = useActionState(action, {});
  const value = (key: keyof Initial) => state.values?.[key] ?? initial?.[key] ?? "";
  return (
    <form action={formAction} className="grid gap-3" noValidate>
      <TextField
        id={`${idPrefix}-title`}
        name="title"
        label="Tên bài học"
        required
        defaultValue={value("title")}
        errors={state.fieldErrors?.title}
      />
      <TextAreaField
        id={`${idPrefix}-description`}
        name="description"
        label="Mô tả ngắn"
        rows={2}
        defaultValue={value("description")}
        errors={state.fieldErrors?.description}
      />
      <TextField
        id={`${idPrefix}-video`}
        name="videoUrl"
        label="Link video (YouTube / Google Drive)"
        type="url"
        placeholder="https://www.youtube.com/watch?v=…"
        defaultValue={value("videoUrl")}
        errors={state.fieldErrors?.videoUrl}
      />
      <TextAreaField
        id={`${idPrefix}-content`}
        name="content"
        label="Nội dung văn bản"
        rows={6}
        defaultValue={value("content")}
        errors={state.fieldErrors?.content}
      />
      <TextField
        id={`${idPrefix}-attachment`}
        name="attachment"
        label={attachment ? "Thay file đính kèm" : "File đính kèm"}
        type="file"
        accept=".pdf,.docx,.pptx,.zip,.png,.jpg,.jpeg"
        hint={`pdf, docx, pptx, zip, png, jpg — tối đa ${maxMb} MB.`}
      />
      {attachment ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <a href={attachment.href} className="underline">
            📎 {attachment.name}
          </a>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" name="removeAttachment" /> Bỏ file đính kèm
          </label>
        </div>
      ) : null}
      <FormMessage state={state} />
      <SubmitButton size="sm" className="justify-self-start">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
