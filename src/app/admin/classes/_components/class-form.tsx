"use client";

import { useActionState } from "react";

import { SelectField, TextField } from "@/components/form-field";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import type { ActionState } from "@/server/action-state";

type Option = { id: number; label: string };
type Fields =
  | "courseId"
  | "teacherId"
  | "name"
  | "tuitionFee"
  | "depositAmount"
  | "minStudents"
  | "maxStudents"
  | "startDate"
  | "endDate";

/** US-12: form mở lớp / sửa lớp. Khi sửa thì không đổi môn học (`courses` để trống). */
export function ClassForm({
  action,
  courses,
  teachers,
  initial,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  courses?: Option[];
  teachers: Option[];
  initial?: Partial<Record<Fields, string>>;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, {});
  const value = (key: Fields) => state.values?.[key] ?? initial?.[key] ?? "";
  const errors = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2" noValidate>
      {courses ? (
        <SelectField
          name="courseId"
          label="Môn học"
          required
          defaultValue={value("courseId")}
          errors={errors.courseId}
          key={`c-${value("courseId")}`}
        >
          <option value="">— Chọn môn học —</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.label}
            </option>
          ))}
        </SelectField>
      ) : null}
      <SelectField
        name="teacherId"
        label="Giảng viên"
        required
        defaultValue={value("teacherId")}
        errors={errors.teacherId}
        key={`t-${value("teacherId")}`}
      >
        <option value="">— Chọn giảng viên —</option>
        {teachers.map((teacher) => (
          <option key={teacher.id} value={teacher.id}>
            {teacher.label}
          </option>
        ))}
      </SelectField>
      <TextField
        name="name"
        label="Tên lớp"
        required
        placeholder="PY-01"
        defaultValue={value("name")}
        errors={errors.name}
      />
      <TextField
        name="tuitionFee"
        label="Học phí (đồng)"
        inputMode="numeric"
        required
        placeholder="2000000"
        defaultValue={value("tuitionFee")}
        errors={errors.tuitionFee}
      />
      <TextField
        name="depositAmount"
        label="Tiền cọc (đồng)"
        inputMode="numeric"
        required
        placeholder="500000"
        defaultValue={value("depositAmount")}
        errors={errors.depositAmount}
        hint="Không lớn hơn học phí."
      />
      <TextField
        name="minStudents"
        label="Sĩ số tối thiểu"
        type="number"
        min={1}
        required
        defaultValue={value("minStudents")}
        errors={errors.minStudents}
        hint="Tới ngày khai giảng chưa đủ thì lớp bị huỷ và hoàn tiền."
      />
      <TextField
        name="maxStudents"
        label="Sĩ số tối đa"
        type="number"
        min={1}
        required
        defaultValue={value("maxStudents")}
        errors={errors.maxStudents}
      />
      <TextField
        name="startDate"
        label="Ngày khai giảng"
        type="date"
        required
        defaultValue={value("startDate")}
        errors={errors.startDate}
      />
      <TextField
        name="endDate"
        label="Ngày kết thúc"
        type="date"
        required
        defaultValue={value("endDate")}
        errors={errors.endDate}
      />
      <div className="grid gap-2 sm:col-span-2">
        <FormMessage state={state} />
        <SubmitButton className="justify-self-start">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
