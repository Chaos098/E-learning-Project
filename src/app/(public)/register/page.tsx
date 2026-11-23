import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { homePathFor } from "@/server/auth/roles";
import { getActor } from "@/server/auth/session";

import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Đăng ký học viên" };

export default async function RegisterPage() {
  const actor = await getActor();
  if (actor) redirect(homePathFor(actor.role));
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 p-6 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold">Đăng ký học viên</h1>
        <RegisterForm />
      </div>
    </main>
  );
}
