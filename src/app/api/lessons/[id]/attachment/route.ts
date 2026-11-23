import { idParam } from "@/lib/params";
import { getActor } from "@/server/auth/session";
import { getLessonAttachmentForDownload } from "@/server/courses/queries";
import { readUpload } from "@/server/files/storage";

/**
 * FR-2.4, NFR-05: tải file đính kèm của bài học.
 * File không được phục vụ như file tĩnh; mọi lượt tải đều kiểm tra quyền ở đây.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/lessons/[id]/attachment">) {
  const lessonId = idParam((await ctx.params).id);
  if (!lessonId) return new Response("Không tìm thấy.", { status: 404 });

  const result = await getLessonAttachmentForDownload(await getActor(), lessonId);
  if (result.status !== "ok") {
    const [message, status] =
      result.status === "unauthenticated"
        ? ["Bạn cần đăng nhập.", 401]
        : result.status === "forbidden"
          ? ["Bạn không có quyền tải file này.", 403]
          : ["Bài học không có file đính kèm.", 404];
    return new Response(message, { status });
  }

  try {
    const file = await readUpload(result.path);
    return new Response(new Uint8Array(file.data), {
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `attachment; filename="${file.fileName}"; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Không đọc được file.", { status: 404 });
  }
}
