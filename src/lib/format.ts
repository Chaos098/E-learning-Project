const vndFormatter = new Intl.NumberFormat("vi-VN");

/** Định dạng số tiền VND, ví dụ 1500000 → "1.500.000 ₫". */
export function formatVnd(amount: number): string {
  return `${vndFormatter.format(Math.round(amount))} ₫`;
}

/** Định dạng tỉ lệ 0..1 thành phần trăm nguyên, ví dụ 0.256 → "26%". Giá trị ngoài khoảng được kẹp lại. */
export function formatPercent(ratio: number): string {
  const clamped = Math.min(1, Math.max(0, ratio));
  return `${Math.round(clamped * 100)}%`;
}
