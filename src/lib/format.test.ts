import { describe, expect, it } from "vitest";

import { formatPercent, formatVnd } from "@/lib/format";

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
