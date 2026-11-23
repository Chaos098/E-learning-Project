"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { type ActionState, formToObject, toActionState } from "@/server/action-state";
import { requireActor } from "@/server/auth/session";
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
  updateSection,
} from "@/server/courses/service";

const courseInput = (v: Record<string, string>) => ({
  name: v.name ?? "",
  description: v.description,
  status: v.status as "DRAFT" | "PUBLISHED" | "ARCHIVED" | undefined,
  dateEnd: v.dateEnd,
});
const sectionInput = (v: Record<string, string>) => ({ name: v.name ?? "", description: v.description });
const lessonInput = (v: Record<string, string>) => ({
  title: v.title ?? "",
  description: v.description,
  videoUrl: v.videoUrl,
  content: v.content,
});

function fileFrom(formData: FormData, name: string): File | null {
  const value = formData.get(name);
  return value instanceof File && value.size > 0 ? value : null;
}

// ---------- Môn học ----------

export async function createCourseAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireActor("ADMIN");
  const values = formToObject(formData);
  let courseId: number;
  try {
    const course = await createCourse(actor, courseInput(values));
    courseId = course.id;
  } catch (error) {
    return toActionState(error, values);
  }
  revalidatePath("/admin/courses");
  redirect(`/admin/courses/${courseId}`);
}

export async function updateCourseAction(
  courseId: number,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireActor("ADMIN");
  const values = formToObject(formData);
  try {
    await updateCourse(actor, courseId, courseInput(values));
  } catch (error) {
    return toActionState(error, values);
  }
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/courses");
  return { ok: true, message: "Đã lưu môn học.", values };
}

// ---------- Chương ----------

export async function createSectionAction(
  courseId: number,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireActor("ADMIN");
  const values = formToObject(formData);
  try {
    await createSection(actor, courseId, sectionInput(values));
  } catch (error) {
    return toActionState(error, values);
  }
  revalidatePath(`/admin/courses/${courseId}`);
  return { ok: true, message: "Đã thêm chương." };
}

export async function updateSectionAction(
  courseId: number,
  sectionId: number,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireActor("ADMIN");
  const values = formToObject(formData);
  try {
    await updateSection(actor, sectionId, sectionInput(values));
  } catch (error) {
    return toActionState(error, values);
  }
  revalidatePath(`/admin/courses/${courseId}`);
  return { ok: true, message: "Đã lưu chương.", values };
}

export async function deleteSectionAction(courseId: number, sectionId: number): Promise<ActionState> {
  const actor = await requireActor("ADMIN");
  try {
    await deleteSection(actor, sectionId);
  } catch (error) {
    return toActionState(error);
  }
  revalidatePath(`/admin/courses/${courseId}`);
  return { ok: true };
}

export async function moveSectionAction(
  courseId: number,
  sectionId: number,
  direction: "up" | "down",
): Promise<ActionState> {
  const actor = await requireActor("ADMIN");
  try {
    await moveSection(actor, { id: sectionId, direction });
  } catch (error) {
    return toActionState(error);
  }
  revalidatePath(`/admin/courses/${courseId}`);
  return { ok: true };
}

// ---------- Bài học ----------

export async function createLessonAction(
  courseId: number,
  sectionId: number,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireActor("ADMIN");
  const values = formToObject(formData);
  try {
    await createLesson(actor, sectionId, lessonInput(values), fileFrom(formData, "attachment"));
  } catch (error) {
    return toActionState(error, values);
  }
  revalidatePath(`/admin/courses/${courseId}`);
  return { ok: true, message: "Đã thêm bài học." };
}

export async function updateLessonAction(
  courseId: number,
  lessonId: number,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireActor("ADMIN");
  const values = formToObject(formData);
  try {
    await updateLesson(actor, lessonId, lessonInput(values), {
      attachment: fileFrom(formData, "attachment"),
      removeAttachment: values.removeAttachment === "on",
    });
  } catch (error) {
    return toActionState(error, values);
  }
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/admin/courses/${courseId}/lessons/${lessonId}`);
  return { ok: true, message: "Đã lưu bài học.", values };
}

export async function deleteLessonAction(courseId: number, lessonId: number): Promise<ActionState> {
  const actor = await requireActor("ADMIN");
  try {
    await deleteLesson(actor, lessonId);
  } catch (error) {
    return toActionState(error);
  }
  revalidatePath(`/admin/courses/${courseId}`);
  return { ok: true };
}

export async function moveLessonAction(
  courseId: number,
  lessonId: number,
  direction: "up" | "down",
): Promise<ActionState> {
  const actor = await requireActor("ADMIN");
  try {
    await moveLesson(actor, { id: lessonId, direction });
  } catch (error) {
    return toActionState(error);
  }
  revalidatePath(`/admin/courses/${courseId}`);
  return { ok: true };
}
