import { AppShell } from "@/components/app-shell";
import { requireActor } from "@/server/auth/session";

export default async function TeacherLayout({ children }: LayoutProps<"/teacher">) {
  const actor = await requireActor("TEACHER");
  return <AppShell actor={actor}>{children}</AppShell>;
}
