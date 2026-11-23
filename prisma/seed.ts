// Dữ liệu mẫu để demo (T-1.2). Chạy: npm run db:seed
// Chỉ nạp khi CSDL chưa có tài khoản nào, nên chạy lại nhiều lần không bị trùng.
// Mọi tài khoản mẫu dùng chung mật khẩu DEMO_PASSWORD — chỉ dùng trên máy cá nhân.
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { todayDate } from "../src/lib/format";
import { hashPassword } from "../src/lib/password";

export const DEMO_PASSWORD = "matkhau123";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

const COURSES = [
  {
    name: "Lập trình Python cơ bản",
    description: "Làm quen với Python: biến, kiểu dữ liệu, câu lệnh điều kiện, vòng lặp, hàm và xử lý file.",
    status: "PUBLISHED" as const,
    sections: [
      {
        name: "Làm quen với Python",
        lessons: ["Cài đặt Python và VS Code", "Chương trình đầu tiên", "Biến và kiểu dữ liệu"],
      },
      { name: "Cấu trúc điều khiển", lessons: ["Câu lệnh if", "Vòng lặp for và while"] },
      { name: "Hàm và module", lessons: ["Định nghĩa hàm", "Module và gói"] },
    ],
  },
  {
    name: "Cơ sở dữ liệu",
    description: "Mô hình quan hệ, thiết kế ERD, chuẩn hoá và truy vấn SQL với PostgreSQL.",
    status: "PUBLISHED" as const,
    sections: [
      { name: "Mô hình quan hệ", lessons: ["Bảng, khoá chính, khoá ngoại", "Sơ đồ ERD"] },
      { name: "Truy vấn SQL", lessons: ["SELECT và WHERE", "JOIN", "GROUP BY và HAVING"] },
    ],
  },
  {
    name: "Thiết kế web với HTML và CSS",
    description: "Xây dựng trang web tĩnh, bố cục responsive bằng Flexbox và Grid.",
    status: "PUBLISHED" as const,
    sections: [
      { name: "HTML", lessons: ["Cấu trúc trang HTML", "Form và bảng"] },
      { name: "CSS", lessons: ["Bộ chọn và hộp", "Flexbox", "Grid và responsive"] },
    ],
  },
  {
    name: "Kiểm thử phần mềm",
    description: "Môn học đang soạn nội dung, chưa mở cho học viên.",
    status: "DRAFT" as const,
    sections: [{ name: "Tổng quan kiểm thử", lessons: ["Các mức kiểm thử"] }],
  },
];

async function main() {
  const userCount = await db.user.count();
  if (userCount > 0) {
    console.log(`CSDL đã có ${userCount} tài khoản — bỏ qua dữ liệu mẫu.`);
    return;
  }

  const hashedPwd = await hashPassword(DEMO_PASSWORD);

  await db.$transaction(
    async (tx) => {
      const admin = await tx.user.create({
        data: {
          email: "admin@elearning.local",
          name: "Quản trị viên",
          hashedPwd,
          role: "ADMIN",
          admin: { create: {} },
        },
      });

      const teacherData = [
        { email: "gv.tranb@elearning.local", name: "Trần Văn B", coefficient: "1.50" },
        { email: "gv.lec@elearning.local", name: "Lê Thị C", coefficient: "1.20" },
        { email: "gv.phamd@elearning.local", name: "Phạm Văn D", coefficient: "1.00" },
      ];
      const teachers = [];
      for (const item of teacherData) {
        teachers.push(
          await tx.user.create({
            data: {
              email: item.email,
              name: item.name,
              hashedPwd,
              role: "TEACHER",
              teacher: { create: { salaryCoefficient: new Prisma.Decimal(item.coefficient) } },
            },
          }),
        );
      }

      const studentNames = [
        "Nguyễn Văn An",
        "Trần Thị Bình",
        "Lê Văn Cường",
        "Phạm Thị Dung",
        "Hoàng Văn Em",
        "Vũ Thị Giang",
        "Đặng Văn Hùng",
        "Bùi Thị Lan",
        "Đỗ Văn Minh",
        "Ngô Thị Nga",
      ];
      for (const [index, name] of studentNames.entries()) {
        await tx.user.create({
          data: {
            email: `hv${String(index + 1).padStart(2, "0")}@elearning.local`,
            name,
            hashedPwd,
            role: "STUDENT",
            student: { create: {} },
          },
        });
      }

      const courseIds: number[] = [];
      for (const course of COURSES) {
        const created = await tx.course.create({
          data: {
            adminId: admin.id,
            name: course.name,
            description: course.description,
            status: course.status,
          },
        });
        courseIds.push(created.id);
        for (const [sIndex, section] of course.sections.entries()) {
          await tx.section.create({
            data: {
              courseId: created.id,
              name: section.name,
              orderNo: sIndex + 1,
              lessons: {
                create: section.lessons.map((title, lIndex) => ({
                  title,
                  orderNo: lIndex + 1,
                  content: `Nội dung bài "${title}". Bài học mẫu gồm phần văn bản và có thể kèm video.`,
                  videoUrl: lIndex === 0 ? "https://www.youtube.com/watch?v=rfscVS0vtbw" : null,
                })),
              },
            },
          });
        }
      }

      const today = todayDate();
      const classData = [
        {
          course: 0,
          teacher: 0,
          name: "PY-01",
          fee: 2_000_000,
          deposit: 500_000,
          min: 5,
          max: 30,
          start: 14,
          weeks: 8,
        },
        {
          course: 0,
          teacher: 1,
          name: "PY-02",
          fee: 2_000_000,
          deposit: 500_000,
          min: 5,
          max: 20,
          start: 28,
          weeks: 8,
        },
        {
          course: 1,
          teacher: 1,
          name: "DB-01",
          fee: 1_500_000,
          deposit: 400_000,
          min: 5,
          max: 25,
          start: 21,
          weeks: 6,
        },
        {
          course: 2,
          teacher: 2,
          name: "WEB-01",
          fee: 1_800_000,
          deposit: 450_000,
          min: 3,
          max: 15,
          start: 10,
          weeks: 6,
        },
      ];
      for (const item of classData) {
        const startDate = addDays(today, item.start);
        await tx.class.create({
          data: {
            courseId: courseIds[item.course]!,
            teacherId: teachers[item.teacher]!.id,
            adminId: admin.id,
            name: item.name,
            tuitionFee: item.fee,
            depositAmount: item.deposit,
            minStudents: item.min,
            maxStudents: item.max,
            startDate,
            endDate: addDays(startDate, item.weeks * 7),
            exam: { create: { adminId: admin.id, status: "DISABLED" } },
          },
        });
      }
    },
    { timeout: 30_000 },
  );

  console.log("Đã nạp dữ liệu mẫu: 1 Admin, 3 giảng viên, 10 học viên, 4 môn học, 4 lớp.");
  console.log(`Mật khẩu chung của tài khoản mẫu: ${DEMO_PASSWORD} (ví dụ admin@elearning.local).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
