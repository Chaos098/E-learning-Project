import { z } from "zod";

import { parseDateInput } from "@/lib/format";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

const id = z.coerce.number().int().positive();

export const courseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, { error: "Tên môn học tối thiểu 3 ký tự." })
    .max(200, { error: "Tên môn học tối đa 200 ký tự." }),
  description: optionalText,
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"], { error: "Trạng thái không hợp lệ." }).default("DRAFT"),
  dateEnd: z
    .string()
    .trim()
    .optional()
    .transform((value, ctx) => {
      if (!value) return null;
      const date = parseDateInput(value);
      if (!date) {
        ctx.addIssue({ code: "custom", message: "Ngày không hợp lệ." });
        return z.NEVER;
      }
      return date;
    }),
});

export const sectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Hãy nhập tên chương." })
    .max(200, { error: "Tên chương tối đa 200 ký tự." }),
  description: optionalText,
});

const VIDEO_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "drive.google.com"];

export const lessonSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { error: "Hãy nhập tên bài học." })
    .max(200, { error: "Tên bài học tối đa 200 ký tự." }),
  description: optionalText,
  videoUrl: z
    .string()
    .trim()
    .optional()
    .transform((value, ctx) => {
      if (!value) return null;
      let url: URL;
      try {
        url = new URL(value);
      } catch {
        ctx.addIssue({ code: "custom", message: "Link video không hợp lệ." });
        return z.NEVER;
      }
      if (url.protocol !== "https:" || !VIDEO_HOSTS.includes(url.hostname) || value.length > 500) {
        ctx.addIssue({ code: "custom", message: "Chỉ nhận link https của YouTube hoặc Google Drive." });
        return z.NEVER;
      }
      return value;
    }),
  content: optionalText,
});

export const moveSchema = z.object({ id, direction: z.enum(["up", "down"]) });

export const idSchema = id;

export type CourseInput = z.input<typeof courseSchema>;
export type SectionInput = z.input<typeof sectionSchema>;
export type LessonInput = z.input<typeof lessonSchema>;
