"use client";

import { useActionState } from "react";

import { TextField } from "@/components/form-field";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { createAdminAction, createTeacherAction } from "@/server/accounts/actions";

/** US-05: tạo tài khoản giảng viên (có hệ số lương). Sau khi tạo thành công form được làm trống. */
export function CreateTeacherForm() {
  const [state, action] = useActionState(createTeacherAction, {});
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2" noValidate>
      <TextField
        name="name"
        label="Họ tên"
        required
        defaultValue={state.values?.name}
        errors={state.fieldErrors?.name}
        id="teacher-name"
      />
      <TextField
        name="email"
        label="Email"
        type="email"
        required
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
        id="teacher-email"
      />
      <TextField
        name="password"
        label="Mật khẩu ban đầu"
        type="password"
        autoComplete="new-password"
        required
        hint="Tối thiểu 8 ký tự; gửi cho giảng viên để đăng nhập."
        errors={state.fieldErrors?.password}
        id="teacher-password"
      />
      <TextField
        name="salaryCoefficient"
        label="Hệ số lương"
        inputMode="decimal"
        required
        defaultValue={state.values?.salaryCoefficient ?? "1.00"}
        errors={state.fieldErrors?.salaryCoefficient}
        id="teacher-coefficient"
      />
      <div className="grid gap-2 sm:col-span-2">
        <FormMessage state={state} />
        <SubmitButton className="justify-self-start">Tạo giảng viên</SubmitButton>
      </div>
    </form>
  );
}

/** US-05, BR-04: tạo tài khoản Admin khác. */
export function CreateAdminForm() {
  const [state, action] = useActionState(createAdminAction, {});
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2" noValidate>
      <TextField
        name="name"
        label="Họ tên"
        required
        defaultValue={state.values?.name}
        errors={state.fieldErrors?.name}
        id="admin-name"
      />
      <TextField
        name="email"
        label="Email"
        type="email"
        required
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
        id="admin-email"
      />
      <TextField
        name="password"
        label="Mật khẩu ban đầu"
        type="password"
        autoComplete="new-password"
        required
        hint="Tối thiểu 8 ký tự."
        errors={state.fieldErrors?.password}
        id="admin-password"
      />
      <div className="grid gap-2 sm:col-span-2">
        <FormMessage state={state} />
        <SubmitButton className="justify-self-start">Tạo Admin</SubmitButton>
      </div>
    </form>
  );
}
