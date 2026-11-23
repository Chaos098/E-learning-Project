/**
 * Số học viên còn hiệu lực (đã cọc hoặc trả đủ) của từng lớp, dùng cho sĩ số và số chỗ còn lại.
 * Sprint 1 chưa có bảng đăng ký nên mọi lớp đều là 0; Sprint 2 (T-2.1) thay bằng truy vấn bảng `study`.
 */
export async function activeStudentCounts(classIds: number[]): Promise<Map<number, number>> {
  return new Map(classIds.map((id) => [id, 0]));
}
