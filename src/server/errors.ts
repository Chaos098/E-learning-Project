/** Lỗi do vi phạm quy tắc nghiệp vụ; `message` bằng tiếng Việt, hiển thị được cho người dùng. */
export class BusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessError";
  }
}

/** Người dùng không có quyền thực hiện thao tác (US-03, BR-20). */
export class ForbiddenError extends BusinessError {
  constructor(message = "Bạn không có quyền thực hiện thao tác này.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Không tìm thấy dữ liệu hoặc dữ liệu không thuộc phạm vi của người dùng. */
export class NotFoundError extends BusinessError {
  constructor(message = "Không tìm thấy dữ liệu.") {
    super(message);
    this.name = "NotFoundError";
  }
}
