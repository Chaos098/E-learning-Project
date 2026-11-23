"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type Props = React.ComponentProps<typeof Button> & { pendingText?: string };

/** Nút gửi form, tự khoá và đổi chữ khi đang gửi. */
export function SubmitButton({ children, pendingText = "Đang xử lý…", disabled, ...props }: Props) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} aria-disabled={pending || disabled} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}
