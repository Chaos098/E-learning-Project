import Link from "next/link";

import { cn } from "@/lib/utils";

/** Phân trang bằng tham số `page` trên URL, giữ nguyên các tham số lọc khác. */
export function Pagination({
  page,
  pageCount,
  basePath,
  params,
}: {
  page: number;
  pageCount: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  if (pageCount <= 1) return null;
  const href = (target: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params ?? {})) if (value) search.set(key, value);
    if (target > 1) search.set("page", String(target));
    const query = search.toString();
    return query ? `${basePath}?${query}` : basePath;
  };
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);
  return (
    <nav aria-label="Phân trang" className="flex flex-wrap items-center justify-center gap-1">
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          className="rounded-md px-3 py-1 text-sm hover:bg-neutral-100"
          aria-label="Trang trước"
        >
          ‹
        </Link>
      ) : null}
      {pages.map((target) => (
        <Link
          key={target}
          href={href(target)}
          aria-current={target === page ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1 text-sm",
            target === page ? "bg-neutral-900 text-white" : "hover:bg-neutral-100",
          )}
        >
          {target}
        </Link>
      ))}
      {page < pageCount ? (
        <Link
          href={href(page + 1)}
          className="rounded-md px-3 py-1 text-sm hover:bg-neutral-100"
          aria-label="Trang sau"
        >
          ›
        </Link>
      ) : null}
    </nav>
  );
}
