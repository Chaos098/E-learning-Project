import { z } from "zod";

import { parseDateInput } from "@/lib/format";

const MAX_MONEY = 1_000_000_000;

/**
 * Số tiền VND: số nguyên ≥ 0. Nhận "2000000" hoặc "2.000.000" (dấu chấm phân cách hàng nghìn).
 * "1500.5" hay "1,5" bị từ chối, không tự hiểu thành số khác.
 */
const money = (label: string) =>
  z
    .string()
    .transform((value) => value.replace(/[\s₫]/g, ""))
    .pipe(
      z.string().regex(/^(\d+|\d{1,3}(\.\d{3})+)$/, {
        error: `${label} phải là số nguyên đồng, ví dụ 2000000 hoặc 2.000.000.`,
      }),
    )
    .transform((value) => Number(value.replace(/\./g, "")))
    .refine((value) => value <= MAX_MONEY, { error: `${label} tối đa 1.000.000.000 ₫.` });

const count = (label: string) =>
  z.coerce
    .number({ error: `${label} phải là số.` })
    .int({ error: `${label} phải là số nguyên.` })
    .min(1, { error: `${label} tối thiểu là 1.` })
    .max(1000, { error: `${label} tối đa là 1000.` });

const date = (label: string) =>
  z
    .string()
    .trim()
    .transform((value, ctx) => {
      const parsed = parseDateInput(value);
      if (!parsed) {
        ctx.addIssue({ code: "custom", message: `${label} không hợp lệ.` });
        return z.NEVER;
      }
      return parsed;
    });

const classFields = z.object({
  teacherId: z.coerce
    .number({ error: "Hãy chọn giảng viên." })
    .int()
    .positive({ error: "Hãy chọn giảng viên." }),
  name: z
    .string()
    .trim()
    .min(2, { error: "Tên lớp tối thiểu 2 ký tự." })
    .max(100, { error: "Tên lớp tối đa 100 ký tự." }),
  tuitionFee: money("Học phí"),
  depositAmount: money("Tiền cọc"),
  minStudents: count("Sĩ số tối thiểu"),
  maxStudents: count("Sĩ số tối đa"),
  startDate: date("Ngày khai giảng"),
  endDate: date("Ngày kết thúc"),
});

function refineClass<T extends z.infer<typeof classFields>>(data: T, ctx: z.RefinementCtx) {
  if (data.depositAmount > data.tuitionFee) {
    ctx.addIssue({
      code: "custom",
      path: ["depositAmount"],
      message: "Tiền cọc không được lớn hơn học phí.",
    });
  }
  if (data.maxStudents < data.minStudents) {
    ctx.addIssue({
      code: "custom",
      path: ["maxStudents"],
      message: "Sĩ số tối đa phải lớn hơn hoặc bằng sĩ số tối thiểu.",
    });
  }
  if (data.endDate.getTime() <= data.startDate.getTime()) {
    ctx.addIssue({ code: "custom", path: ["endDate"], message: "Ngày kết thúc phải sau ngày khai giảng." });
  }
}

/** US-12: mở lớp. */
export const openClassSchema = classFields
  .extend({
    courseId: z.coerce.number({ error: "Hãy chọn môn học." }).int().positive({ error: "Hãy chọn môn học." }),
  })
  .superRefine(refineClass);

/** Sửa thông tin lớp khi lớp còn `UPCOMING` (không đổi môn học). */
export const updateClassSchema = classFields.superRefine(refineClass);

export const changeTeacherSchema = z.object({
  classId: z.coerce.number().int().positive(),
  teacherId: z.coerce
    .number({ error: "Hãy chọn giảng viên." })
    .int()
    .positive({ error: "Hãy chọn giảng viên." }),
});

export type OpenClassInput = z.input<typeof openClassSchema>;
export type UpdateClassInput = z.input<typeof updateClassSchema>;
