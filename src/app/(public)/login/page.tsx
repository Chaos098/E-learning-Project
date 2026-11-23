import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { firstParam } from "@/lib/params";
import { homePathFor } from "@/server/auth/roles";
import { getActor } from "@/server/auth/session";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Đăng nhập" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const actor = await getActor();
  if (actor) redirect(homePathFor(actor.role));
  const callbackUrl = firstParam((await searchParams).callbackUrl);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 p-6 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold">Đăng nhập</h1>
        <LoginForm callbackUrl={callbackUrl} />
      </div>
    </main>
  );
}
