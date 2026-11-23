import { cn } from "@/lib/utils";

type Tone = "gray" | "blue" | "green" | "red" | "amber";

const TONES: Record<Tone, string> = {
  gray: "bg-neutral-100 text-neutral-700 border-neutral-200",
  blue: "bg-blue-50 text-blue-800 border-blue-200",
  green: "bg-green-50 text-green-800 border-green-200",
  red: "bg-red-50 text-red-800 border-red-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
};

/** Nhãn trạng thái theo wireframe: xám (nháp, chưa mở), xanh dương (đang diễn ra), xanh lá (hoàn thành), đỏ (huỷ). */
const LABELS: Record<string, { label: string; tone: Tone }> = {
  // user.status
  ACTIVE: { label: "Hoạt động", tone: "green" },
  LOCKED: { label: "Đã khoá", tone: "red" },
  // course.course_status
  DRAFT: { label: "Nháp", tone: "gray" },
  PUBLISHED: { label: "Đang mở", tone: "blue" },
  ARCHIVED: { label: "Ngừng", tone: "red" },
  // classes.status
  UPCOMING: { label: "Nhận đăng ký", tone: "amber" },
  ONGOING: { label: "Đang học", tone: "blue" },
  FINISHED: { label: "Đã kết thúc", tone: "green" },
  CANCELLED: { label: "Đã huỷ", tone: "red" },
  // exam.status
  DISABLED: { label: "Chưa mở", tone: "gray" },
  SCHEDULED: { label: "Đã lên lịch", tone: "amber" },
  OPEN: { label: "Đang mở", tone: "blue" },
  CLOSED: { label: "Đã đóng", tone: "green" },
};

export function statusLabel(status: string): string {
  return LABELS[status]?.label ?? status;
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const item = LABELS[status] ?? { label: status, tone: "gray" as Tone };
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium whitespace-nowrap",
        TONES[item.tone],
        className,
      )}
    >
      {item.label}
    </span>
  );
}
