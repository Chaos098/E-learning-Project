import { describe, expect, it } from "vitest";

import { openClassSchema } from "@/server/classes/schemas";

const valid = {
  courseId: "1",
  teacherId: "2",
  name: "PY-01",
  tuitionFee: "2.000.000",
  depositAmount: "500000",
  minStudents: "5",
  maxStudents: "30",
  startDate: "2026-12-15",
  endDate: "2027-02-15",
};

function errorsOf(input: Record<string, string>) {
  const result = openClassSchema.safeParse(input);
  return result.success ? {} : result.error.flatten().fieldErrors;
}

describe("US-12: dữ liệu mở lớp", () => {
  it("nhận học phí có dấu chấm phân cách và lưu số nguyên đồng", () => {
    const data = openClassSchema.parse(valid);
    expect(data.tuitionFee).toBe(2_000_000);
    expect(data.depositAmount).toBe(500_000);
    expect(data.startDate.toISOString()).toBe("2026-12-15T00:00:00.000Z");
  });

  it("tiền cọc không lớn hơn học phí", () => {
    expect(errorsOf({ ...valid, depositAmount: "2000001" }).depositAmount).toBeDefined();
    expect(errorsOf({ ...valid, depositAmount: "2000000" }).depositAmount).toBeUndefined();
  });

  it("sĩ số tối đa ≥ tối thiểu ≥ 1", () => {
    expect(errorsOf({ ...valid, maxStudents: "4" }).maxStudents).toBeDefined();
    expect(errorsOf({ ...valid, minStudents: "0" }).minStudents).toBeDefined();
  });

  it("ngày kết thúc sau ngày khai giảng", () => {
    expect(errorsOf({ ...valid, endDate: "2026-12-15" }).endDate).toBeDefined();
    expect(errorsOf({ ...valid, startDate: "15/12/2026" }).startDate).toBeDefined();
  });

  it("học phí phải là số nguyên đồng, không âm", () => {
    expect(errorsOf({ ...valid, tuitionFee: "-5" }).tuitionFee).toBeDefined();
    expect(errorsOf({ ...valid, tuitionFee: "1500.5" }).tuitionFee).toBeDefined();
    expect(errorsOf({ ...valid, teacherId: "" }).teacherId).toBeDefined();
  });
});
