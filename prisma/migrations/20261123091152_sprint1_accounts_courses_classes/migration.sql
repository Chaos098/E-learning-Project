-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'TEACHER', 'STUDENT');

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('ACTIVE', 'LOCKED');

-- CreateEnum
CREATE TYPE "course_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "class_status" AS ENUM ('UPCOMING', 'ONGOING', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "exam_status" AS ENUM ('DISABLED', 'SCHEDULED', 'OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "user" (
    "user_id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "hashed_pwd" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "role" "user_role" NOT NULL,
    "status" "user_status" NOT NULL DEFAULT 'ACTIVE',
    "date_created" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "admin" (
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "admin_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "teacher" (
    "user_id" INTEGER NOT NULL,
    "salary_coefficient" DECIMAL(4,2) NOT NULL DEFAULT 1.00,

    CONSTRAINT "teacher_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "student" (
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "student_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "course" (
    "course_id" SERIAL NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "course_name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "course_status" "course_status" NOT NULL DEFAULT 'DRAFT',
    "course_date_created" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "course_date_end" DATE,

    CONSTRAINT "course_pkey" PRIMARY KEY ("course_id")
);

-- CreateTable
CREATE TABLE "section" (
    "section_id" SERIAL NOT NULL,
    "course_id" INTEGER NOT NULL,
    "section_name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "order_no" INTEGER NOT NULL,

    CONSTRAINT "section_pkey" PRIMARY KEY ("section_id")
);

-- CreateTable
CREATE TABLE "lesson" (
    "lesson_id" SERIAL NOT NULL,
    "section_id" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "video_url" VARCHAR(500),
    "content" TEXT,
    "attachment_url" VARCHAR(500),
    "order_no" INTEGER NOT NULL,

    CONSTRAINT "lesson_pkey" PRIMARY KEY ("lesson_id")
);

-- CreateTable
CREATE TABLE "classes" (
    "class_id" SERIAL NOT NULL,
    "course_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "class_name" VARCHAR(100) NOT NULL,
    "status" "class_status" NOT NULL DEFAULT 'UPCOMING',
    "tuition_fee" INTEGER NOT NULL,
    "deposit_amount" INTEGER NOT NULL,
    "min_students" INTEGER NOT NULL,
    "max_students" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "date_class_created" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("class_id")
);

-- CreateTable
CREATE TABLE "exam" (
    "exam_id" SERIAL NOT NULL,
    "class_id" INTEGER NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "exam_name" VARCHAR(200),
    "description" TEXT,
    "max_attempts" INTEGER NOT NULL DEFAULT 1,
    "status" "exam_status" NOT NULL DEFAULT 'DISABLED',
    "date_created" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_pkey" PRIMARY KEY ("exam_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_role_idx" ON "user"("role");

-- CreateIndex
CREATE INDEX "course_admin_id_idx" ON "course"("admin_id");

-- CreateIndex
CREATE INDEX "course_course_status_idx" ON "course"("course_status");

-- CreateIndex
CREATE INDEX "course_course_name_idx" ON "course"("course_name");

-- CreateIndex
CREATE INDEX "section_course_id_order_no_idx" ON "section"("course_id", "order_no");

-- CreateIndex
CREATE INDEX "lesson_section_id_order_no_idx" ON "lesson"("section_id", "order_no");

-- CreateIndex
CREATE INDEX "classes_course_id_idx" ON "classes"("course_id");

-- CreateIndex
CREATE INDEX "classes_teacher_id_idx" ON "classes"("teacher_id");

-- CreateIndex
CREATE INDEX "classes_admin_id_idx" ON "classes"("admin_id");

-- CreateIndex
CREATE INDEX "classes_status_start_date_idx" ON "classes"("status", "start_date");

-- CreateIndex
CREATE UNIQUE INDEX "exam_class_id_key" ON "exam"("class_id");

-- CreateIndex
CREATE INDEX "exam_admin_id_idx" ON "exam"("admin_id");

-- AddForeignKey
ALTER TABLE "admin" ADD CONSTRAINT "admin_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher" ADD CONSTRAINT "teacher_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course" ADD CONSTRAINT "course_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section" ADD CONSTRAINT "section_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "course"("course_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "section"("section_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "course"("course_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teacher"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam" ADD CONSTRAINT "exam_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("class_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam" ADD CONSTRAINT "exam_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Ràng buộc CHECK theo docs/database/data-dictionary.md (Prisma không khai báo được, viết tay)
ALTER TABLE "teacher" ADD CONSTRAINT "teacher_salary_coefficient_check" CHECK ("salary_coefficient" > 0);
ALTER TABLE "section" ADD CONSTRAINT "section_order_no_check" CHECK ("order_no" >= 1);
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_order_no_check" CHECK ("order_no" >= 1);
ALTER TABLE "classes" ADD CONSTRAINT "classes_tuition_fee_check" CHECK ("tuition_fee" >= 0);
ALTER TABLE "classes" ADD CONSTRAINT "classes_deposit_amount_check" CHECK ("deposit_amount" >= 0 AND "deposit_amount" <= "tuition_fee");
ALTER TABLE "classes" ADD CONSTRAINT "classes_min_students_check" CHECK ("min_students" >= 1);
ALTER TABLE "classes" ADD CONSTRAINT "classes_max_students_check" CHECK ("max_students" >= "min_students");
ALTER TABLE "classes" ADD CONSTRAINT "classes_dates_check" CHECK ("end_date" > "start_date");
ALTER TABLE "exam" ADD CONSTRAINT "exam_max_attempts_check" CHECK ("max_attempts" >= 1);
