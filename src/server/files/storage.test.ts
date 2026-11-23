import { describe, expect, it } from "vitest";

import { BusinessError } from "@/server/errors";
import {
  contentTypeOf,
  displayFileName,
  resolveUploadPath,
  safeFileName,
  validateUpload,
} from "@/server/files/storage";

const MB = 1024 * 1024;

describe("NFR-05: kiểm tra file tải lên", () => {
  it("nhận đúng định dạng cho phép, tối đa 10 MB", () => {
    for (const name of ["a.pdf", "b.DOCX", "c.pptx", "d.zip", "e.png", "f.jpg", "g.jpeg"]) {
      expect(() => validateUpload({ name, size: MB })).not.toThrow();
    }
    expect(() => validateUpload({ name: "big.pdf", size: 10 * MB })).not.toThrow();
  });

  it("từ chối file quá 10 MB, file rỗng và định dạng khác", () => {
    expect(() => validateUpload({ name: "big.pdf", size: 10 * MB + 1 })).toThrow(/10 MB/);
    expect(() => validateUpload({ name: "empty.pdf", size: 0 })).toThrow(BusinessError);
    expect(() => validateUpload({ name: "virus.exe", size: 100 })).toThrow(/Chỉ nhận/);
    expect(() => validateUpload({ name: "noext", size: 100 })).toThrow(/Chỉ nhận/);
  });

  it("không cho đường dẫn thoát khỏi thư mục uploads", () => {
    expect(() => resolveUploadPath("../.env")).toThrow(BusinessError);
    expect(() => resolveUploadPath("lessons/../../package.json")).toThrow(BusinessError);
    expect(resolveUploadPath("lessons/a.pdf")).toMatch(/uploads[/\\]lessons[/\\]a\.pdf$/);
  });

  it("làm sạch tên file gốc và hiển thị lại không kèm mã sinh tự động", () => {
    expect(safeFileName("Bài giảng chương 1 (bản cuối).PDF")).toBe("Bai-giang-chuong-1-ban-cuoi.pdf");
    expect(safeFileName("../../etc/passwd.zip")).toBe("passwd.zip");
    expect(displayFileName("lessons/1234-abcd__Slide.pdf")).toBe("Slide.pdf");
    expect(contentTypeOf("Slide.pdf")).toBe("application/pdf");
  });
});
