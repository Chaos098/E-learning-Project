import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { requireActor } from "@/server/auth/session";
import { teacherListClasses } from "@/server/classes/queries";

export const metadata: Metadata = { title: "Lớp của tôi" };

/** US-13: các lớp được phân công kèm môn học, thời gian, sĩ số. */
export default async function TeacherHomePage() {
  const actor = await requireActor("TEACHER");
  const classes = await teacherListClasses(actor);
  return (
    <>
      <PageHeader title="Lớp của tôi" description={`${classes.length} lớp được phân công`} />
      {classes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-600">
          Bạn chưa được phân công lớp nào.
        </p>
      ) : (
        <ul className="grid gap-3" aria-label="Lớp được phân công">
          {classes.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200 p-4"
              data-testid="teacher-class"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {item.name} · {item.course.name}
                </p>
                <p className="text-sm text-neutral-600">
                  {formatDate(item.startDate)} – {formatDate(item.endDate)} · Sĩ số {item.studentCount} /{" "}
                  {item.maxStudents}
                </p>
              </div>
              <StatusBadge status={item.status} />
              <Link
                href={`/teacher/classes/${item.id}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Vào lớp
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
