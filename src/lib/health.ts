import { db } from "@/lib/db";

export type DatabaseHealth = { ok: true; version: string } | { ok: false; error: string };

/** Kiểm tra kết nối CSDL bằng một truy vấn chỉ đọc. */
export async function checkDatabase(): Promise<DatabaseHealth> {
  try {
    const rows = await db.$queryRaw<
      { version: string }[]
    >`SELECT current_setting('server_version') AS version`;
    return { ok: true, version: rows[0]?.version ?? "không rõ" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Lỗi không xác định" };
  }
}
