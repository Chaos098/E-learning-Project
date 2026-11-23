import { SiteHeader } from "@/components/site-header";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">{children}</div>
      <footer className="border-t border-neutral-200 py-6 text-center text-xs text-neutral-500">
        E-Learning · Đồ án môn Công nghệ phần mềm
      </footer>
    </>
  );
}
