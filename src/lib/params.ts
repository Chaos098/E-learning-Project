/** Lấy một giá trị chuỗi từ `searchParams` của Next (có thể là mảng). */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Số trang từ tham số URL; không hợp lệ thì về trang 1. */
export function pageParam(value: string | string[] | undefined): number {
  const page = Number(firstParam(value));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

/** Id dương từ tham số đường dẫn; không hợp lệ trả về null. */
export function idParam(value: string | undefined): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Chỉ nhận giá trị nằm trong danh sách cho phép (dùng cho bộ lọc trạng thái, vai trò). */
export function enumParam<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
): T | undefined {
  const raw = firstParam(value);
  return allowed.includes(raw as T) ? (raw as T) : undefined;
}
