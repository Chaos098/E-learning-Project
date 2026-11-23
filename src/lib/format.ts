const vndFormatter = new Intl.NumberFormat("vi-VN");

/** Múi giờ hiển thị của hệ thống (NFR-11). */
export const APP_TIME_ZONE = "Asia/Ho_Chi_Minh";

/** Định dạng số tiền VND, ví dụ 1500000 → "1.500.000 ₫". */
export function formatVnd(amount: number): string {
  return `${vndFormatter.format(Math.round(amount))} ₫`;
}

/** Định dạng tỉ lệ 0..1 thành phần trăm nguyên, ví dụ 0.256 → "26%". Giá trị ngoài khoảng được kẹp lại. */
export function formatPercent(ratio: number): string {
  const clamped = Math.min(1, Math.max(0, ratio));
  return `${Math.round(clamped * 100)}%`;
}

const dateOnlyFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

const dateTimePartsFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: APP_TIME_ZONE,
});

/**
 * Định dạng cột kiểu DATE (Prisma trả về nửa đêm UTC) thành dd/MM/yyyy.
 * Không đổi múi giờ để ngày không bị lệch.
 */
export function formatDate(date: Date): string {
  return dateOnlyFormatter.format(date);
}

/** Định dạng mốc thời gian (TIMESTAMPTZ) theo giờ Việt Nam, ví dụ "23/11/2026 08:30". */
export function formatDateTime(date: Date): string {
  const parts = Object.fromEntries(
    dateTimePartsFormatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`;
}

/** Giá trị cho ô `<input type="date">` từ một cột DATE: "2026-12-15". */
export function toDateInputValue(date: Date | null | undefined): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

/** Đọc chuỗi "yyyy-MM-dd" thành Date nửa đêm UTC (đúng cách Prisma lưu cột DATE). Sai định dạng trả về null. */
export function parseDateInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || toDateInputValue(date) !== value ? null : date;
}

/** Ngày hôm nay theo giờ server ở Việt Nam (BR-25), dạng Date nửa đêm UTC để so với cột DATE. */
export function todayDate(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return new Date(`${parts}T00:00:00Z`);
}
