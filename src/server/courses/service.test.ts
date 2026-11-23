// @vitest-environment node
// Test tích hợp — cần CSDL Docker đang chạy (npm run db:up).
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import type { Actor } from "@/server/auth/roles";
import {
  adminGetCourse,
  canDownloadLessonAttachment,
  getLessonAttachmentForDownload,
  getPublishedCourseDetail,
  listPublishedCourses,
} from "@/server/courses/queries";
import {
  createCourse,
  createLesson,
  createSection,
  deleteLesson,
  deleteSection,
  moveLesson,
  moveSection,
  updateCourse,
  updateLesson,
} from "@/server/courses/service";
import { ForbiddenError } from "@/server/errors";
import { resolveUploadPath } from "@/server/files/storage";
import { dateFromToday, TestData } from "@/test/factories";

const data = new TestData();
const uploadDir = path.resolve("test-results", `uploads-${data.tag}`);
let admin: Actor;
let teacher: Actor;
let otherTeacher: Actor;
let student: Actor;

function pdf(name = "slide.pdf", size = 1024) {
  return new File([new Uint8Array(size)], name, { type: "application/pdf" });
}

beforeAll(async () => {
  process.env.UPLOAD_DIR = uploadDir;
  admin = await data.user("ADMIN");
  teacher = await data.user("TEACHER");
  otherTeacher = await data.user("TEACHER");
  student = await data.user("STUDENT");
});

afterAll(async () => {
  await data.cleanup();
  await rm(uploadDir, { recursive: true, force: true });
});

describe("US-07: Admin tạo / sửa / ẩn môn học", () => {
  it("ghi admin_id người tạo, ngày tạo tự ghi, mặc định DRAFT", async () => {
    const course = await createCourse(admin, {
      name: `Môn ${data.tag}`,
      description: "Mô tả",
      dateEnd: "2027-06-30",
    });
    data.trackCourse(course.id);
    expect(course.adminId).toBe(admin.id);
    expect(course.status).toBe("DRAFT");
    expect(course.dateCreated).toBeInstanceOf(Date);
    expect(course.dateEnd?.toISOString()).toBe("2027-06-30T00:00:00.000Z");
  });

  it("ẩn môn học bằng trạng thái ARCHIVED (không xoá — BR-19)", async () => {
    const course = await data.course(admin.id, "PUBLISHED");
    const updated = await updateCourse(admin, course.id, { name: course.name, status: "ARCHIVED" });
    expect(updated.status).toBe("ARCHIVED");
    expect(await db.course.findUnique({ where: { id: course.id } })).not.toBeNull();
  });

  it("US-03: chỉ Admin được tạo / sửa môn học", async () => {
    await expect(createCourse(teacher, { name: "Không được" })).rejects.toThrow(ForbiddenError);
    await expect(createCourse(student, { name: "Không được" })).rejects.toThrow(ForbiddenError);
  });
});

describe("US-08: chương của môn học", () => {
  it("chương mới được đánh số tiếp theo; đổi thứ tự; xoá thì đánh số lại", async () => {
    const course = await data.course(admin.id);
    const s1 = await createSection(admin, course.id, { name: "Chương A" });
    const s2 = await createSection(admin, course.id, { name: "Chương B" });
    const s3 = await createSection(admin, course.id, { name: "Chương C" });
    expect([s1.orderNo, s2.orderNo, s3.orderNo]).toEqual([1, 2, 3]);

    await moveSection(admin, { id: s3.id, direction: "up" });
    let names = (await adminGetCourse(admin, course.id)).sections.map((section) => section.name);
    expect(names).toEqual(["Chương A", "Chương C", "Chương B"]);

    await moveSection(admin, { id: s1.id, direction: "up" }); // đã ở đầu: không đổi
    await deleteSection(admin, s1.id);
    const sections = (await adminGetCourse(admin, course.id)).sections;
    names = sections.map((section) => section.name);
    expect(names).toEqual(["Chương C", "Chương B"]);
    expect(sections.map((section) => section.orderNo)).toEqual([1, 2]);
  });

  it("không xoá được chương còn bài học", async () => {
    const course = await data.course(admin.id);
    const section = await createSection(admin, course.id, { name: "Có bài" });
    await createLesson(admin, section.id, { title: "Bài 1" });
    await expect(deleteSection(admin, section.id)).rejects.toThrow(/còn bài học/);
  });
});

describe("US-09: bài học kết hợp video, văn bản, file đính kèm", () => {
  it("lưu đủ các loại nội dung, đánh số thứ tự trong chương, đổi thứ tự được", async () => {
    const course = await data.course(admin.id);
    const section = await createSection(admin, course.id, { name: "Chương 1" });
    const l1 = await createLesson(
      admin,
      section.id,
      { title: "Bài 1", videoUrl: "https://www.youtube.com/watch?v=abc", content: "Văn bản" },
      pdf(),
    );
    const l2 = await createLesson(admin, section.id, { title: "Bài 2" });
    expect(l1.orderNo).toBe(1);
    expect(l2.orderNo).toBe(2);
    expect(l1.videoUrl).toContain("youtube");
    expect(l1.content).toBe("Văn bản");
    expect(l1.attachmentUrl).toMatch(/^lessons\/.+__slide\.pdf$/);
    expect(existsSync(resolveUploadPath(l1.attachmentUrl!))).toBe(true);

    await moveLesson(admin, { id: l2.id, direction: "up" });
    const lessons = (await adminGetCourse(admin, course.id)).sections[0]!.lessons;
    expect(lessons.map((lesson) => lesson.title)).toEqual(["Bài 2", "Bài 1"]);
  });

  it("NFR-05: từ chối file sai định dạng hoặc quá 10 MB, không tạo bài học", async () => {
    const course = await data.course(admin.id);
    const section = await createSection(admin, course.id, { name: "Chương 1" });
    await expect(createLesson(admin, section.id, { title: "X" }, pdf("virus.exe"))).rejects.toThrow(
      /Chỉ nhận/,
    );
    await expect(
      createLesson(admin, section.id, { title: "X" }, pdf("big.pdf", 10 * 1024 * 1024 + 1)),
    ).rejects.toThrow(/10 MB/);
    expect(await db.lesson.count({ where: { sectionId: section.id } })).toBe(0);
  });

  it("thay file thì xoá file cũ; bỏ file đính kèm; xoá bài học thì xoá file", async () => {
    const course = await data.course(admin.id);
    const section = await createSection(admin, course.id, { name: "Chương 1" });
    const lesson = await createLesson(admin, section.id, { title: "Bài" }, pdf("a.pdf"));
    const oldPath = resolveUploadPath(lesson.attachmentUrl!);

    const replaced = await updateLesson(admin, lesson.id, { title: "Bài" }, { attachment: pdf("b.pdf") });
    expect(replaced.attachmentUrl).toMatch(/__b\.pdf$/);
    expect(existsSync(oldPath)).toBe(false);

    const removed = await updateLesson(admin, lesson.id, { title: "Bài" }, { removeAttachment: true });
    expect(removed.attachmentUrl).toBeNull();
    expect(existsSync(resolveUploadPath(replaced.attachmentUrl!))).toBe(false);

    const withFile = await updateLesson(admin, lesson.id, { title: "Bài" }, { attachment: pdf("c.pdf") });
    await deleteLesson(admin, lesson.id);
    expect(existsSync(resolveUploadPath(withFile.attachmentUrl!))).toBe(false);
  });
});

describe("FR-2.4: quyền tải file đính kèm", () => {
  it("Admin và giảng viên dạy lớp của môn được tải; giảng viên khác, học viên (chưa có quyền), khách thì không", async () => {
    const course = await data.course(admin.id);
    const section = await createSection(admin, course.id, { name: "Chương 1" });
    const lesson = await createLesson(admin, section.id, { title: "Bài" }, pdf());
    await db.class.create({
      data: {
        courseId: course.id,
        teacherId: teacher.id,
        adminId: admin.id,
        name: `L-${data.tag}`,
        tuitionFee: 1_000_000,
        depositAmount: 200_000,
        minStudents: 1,
        maxStudents: 10,
        startDate: new Date(`${dateFromToday(10)}T00:00:00Z`),
        endDate: new Date(`${dateFromToday(40)}T00:00:00Z`),
      },
    });

    expect(await canDownloadLessonAttachment(admin, lesson.id)).toBe(true);
    expect(await canDownloadLessonAttachment(teacher, lesson.id)).toBe(true);
    expect(await canDownloadLessonAttachment(otherTeacher, lesson.id)).toBe(false);
    expect(await canDownloadLessonAttachment(student, lesson.id)).toBe(false);
    expect(await getLessonAttachmentForDownload(null, lesson.id)).toEqual({ status: "unauthenticated" });
    expect((await getLessonAttachmentForDownload(teacher, lesson.id)).status).toBe("ok");
  });
});

describe("US-10, US-11: danh mục và chi tiết môn học cho khách", () => {
  it("chỉ hiện môn PUBLISHED, tìm theo tên không phân biệt hoa thường", async () => {
    const published = await data.course(admin.id, "PUBLISHED", `Lập trình Kotlin ${data.tag}`);
    await data.course(admin.id, "DRAFT", `Lập trình Rust ${data.tag}`);
    await data.course(admin.id, "ARCHIVED", `Lập trình Go ${data.tag}`);

    const result = await listPublishedCourses({ q: `LẬP TRÌNH kotlin ${data.tag}` });
    expect(result.courses.map((course) => course.id)).toEqual([published.id]);
    const all = await listPublishedCourses({ q: data.tag });
    expect(all.courses.some((course) => course.name.includes("Rust") || course.name.includes("Go"))).toBe(
      false,
    );
  });

  it("phân trang 9 môn mỗi trang", async () => {
    for (let index = 0; index < 10; index += 1) {
      await data.course(admin.id, "PUBLISHED", `Phân trang ${data.tag} ${index}`);
    }
    const page1 = await listPublishedCourses({ q: `Phân trang ${data.tag}`, page: 1 });
    const page2 = await listPublishedCourses({ q: `Phân trang ${data.tag}`, page: 2 });
    expect(page1.total).toBe(10);
    expect(page1.pageCount).toBe(2);
    expect(page1.courses).toHaveLength(9);
    expect(page2.courses).toHaveLength(1);
  });

  it("chi tiết: tên chương, tên bài học, lớp đang nhận đăng ký; không lộ nội dung bài học", async () => {
    const course = await data.course(admin.id, "PUBLISHED");
    const section = await createSection(admin, course.id, { name: "Chương 1" });
    await createLesson(admin, section.id, {
      title: "Bài bí mật",
      content: "NỘI DUNG CHỈ DÀNH CHO HỌC VIÊN",
      videoUrl: "https://youtu.be/secret",
    });
    const base = {
      courseId: course.id,
      teacherId: teacher.id,
      adminId: admin.id,
      tuitionFee: 2_000_000,
      depositAmount: 500_000,
      minStudents: 1,
      maxStudents: 20,
      startDate: new Date(`${dateFromToday(10)}T00:00:00Z`),
      endDate: new Date(`${dateFromToday(60)}T00:00:00Z`),
    };
    await db.class.create({ data: { ...base, name: "Đang nhận" } });
    await db.class.create({ data: { ...base, name: "Đã huỷ", status: "CANCELLED" } });

    const detail = await getPublishedCourseDetail(course.id);
    expect(detail?.sections[0]?.lessons[0]?.title).toBe("Bài bí mật");
    expect(JSON.stringify(detail)).not.toContain("NỘI DUNG CHỈ DÀNH CHO HỌC VIÊN");
    expect(JSON.stringify(detail)).not.toContain("youtu.be/secret");
    expect(detail?.classes.map((item) => item.name)).toEqual(["Đang nhận"]);
    expect(detail?.classes[0]).toMatchObject({
      tuitionFee: 2_000_000,
      depositAmount: 500_000,
      seatsLeft: 20,
    });
    expect(detail?.classes[0]?.teacherName).toBe(teacher.name);
  });

  it("môn DRAFT không xem được ở trang công khai", async () => {
    const draft = await data.course(admin.id, "DRAFT");
    expect(await getPublishedCourseDetail(draft.id)).toBeNull();
  });
});
