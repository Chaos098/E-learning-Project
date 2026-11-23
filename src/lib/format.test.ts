import { describe, expect, it } from "vitest";

import {
  formatDate,
  formatDateTime,
  formatPercent,
  formatVnd,
  parseDateInput,
  toDateInputValue,
  todayDate,
} from "@/lib/format";

describe("formatVnd", () => {
  it("thêm dấu chấm phân cách hàng nghìn và ký hiệu ₫", () => {
    expect(formatVnd(1500000)).toBe("1.500.000 ₫");
  });

  it("làm tròn về số nguyên đồng", () => {
    expect(formatVnd(999.6)).toBe("1.000 ₫");
  });

  it("hiển thị số 0", () => {
    expect(formatVnd(0)).toBe("0 ₫");
  });
});

describe("formatPercent", () => {
  it("đổi tỉ lệ thành phần trăm nguyên", () => {
    expect(formatPercent(0.256)).toBe("26%");
  });

  it("kẹp giá trị trong khoảng 0% – 100%", () => {
    expect(formatPercent(-1)).toBe("0%");
    expect(formatPercent(1.7)).toBe("100%");
  });
});

describe("ngày tháng (NFR-11)", () => {
  it("formatDate hiển thị cột DATE dạng dd/MM/yyyy, không lệch ngày", () => {
    expect(formatDate(new Date("2026-12-15T00:00:00Z"))).toBe("15/12/2026");
  });

  it("formatDateTime hiển thị theo giờ Việt Nam", () => {
    expect(formatDateTime(new Date("2026-11-23T01:30:00Z"))).toBe("23/11/2026 08:30");
  });

  it("parseDateInput đọc yyyy-MM-dd và từ chối ngày sai", () => {
    expect(parseDateInput("2026-02-28")?.toISOString()).toBe("2026-02-28T00:00:00.000Z");
    expect(parseDateInput("2026-02-30")).toBeNull();
    expect(parseDateInput("28/02/2026")).toBeNull();
    expect(toDateInputValue(parseDateInput("2026-02-28"))).toBe("2026-02-28");
  });

  it("todayDate lấy ngày theo giờ Việt Nam (BR-25)", () => {
    // 23:30 UTC ngày 23/11 đã là 06:30 sáng 24/11 ở Việt Nam.
    expect(toDateInputValue(todayDate(new Date("2026-11-23T23:30:00Z")))).toBe("2026-11-24");
  });
});
