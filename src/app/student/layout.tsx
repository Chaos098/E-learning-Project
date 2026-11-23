import { AppShell } from "@/components/app-shell";
import { requireActor } from "@/server/auth/session";

export default async function StudentLayout({ children }: LayoutProps<"/student">) {
  const actor = await requireActor("STUDENT");
  return <AppShell actor={actor}>{children}</AppShell>;
}
