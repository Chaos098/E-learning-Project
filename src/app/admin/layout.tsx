import { AppShell } from "@/components/app-shell";
import { requireActor } from "@/server/auth/session";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const actor = await requireActor("ADMIN");
  return <AppShell actor={actor}>{children}</AppShell>;
}
