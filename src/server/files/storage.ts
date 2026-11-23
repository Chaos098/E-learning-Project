import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { BusinessError } from "@/server/errors";

/** Định dạng file được nhận (NFR-05). */
export const ALLOWED_EXTENSIONS = ["pdf", "docx", "pptx", "zip", "png", "jpg", "jpeg"] as const;

const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  zip: "application/zip",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

export function uploadRoot(): string {
  return path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
}

export function maxUploadBytes(): number {
  const mb = Number(process.env.UPLOAD_MAX_MB ?? 10);
  return (Number.isFinite(mb) && mb > 0 ? mb : 10) * 1024 * 1024;
}

function extensionOf(fileName: string): string {
  return path.extname(fileName).slice(1).toLowerCase();
}

/** Kiểm tra dung lượng và định dạng ở server (NFR-05). Ném BusinessError nếu không hợp lệ. */
export function validateUpload(file: { name: string; size: number }): void {
  if (file.size <= 0) throw new BusinessError("File rỗng, hãy chọn file khác.");
  if (file.size > maxUploadBytes()) {
    throw new BusinessError(`File vượt quá ${Math.round(maxUploadBytes() / 1024 / 1024)} MB.`);
  }
  const ext = extensionOf(file.name);
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new BusinessError(`Chỉ nhận file ${ALLOWED_EXTENSIONS.filter((e) => e !== "jpeg").join(", ")}.`);
  }
}

/** Bỏ ký tự lạ khỏi tên file gốc để dùng làm tên khi tải về. */
export function safeFileName(fileName: string): string {
  const ext = extensionOf(fileName);
  const base = path
    .basename(fileName, path.extname(fileName))
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "file"}.${ext}`;
}

/**
 * Lưu file vào `uploads/<folder>/` với tên do hệ thống sinh: `<uuid>__<tên gốc đã làm sạch>`.
 * Trả về đường dẫn tương đối để ghi vào CSDL.
 */
export async function saveUpload(folder: string, file: File): Promise<string> {
  validateUpload(file);
  const relative = path.posix.join(folder, `${randomUUID()}__${safeFileName(file.name)}`);
  const absolute = resolveUploadPath(relative);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, Buffer.from(await file.arrayBuffer()));
  return relative;
}

/** Đổi đường dẫn tương đối thành tuyệt đối; chặn đường dẫn thoát ra ngoài thư mục uploads. */
export function resolveUploadPath(relative: string): string {
  const root = uploadRoot();
  const absolute = path.resolve(root, relative);
  if (absolute !== root && !absolute.startsWith(root + path.sep)) {
    throw new BusinessError("Đường dẫn file không hợp lệ.");
  }
  return absolute;
}

export async function deleteUpload(relative: string | null | undefined): Promise<void> {
  if (!relative) return;
  await rm(resolveUploadPath(relative), { force: true });
}

export async function readUpload(
  relative: string,
): Promise<{ data: Buffer; fileName: string; contentType: string }> {
  const data = await readFile(resolveUploadPath(relative));
  return { data, fileName: displayFileName(relative), contentType: contentTypeOf(relative) };
}

/** Tên hiển thị của file đã lưu (bỏ tiền tố uuid). */
export function displayFileName(relative: string): string {
  const base = path.posix.basename(relative);
  const index = base.indexOf("__");
  return index >= 0 ? base.slice(index + 2) : base;
}

export function contentTypeOf(fileName: string): string {
  return CONTENT_TYPES[extensionOf(fileName)] ?? "application/octet-stream";
}
