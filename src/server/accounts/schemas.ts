import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Email không hợp lệ." }).max(255, { error: "Email tối đa 255 ký tự." }));

const name = z
  .string()
  .trim()
  .min(2, { error: "Họ tên tối thiểu 2 ký tự." })
  .max(100, { error: "Họ tên tối đa 100 ký tự." });

const password = z
  .string()
  .min(8, { error: "Mật khẩu tối thiểu 8 ký tự." })
  .max(72, { error: "Mật khẩu tối đa 72 ký tự." });

/** Hệ số lương NUMERIC(4,2): lớn hơn 0, tối đa 99,99, nhiều nhất 2 chữ số thập phân. Nhận cả dấu phẩy. */
export const salaryCoefficient = z
  .string()
  .trim()
  .transform((value) => value.replace(",", "."))
  .pipe(
    z.string().regex(/^\d{1,2}(\.\d{1,2})?$/, {
      error: "Hệ số lương là số dương, tối đa 2 chữ số thập phân (ví dụ 1,5).",
    }),
  )
  .transform(Number)
  .refine((value) => value > 0, { error: "Hệ số lương phải lớn hơn 0." });

export const registerSchema = z
  .object({ name, email, password, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Mật khẩu nhập lại không khớp.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().min(1, { error: "Hãy nhập email." }),
  password: z.string().min(1, { error: "Hãy nhập mật khẩu." }),
});

export const createTeacherSchema = z.object({ name, email, password, salaryCoefficient });

export const createAdminSchema = z.object({ name, email, password });

export const updateSalarySchema = z.object({
  userId: z.coerce.number().int().positive(),
  salaryCoefficient,
});

export const setUserStatusSchema = z.object({
  userId: z.coerce.number().int().positive(),
  status: z.enum(["ACTIVE", "LOCKED"]),
});

export type RegisterInput = z.input<typeof registerSchema>;
export type CreateTeacherInput = z.input<typeof createTeacherSchema>;
export type CreateAdminInput = z.input<typeof createAdminSchema>;
