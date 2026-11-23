import { cn } from "@/lib/utils";

/**
 * Bảng dữ liệu responsive: trên máy tính là bảng, trên điện thoại (dưới 768px) mỗi dòng thành một thẻ,
 * nhãn cột lấy từ `label` của từng ô (wireframe mục 1).
 */
export function DataTable({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="md:overflow-x-auto md:rounded-lg md:border md:border-neutral-200">
      <table className={cn("w-full text-sm max-md:block", className)} {...props} />
    </div>
  );
}

export function DataTableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-neutral-50 text-left text-xs font-medium text-neutral-600 max-md:hidden">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({ className, ...props }: React.ComponentProps<"th">) {
  return <th scope="col" className={cn("px-3 py-2 font-medium", className)} {...props} />;
}

export function DataTableBody(props: React.ComponentProps<"tbody">) {
  return <tbody className="max-md:grid max-md:gap-3" {...props} />;
}

export function Tr({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "border-t border-neutral-200 max-md:block max-md:rounded-lg max-md:border max-md:p-2 md:first:border-t-0",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ label, className, ...props }: React.ComponentProps<"td"> & { label: string }) {
  return (
    <td
      data-label={label}
      className={cn(
        "px-3 py-2 align-middle max-md:flex max-md:items-start max-md:justify-between max-md:gap-4 max-md:px-1 max-md:py-1 max-md:text-right max-md:before:shrink-0 max-md:before:text-left max-md:before:font-medium max-md:before:text-neutral-500 max-md:before:content-[attr(data-label)]",
        className,
      )}
      {...props}
    />
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-8 text-center text-neutral-500 max-md:block">
        {children}
      </td>
    </tr>
  );
}
