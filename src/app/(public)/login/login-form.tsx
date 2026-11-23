"use client";

import Link from "next/link";
import { useActionState } from "react";

import { TextField } from "@/components/form-field";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { loginAction } from "@/server/accounts/actions";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action] = useActionState(loginAction, {});
  return (
    <form action={action} className="grid gap-4" noValidate>
      {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}
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
        autoComplete="current-password"
        required
        errors={state.fieldErrors?.password}
      />
      <FormMessage state={state} />
      <SubmitButton size="lg" pendingText="Đang đăng nhập…">
        Đăng nhập
      </SubmitButton>
      <p className="text-center text-sm text-neutral-600">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-medium text-neutral-900 underline">
          Đăng ký
        </Link>
      </p>
    </form>
  );
}
