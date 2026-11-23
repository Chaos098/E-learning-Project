"use client";

import Link from "next/link";
import { useActionState } from "react";

import { TextField } from "@/components/form-field";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { registerAction } from "@/server/accounts/actions";

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, {});
  return (
    <form action={action} className="grid gap-4" noValidate>
      <TextField
        name="name"
        label="Họ tên"
        autoComplete="name"
        required
        defaultValue={state.values?.name}
        errors={state.fieldErrors?.name}
      />
      <TextField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
      />
      <TextField
        name="password"
        label="Mật khẩu"
        type="password"
        autoComplete="new-password"
        required
        hint="Tối thiểu 8 ký tự."
        errors={state.fieldErrors?.password}
      />
      <TextField
        name="confirmPassword"
        label="Nhập lại mật khẩu"
        type="password"
        autoComplete="new-password"
        required
        errors={state.fieldErrors?.confirmPassword}
      />
      <FormMessage state={state} />
      <SubmitButton size="lg" pendingText="Đang tạo tài khoản…">
        Đăng ký
      </SubmitButton>
      <p className="text-center text-sm text-neutral-600">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-medium text-neutral-900 underline">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
